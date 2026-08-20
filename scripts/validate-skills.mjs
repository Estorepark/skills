#!/usr/bin/env node
/**
 * Agent Skills doğrulayıcı (bağımlılıksız).
 *
 * Spec: https://agentskills.io/specification
 * Referans kütüphane `skills-ref` Python'dur ve kendi README'sinde "yalnız gösterim amaçlı"
 * der → CI için burada kendi kontrollerimizi tutuyoruz.
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

/** Frontmatter'ın yalnız üst seviye anahtarlarını okur (spec'in ihtiyacı bu kadar). */
function parseFrontmatter(raw, where) {
  if (!raw.startsWith('---\n')) {
    fail(where, 'YAML frontmatter yok (dosya `---` ile başlamalı)')
    return null
  }
  const end = raw.indexOf('\n---', 3)
  if (end === -1) {
    fail(where, 'frontmatter kapanmamış (`---`)')
    return null
  }
  const fields = {}
  const rawUnquoted = new Set()
  for (const line of raw.slice(4, end).split('\n')) {
    if (!line.trim() || line.startsWith('#') || /^\s/.test(line)) continue // iç içe satırlar: değer olarak okumayız
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
  if (!existsSync(file)) return fail(where, 'SKILL.md yok')

  const raw = readFileSync(file, 'utf8')
  const parsed = parseFrontmatter(raw, where)
  if (!parsed) return
  const { fields, rawUnquoted, body } = parsed

  if (!fields.name) fail(where, '`name` zorunlu')
  else {
    if (fields.name !== name) fail(where, `\`name\` (${fields.name}) dizin adıyla aynı olmalı`)
    if (fields.name.length > MAX_NAME) fail(where, `\`name\` ${MAX_NAME} karakteri aşıyor`)
    if (!NAME_RE.test(fields.name)) fail(where, '`name` yalnız a-z0-9 ve tek tire içerebilir, tire ile başlayıp bitemez')
    if (!fields.name.startsWith(REQUIRED_PREFIX)) fail(where, `\`name\` "${REQUIRED_PREFIX}" ile başlamalı (isim alanı global)`)
  }

  // Tırnaksız bir YAML skaları ": " içeremez — parser bunu iç içe mapping sanar ve
  // skill'i SESSİZCE atlar (`npx skills add` uyarı basıp geçer). Doğrulayıcı yakalamalı.
  for (const [key, value] of Object.entries(fields)) {
    if (rawUnquoted.has(key) && value.includes(': '))
      fail(where, `\`${key}\` tırnaksız değerinde ": " var — YAML bunu iç içe mapping sanar, ya tırnak içine alın ya ifadeyi değiştirin`)
  }

  if (!fields.description) fail(where, '`description` zorunlu')
  else if (fields.description.length > MAX_DESCRIPTION) fail(where, `\`description\` ${MAX_DESCRIPTION} karakteri aşıyor`)

  if (fields.compatibility && fields.compatibility.length > MAX_COMPATIBILITY)
    fail(where, `\`compatibility\` ${MAX_COMPATIBILITY} karakteri aşıyor`)

  for (const key of Object.keys(fields))
    if (!SPEC_FIELDS.has(key)) warn(where, `spec dışı frontmatter alanı: \`${key}\``)

  const lines = raw.split('\n').length
  if (lines > MAX_LINES) warn(where, `SKILL.md ${lines} satır — ${MAX_LINES} sınırını aşıyor, detayı references/'a taşıyın`)

  // Gövdedeki relative referanslar gerçekten var mı?
  const refs = new Set()
  for (const m of body.matchAll(/\]\(([^)#:]+\.(?:md|mjs|js|json|vitrine|txt))\)/g)) refs.add(m[1])
  for (const m of body.matchAll(/`((?:references|scripts|assets)\/[^`]+)`/g)) refs.add(m[1])
  for (const ref of refs) {
    if (ref.startsWith('/') || ref.includes('..')) { warn(where, `mutlak/yukarı referans: ${ref}`); continue }
    if (!existsSync(join(dir, ref))) fail(where, `ölü referans: ${ref}`)
  }
}

const skills = readdirSync(SKILLS_DIR).filter((n) => statSync(join(SKILLS_DIR, n)).isDirectory())
if (skills.length === 0) fail('skills/', 'hiç skill yok')
skills.forEach(checkSkill)

// Katalog dosyaları her skill'i kapsıyor mu?
const listed = new Set(JSON.parse(readFileSync(join(ROOT, 'skills.sh.json'), 'utf8')).groupings.flatMap((g) => g.skills))
for (const name of skills) if (!listed.has(name)) fail('skills.sh.json', `${name} hiçbir gruba girmemiş`)

const plugins = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/marketplace.json'), 'utf8')).plugins
const pluginSkills = new Set(plugins.flatMap((p) => p.skills ?? []))
for (const name of skills) if (!pluginSkills.has(`./skills/${name}`)) fail('.claude-plugin/marketplace.json', `${name} listelenmemiş`)
for (const path of pluginSkills) if (!existsSync(join(ROOT, path))) fail('.claude-plugin/marketplace.json', `olmayan yol: ${path}`)

for (const w of warnings) console.warn(`uyarı  ${w}`)
for (const e of errors) console.error(`HATA   ${e}`)
console.log(`\n${skills.length} skill kontrol edildi — ${errors.length} hata, ${warnings.length} uyarı`)
process.exit(errors.length > 0 ? 1 : 0)
