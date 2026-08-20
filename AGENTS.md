# How to write a skill in this repo

Sources: the [Agent Skills specification](https://agentskills.io/specification) and its
[best practices](https://agentskills.io/skill-creation/best-practices). What follows is specific
to this repo — it does not repeat the spec, it narrows it.

## Invariants

1. **Directory name = `name`.** A spec requirement. The directory is `skills/<name>/` with a
   `SKILL.md` inside.
2. **The `estorepark-` prefix is mandatory.** Skills are installed into a flat directory on the
   consumer side (`.claude/skills/`, `.agents/skills/`) — the namespace is global. An unprefixed
   `theme` skill would collide with one from another repo.
3. **`SKILL.md` ≤ 500 lines.** Detail goes into `references/` and is linked from the body with
   **when to read it** ("read `references/errors.md` if the server returns 4xx"). A generic "see
   references/ for details" does not work.
4. **Language: English body.** The repo is public and the skills are consumed agent-agnostically.
   The `description` field, however, is **bilingual**: activation depends entirely on matching
   the description and our users write Turkish prompts, so the English "what + when" sentence is
   followed by Turkish trigger phrases. Merchant-facing example values (theme `label` / `default`
   strings) are written in the store's language — that is not an exception, it is the natural
   language of the sample data.
5. **Write from the real surface.** Commands, flags, error codes and file names are verified
   against the CLI or monorepo source before they are written down. An invented flag sends the
   agent into trial and error.
6. **No secrets.** Tokens, real store slugs and internal infrastructure details (gateway routes,
   internal service hosts) never enter a skill. This repo is public.

## Content priority

The most valuable part is **Gotchas**: the places where a reasonable assumption is wrong
(`theme push` replaces the DRAFT, a schema `default` is not applied at render time…). Ordinary
knowledge — what a zip is, how HTTP works — is not written down.

When you correct an agent that got something wrong, add the correction to the relevant skill's
Gotchas section. It is the most direct way to improve a skill.

## Frontmatter

Fields the spec allows: `name`, `description`, `license`, `compatibility`, `metadata`,
`allowed-tools`. In this repo:

```yaml
---
name: estorepark-<topic>
description: <English what + when>. <Turkish trigger phrases>.
license: MIT
metadata:
  author: estorepark
  version: "0.2.0"
---
```

Beware of YAML: an unquoted scalar cannot contain `": "` — the parser reads it as a nested
mapping and the skill is **skipped silently**. The validator catches this.

`version` is bumped by hand; `npx skills update` pulls from the default branch and does no
semver resolution, so `main` must always be releasable.

## Validation

```bash
node scripts/validate-skills.mjs
```

What it checks: frontmatter presence and fields, the `name` regex and its match with the
directory, description length, `SKILL.md` line count, that relative links in the body exist, and
that `skills.sh.json` and `.claude-plugin/marketplace.json` cover every skill.

## Adding a new skill

1. Create `skills/estorepark-<name>/SKILL.md`.
2. Add the name to the right group in `skills.sh.json` (or create a group).
3. Add the path to `plugins[0].skills` in `.claude-plugin/marketplace.json`.
4. Add a row to the README table.
5. Run `node scripts/validate-skills.mjs`.
