---
name: estorepark-cli
description: Drive the EstorePark CLI (`estorepark`) — device-flow login, store selection, and the theme command surface (init, dev, check, package, push, publish, versions, rollback, pull), including its single-document `--json` contract, exit codes and non-interactive/CI usage. EstorePark CLI ile mağaza teması geliştirme, yükleme, yayınlama ve geri alma; "estorepark login", "theme dev", "temayı yayınla", "temayı geri al", "mağaza seç" gibi isteklerde kullan. To write theme FILES, use the estorepark-theme skill instead.
license: MIT
compatibility: Node.js 24+ and the `estorepark` CLI. Commands that hit the network need a reachable EstorePark environment and a session.
metadata:
  author: estorepark
  version: "0.3.0"
---

# EstorePark CLI

The CLI merchants use to develop and publish storefront themes from a terminal. This skill
covers **driving the command**; for the content of theme files use the `estorepark-theme` skill.

## Install and current status

The CLI is not published to npm yet. Today it runs from source:

```bash
pnpm install && pnpm build   # dist/main.js
node dist/main.js --help
```

Offline commands (`theme check`, `theme package`) work in any environment. `login` and every
command that talks to the server require a deployed environment — if it cannot connect, that
is a missing environment, not a bug in the command. Tell the user; do not try to "fix" it by
guessing flags.

## Typical flow

```bash
estorepark login                 # approve the code in a browser (OAuth2 device flow)
estorepark store use mystore     # active store
estorepark theme init            # binds the folder to a theme + downloads the DRAFT
estorepark theme dev             # localhost:9292 → real data + local files
estorepark theme check           # local structural validation (offline)
estorepark theme push            # REPLACES the DRAFT (does not publish)
estorepark theme publish         # asks for confirmation → publishes AND goes live
```

Full command and flag list: [references/commands.md](references/commands.md).

## Gotchas

These are the places where the reasonable assumption is wrong. Read them before running anything.

- **`theme push` REPLACES the DRAFT, it does not merge.** `theme init` / `theme pull` do not
  download binary assets (images, fonts) because the server only returns text files. So an
  `init → push` round **deletes the assets on the server**, and `publish` makes that live. The
  CLI cannot measure the risk, so every `push` warns and puts `warnings: ["DRAFT_REPLACED"]`
  in the `--json` body. Warn the user before pushing a theme that has images.
- **Never pipe `theme dev --json`.** It is a long-running command: it prints a single "ready"
  document the moment the proxy starts listening, but the process does not exit, so stdout
  never reaches EOF. `jq` drains its input at EOF and hangs. **Redirect to a file instead:**
  `estorepark theme dev --json --no-input > dev.json &`
- **`sessionIdPrefix` in the `--json` body is part of a capability key.** The preview session
  opens the theme through `<store-host>/?epid=…`. Do not paste that value into CI logs, issues
  or chat.
- **`publish` and `rollback` ask for confirmation.** On a TTY a confirmation box opens
  (Enter = no). In a script or CI, without `--yes` the command stops with **exit 2** and the
  mutation is never sent. Do not add `--yes` unless the user explicitly asked — these are the
  only commands that change the live storefront.
- **Tokens live in `~/.config/estorepark/config.json` (mode 0600).** The CLI has **no** token
  flag and no token environment variable; tokens are never written to logs, error output or
  the `--json` body. Do not read that file and print its contents.
- **Missing argument = interactive list, or an error in CI.** `store use`, `theme init` and
  `theme rollback` open a picker on a TTY when the argument is missing. `--no-input`, a
  non-empty `CI` environment variable **and `--json`** all close it → a missing argument means
  exit 2. In automation always pass the argument explicitly.
- **`--json` closes prompts too.** If you are running with `--json`, the confirmation box never
  opens: `publish` / `rollback` without `--yes` **always** return `CONFIRMATION_REQUIRED`
  (exit 2). That is not a failure, it is the gate working — ask the user.
- **Unknown flags are not swallowed** (`UNKNOWN_FLAG`, exit 2). A typo like `--jsom` stops the
  command instead of running it differently.

## The `--json` contract

Under `--json`, **stdout carries exactly one JSON document**; progress lines and warnings go to
stderr. So `estorepark theme list --json | jq` always works (the single exception is
`theme dev` above).

Error body:

```json
{ "ok": false, "error": { "code": "NO_STORE_SELECTED", "message": "…" } }
```

Branch on `error.code`, never on the message text. Code list and what to do about each:
[references/errors.md](references/errors.md). Shape of the success bodies:
[references/json-contract.md](references/json-contract.md).

## Exit codes

| Code | Meaning | What the agent should do |
| ---- | ------- | ------------------------ |
| `0` | Success | continue |
| `1` | Command ran, outcome negative or unexpected failure (`theme check` findings, 5xx, network, "no" at the confirmation box) | read the output and fix the finding; for network/5xx tell the user instead of retrying |
| `2` | Command called incorrectly (missing argument, unknown flag, no store selected, `publish` without confirmation, and "no data" cases) | fix the invocation; do not add `--yes` on your own |
| `3` | Identity/authorization (no session or expired, insufficient scope) | `estorepark login` is required — tell the user, you cannot complete the browser flow |

## Running in CI

```bash
CI=1 estorepark theme check --dir ./theme --json
CI=1 estorepark theme push --dir ./theme --store mystore --json
CI=1 estorepark theme publish --store mystore --yes --json
```

`--no-input`, a non-empty `CI` variable, or `--json` closes every interactive surface. Each
command has a full non-interactive equivalent and none of them require a TTY.

## Configuration

| Location | What |
| -------- | ---- |
| `~/.config/estorepark/config.json` | Session tokens + active store (mode 0600) |
| `<theme>/.estorepark/theme.json` | Which store and theme the folder is bound to |
| `<theme>/.estorepark/theme.zip` | Default output of `theme package` — excluded from the bundle |
| `ESTOREPARK_API_BASE` / `ESTOREPARK_ACCOUNTS_BASE` | Environment roots (`--api` / `--accounts` win) |
| `ESTOREPARK_CONFIG_HOME` | Moves the config directory (tests + CI) |

`.estorepark/` is the only directory the CLI owns; do not hand-edit its contents.
