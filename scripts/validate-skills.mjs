#!/usr/bin/env node
/**
 * Agent Skills validator (no dependencies).
 *
 * Spec: https://agentskills.io/specification
 * The reference library `skills-ref` is Python and its own README calls it "for demonstration
 * purposes only" → we keep our own checks here for CI.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SKILLS_DIR = join(ROOT, 'skills')

const SPEC_FIELDS = new Set(['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools'])
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_NAME = 64
const MAX_DESCRIPTION = 1024
const MAX_COMPATIBILITY = 500
const MAX_LINES = 500
const REQUIRED_PREFIX = 'estorepark-'

const errors = []
const warnings = []
const fail = (where, msg) => errors.push(`${where}: ${msg}`)
const warn = (where, msg) => warnings.push(`${where}: ${msg}`)

/** Reads only the top-level frontmatter keys (that is all the spec needs). */
function parseFrontmatter(raw, where) {
  if (!raw.startsWith('---\n')) {
    fail(where, 'no YAML frontmatter (the file must start with `---`)')
    return null
  }
  const end = raw.indexOf('\n---', 3)
  if (end === -1) {
    fail(where, 'unterminated frontmatter (`---`)')
    return null
  }
  const fields = {}
  const rawUnquoted = new Set()
  for (const line of raw.slice(4, end).split('\n')) {
    if (!line.trim() || line.startsWith('#') || /^\s/.test(line)) continue // nested lines are not read as values
    const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (!m) continue
    const value = m[2].trim()
    if (value && !/^["']/.test(value)) rawUnquoted.add(m[1])
    fields[m[1]] = value.replace(/^["']|["']$/g, '')
  }
  return { fields, rawUnquoted, body: raw.slice(end + 4) }
}

function checkSkill(name) {
  const dir = join(SKILLS_DIR, name)
  const file = join(dir, 'SKILL.md')
  const where = `skills/${name}`
  if (!existsSync(file)) return fail(where, 'SKILL.md missing')

  const raw = readFileSync(file, 'utf8')
  const parsed = parseFrontmatter(raw, where)
  if (!parsed) return
  const { fields, rawUnquoted, body } = parsed

  if (!fields.name) fail(where, '`name` is required')
  else {
    if (fields.name !== name) fail(where, `\`name\` (${fields.name}) must match the directory name`)
    if (fields.name.length > MAX_NAME) fail(where, `\`name\` exceeds ${MAX_NAME} characters`)
    if (!NAME_RE.test(fields.name)) fail(where, '`name` may contain only a-z0-9 and single hyphens, and cannot start or end with one')
    if (!fields.name.startsWith(REQUIRED_PREFIX)) fail(where, `\`name\` must start with "${REQUIRED_PREFIX}" (the namespace is global)`)
  }

  // An unquoted YAML scalar cannot contain ": " — the parser reads it as a nested mapping and
  // the skill is SKIPPED SILENTLY (`npx skills add` prints a warning and moves on).
  for (const [key, value] of Object.entries(fields)) {
    if (rawUnquoted.has(key) && value.includes(': '))
      fail(where, `unquoted \`${key}\` contains ": " — YAML reads that as a nested mapping; quote the value or rephrase it`)
  }

  if (!fields.description) fail(where, '`description` is required')
  else if (fields.description.length > MAX_DESCRIPTION) fail(where, `\`description\` exceeds ${MAX_DESCRIPTION} characters`)

  if (fields.compatibility && fields.compatibility.length > MAX_COMPATIBILITY)
    fail(where, `\`compatibility\` exceeds ${MAX_COMPATIBILITY} characters`)

  for (const key of Object.keys(fields))
    if (!SPEC_FIELDS.has(key)) warn(where, `frontmatter field outside the spec: \`${key}\``)

  const lines = raw.split('\n').length
  if (lines > MAX_LINES) warn(where, `SKILL.md is ${lines} lines — over the ${MAX_LINES} limit, move detail into references/`)

  // Do the relative references in the body actually exist?
  const refs = new Set()
  for (const m of body.matchAll(/\]\(([^)#:]+\.(?:md|mjs|js|json|vitrine|txt))\)/g)) refs.add(m[1])
  for (const m of body.matchAll(/`((?:references|scripts|assets)\/[^`]+)`/g)) refs.add(m[1])
  for (const ref of refs) {
    if (ref.startsWith('/') || ref.includes('..')) { warn(where, `absolute or upward reference: ${ref}`); continue }
    if (!existsSync(join(dir, ref))) fail(where, `dead reference: ${ref}`)
  }
}

const skills = readdirSync(SKILLS_DIR).filter((n) => statSync(join(SKILLS_DIR, n)).isDirectory())
if (skills.length === 0) fail('skills/', 'no skills found')
skills.forEach(checkSkill)

// Do the catalogue files cover every skill?
const listed = new Set(JSON.parse(readFileSync(join(ROOT, 'skills.sh.json'), 'utf8')).groupings.flatMap((g) => g.skills))
for (const name of skills) if (!listed.has(name)) fail('skills.sh.json', `${name} is not in any group`)

const plugins = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/marketplace.json'), 'utf8')).plugins
const pluginSkills = new Set(plugins.flatMap((p) => p.skills ?? []))
for (const name of skills) if (!pluginSkills.has(`./skills/${name}`)) fail('.claude-plugin/marketplace.json', `${name} is not listed`)
for (const path of pluginSkills) if (!existsSync(join(ROOT, path))) fail('.claude-plugin/marketplace.json', `path does not exist: ${path}`)

for (const w of warnings) console.warn(`warn   ${w}`)
for (const e of errors) console.error(`ERROR  ${e}`)
console.log(`\n${skills.length} skill(s) checked — ${errors.length} error(s), ${warnings.length} warning(s)`)
process.exit(errors.length > 0 ? 1 : 0)
