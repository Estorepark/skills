---
name: estorepark-cli
description: Drive the EstorePark CLI (`estorepark`) — device-flow login, store selection, the theme command surface (init, dev, check, package, push, publish, versions, rollback, pull) and the store's navigation menus (menu list, get, create, update, delete with a JSON menu file), including its single-document `--json` contract, exit codes and non-interactive/CI usage. EstorePark CLI ile mağaza teması geliştirme, yükleme, yayınlama ve geri alma, mağaza menülerini oluşturma, güncelleme ve silme; "estorepark login", "theme dev", "temayı yayınla", "temayı geri al", "mağaza seç", "menü oluştur", "menüyü güncelle", "header menüsünü kur", "footer menüsü ekle", "menüleri listele" gibi isteklerde kullan. To write theme FILES, use the estorepark-theme skill instead.
license: MIT
compatibility: Node.js 24+ and the `estorepark` CLI. Commands that hit the network need a reachable EstorePark environment and a session.
metadata:
  author: estorepark
  version: "0.5.0"
---

# EstorePark CLI

The CLI merchants use to develop and publish storefront themes, and to manage the store's
navigation menus, from a terminal. This skill covers **driving the command**; for the content of
theme files use the `estorepark-theme` skill.

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

## Menus

Header and footer navigation is store data, not part of the theme. The `menu` commands manage it,
addressed by handle:

```bash
estorepark menu list --json
estorepark menu get main-menu --json > menu.json   # edit the file…
estorepark menu update main-menu --file menu.json  # …asks for confirmation, then goes live
estorepark menu create --file footer.json
```

The reference theme picks up the menu with handle `main-menu` in the header and `footer` in the
footer when no menu is selected in the section. Read
[references/menu-file.md](references/menu-file.md) **before writing or editing a menu file** —
fields, defaults, the declarative update, encoding, and the rule behind every `MENU_INVALID`
reason. What to put in a menu when you do not know the store's ids is in the `estorepark-theme`
skill's menus reference.

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
- **Live-changing commands ask for confirmation:** `theme publish`, `theme rollback`,
  `menu create`, `menu update`, `menu delete`. On a TTY a confirmation box opens (Enter = no). In
  a script or CI, without `--yes` the command stops with **exit 2** and the mutation is never
  sent. Do not add `--yes` unless the user explicitly asked — these are the only commands that
  change the live storefront.
- **Menus are live, not drafts.** There is no DRAFT and no publish step for a menu: `create`,
  `update` and `delete` reach the storefront the moment they succeed, and the CLI has no undo.
  Show the user what will change and let them approve it; never add `--yes` on your own.
- **`menu update` replaces the WHOLE menu.** The file's title and item tree become the menu; an
  item missing from the file is deleted. Always start from `menu get --json`, never from a
  hand-written partial file. The handle cannot change — a different `handle` in the file is
  `INVALID_ARGUMENT`.
- **Menu commands may need a fresh login.** A session from a CLI version older than menu support
  lacks the menu scopes: menu commands stop with `INSUFFICIENT_SCOPE` (exit 3) **without sending
  a request**, while theme commands keep working. Ask the user to run `estorepark login`. A
  `FORBIDDEN` on a menu command is different — the staff permission is missing and logging in
  again does not help.
- **Tokens live in `~/.config/estorepark/config.json` (mode 0600).** The CLI has **no** token
  flag and no token environment variable; tokens are never written to logs, error output or
  the `--json` body. Do not read that file and print its contents.
- **Missing argument = interactive list, or an error in CI.** `store use`, `theme init` and
  `theme rollback` open a picker on a TTY when the argument is missing. `--no-input`, a
  non-empty `CI` environment variable **and `--json`** all close it → a missing argument means
  exit 2. In automation always pass the argument explicitly. Menu commands never open a picker:
  a missing handle or `--file` is always exit 2.
- **`--json` closes prompts too.** If you are running with `--json`, the confirmation box never
  opens: `publish` / `rollback` and the menu writes without `--yes` **always** return
  `CONFIRMATION_REQUIRED` (exit 2). That is not a failure, it is the gate working — ask the user.
- **Unknown flags are not swallowed** (`UNKNOWN_FLAG`, exit 2). A typo like `--jsom` stops the
  command instead of running it differently.
- **E-mail design warnings are not failures.** `theme push` may add `EMAIL_DESIGNS_INVALID` /
  `EMAIL_DESIGNS_IGNORED` (with `emailDesigns.invalid` / `.ignored`) and `theme publish` may add
  `emailDesigns`; the exit code is still 0. The CLI **cannot apply** e-mail designs — the merchant
  does it in the admin panel (**E-posta şablonları › Temadan uygula**). Fix the reported files with
  the `estorepark-theme` skill (its e-mail designs reference). Details:
  [references/json-contract.md](references/json-contract.md).

## The `--json` contract

Under `--json`, **stdout carries exactly one JSON document**; progress lines and warnings go to
stderr. So `estorepark theme list --json | jq` always works (the single exception is
`theme dev` above).

Error body:

```json
{ "ok": false, "error": { "code": "NO_STORE_SELECTED", "message": "…" } }
```

Branch on `error.code`, never on the message text. `MENU_INVALID` may add `error.reason`, the
store's rule token (`MENU_DEPTH_EXCEEDED`, …) — no other code carries it. Code list and what to do
about each:
[references/errors.md](references/errors.md). Shape of the success bodies:
[references/json-contract.md](references/json-contract.md).

## Exit codes

| Code | Meaning | What the agent should do |
| ---- | ------- | ------------------------ |
| `0` | Success | continue |
| `1` | Command ran, outcome negative or unexpected failure (`theme check` findings, the store rejecting a menu, 5xx, network, "no" at the confirmation box) | read the output and fix the finding; for network/5xx tell the user instead of retrying |
| `2` | Command called incorrectly (missing argument, unknown flag, no store selected, a broken menu file, `publish` or a menu write without confirmation, and "no data" cases such as `MENU_NOT_FOUND`) | fix the invocation; do not add `--yes` on your own |
| `3` | Identity/authorization (no session or expired, insufficient scope, missing staff permission) | `estorepark login` is required — tell the user, you cannot complete the browser flow. Exception: `FORBIDDEN` on a menu command is a staff permission, not fixed by logging in |

## Running in CI

```bash
CI=1 estorepark theme check --dir ./theme --json
CI=1 estorepark theme push --dir ./theme --store mystore --json
CI=1 estorepark theme publish --store mystore --yes --json
CI=1 estorepark menu update main-menu --file menu.json --store mystore --yes --json
```

`--no-input`, a non-empty `CI` variable, or `--json` closes every interactive surface. Each
command has a full non-interactive equivalent and none of them require a TTY.

## Configuration

| Location | What |
| -------- | ---- |
| `~/.config/estorepark/config.json` | Session tokens + granted scopes + active store (mode 0600) |
| `<theme>/.estorepark/theme.json` | Which store and theme the folder is bound to |
| `<theme>/.estorepark/theme.zip` | Default output of `theme package` — excluded from the bundle |
| `ESTOREPARK_API_BASE` / `ESTOREPARK_ACCOUNTS_BASE` | Environment roots (`--api` / `--accounts` win) |
| `ESTOREPARK_CONFIG_HOME` | Moves the config directory (tests + CI) |

`.estorepark/` is the only directory the CLI owns; do not hand-edit its contents.
