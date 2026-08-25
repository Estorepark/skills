# EstorePark Agent Skills

A collection of [Agent Skills](https://agentskills.io) for [EstorePark](https://estorepark.com).
The skills teach coding agents (Claude Code, Codex, Cursor, Copilot, Gemini CLI, OpenCode…) how
to use the EstorePark CLI and the theme bundle contract **correctly** — they carry the rules,
gotchas and command contracts an agent cannot know on its own.

## Install

```bash
# every skill, into the agent you use
npx skills add Estorepark/skills

# a single skill
npx skills add Estorepark/skills --skill estorepark-theme

# specific agents, no prompts (CI)
npx skills add Estorepark/skills -a claude-code -y
```

Use one without installing:

```bash
npx skills use Estorepark/skills@estorepark-cli | claude
```

In Claude Code it can also be added as a plugin:

```
/plugin marketplace add Estorepark/skills
```

The skills are agent-agnostic; copying the `SKILL.md` files by hand works too — into
`.claude/skills/`, `.agents/skills/`, or wherever your agent reads them from.

## Skills

| Skill | When it applies |
| ----- | --------------- |
| [`estorepark-cli`](skills/estorepark-cli) | Driving the `estorepark` command: device login, store selection, `theme init/dev/check/package/push/publish/rollback`, the `--json` output, exit codes, CI usage |
| [`estorepark-theme`](skills/estorepark-theme) | Writing theme **code**: section/block/template/region files, `config/routes.json`, embedded schemas, the helper catalogue, i18n, and the listing surfaces — search box and autocomplete, facet panel, sorting, pagination |

They are separate because one is about **driving the command** and the other about **writing
theme code**; a task usually needs only one of them, and their content does not overlap.

## Contributing

The rules for writing skills here are in [AGENTS.md](AGENTS.md). Run the validator before every
change:

```bash
node scripts/validate-skills.mjs
```

CI runs the same script: frontmatter, naming rules, size limits and dead reference links.

## License

[MIT](LICENSE)
