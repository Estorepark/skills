# Command and flag reference

An annotated version of `estorepark --help`. Command names and flags are exactly these; a flag
that is not on this list exits 2 with `UNKNOWN_FLAG`.

## Session

| Command | What it does |
| ------- | ------------ |
| `estorepark login` | Device login approved in a browser (OAuth2 device flow). The password never passes through the CLI. An agent cannot complete this flow — the code is shown to the user. |
| `estorepark logout` | Deletes the local session |
| `estorepark whoami` | Session + number of reachable stores |

## Store

| Command | What it does |
| ------- | ------------ |
| `estorepark store list` | Stores the account can reach |
| `estorepark store use <slug>` | Selects the active store (written to config) |

Login is **platform level**; which store you work on is chosen in the CLI. The permission
boundary comes from the staff permissions on that store. For a one-off deviation `--store <slug>`
is enough — you do not need to change the active store.

## Theme

| Command | What it does | Network |
| ------- | ------------ | ------- |
| `theme init` | Binds the folder to a theme (`.estorepark/theme.json`) + downloads the DRAFT files | ✔ |
| `theme list` | Themes of the store | ✔ |
| `theme dev` | Local proxy (default `localhost:9292`): rendering happens on the server with real tenant data while files are served from disk | ✔ |
| `theme preview` | One-shot preview URL (no proxy) | ✔ |
| `theme check` | Local structural validation | ✘ |
| `theme package` | Produces a deterministic zip (default `.estorepark/theme.zip`) | ✘ |
| `theme push` | Uploads and indexes as DRAFT — **does not publish**, replaces the DRAFT | ✔ |
| `theme publish` | Publishes the DRAFT AND makes it live — asks for confirmation | ✔ |
| `theme versions` | Release history (`--limit` / `--offset`, defaults 20 / 0) | ✔ |
| `theme rollback --version N` | Makes an older version live again — asks for confirmation | ✔ |
| `theme pull` | Writes the DRAFT files to disk | ✔ |

During `theme dev` the files under `assets/` are served **straight from the local folder**
(images and fonts included); the preview session only carries text, so binary assets never
reach the server. An asset missing locally comes from the DRAFT on the server.

`theme package --out` writing into the theme folder gets the produced zip bundled into the next
package; the CLI reports this with the `OUTPUT_INSIDE_THEME` warning. The default
`.estorepark/theme.zip` avoids the trap.

`theme check` also returns a **list of binary assets** alongside structural findings: those
files do not appear in the `theme dev` preview (the preview carries text only), they are served
from disk.

Called with no argument, `theme init` opens a theme picker on a TTY; when the picker is closed
it selects the store's live theme and writes which one it picked to stderr.

## Flags

| Flag | Meaning |
| ---- | ------- |
| `--store <slug>` | Store (default: the one selected with `store use`) |
| `--theme <id>` | Theme (default: `.estorepark/theme.json`) |
| `--dir <path>` | Theme folder (default: current directory) |
| `--port <n>` | Local port for `theme dev` (default 9292) |
| `--name <name>` | New theme name for `theme init` |
| `--out <file>` | Output path for `theme package` |
| `--version <n>` | Target version for `theme rollback` |
| `--limit <n>` `--offset <n>` | Paging for `theme versions` |
| `--json` | Machine-readable output (a single JSON document on stdout) |
| `--quiet` | Print errors only |
| `--no-input` | Disable interactive surfaces (CI). A non-empty `CI` variable does the same. |
| `--yes` | Approve live-changing operations without asking (`publish`, `rollback`) |
| `--api <url>` `--accounts <url>` | Environment roots (env: `ESTOREPARK_API_BASE` / `ESTOREPARK_ACCOUNTS_BASE`) |
| `-h, --help` | Help |
| `--version` | CLI version (when no command is given; `--version-cli` is a synonym) |

`--version` is overloaded: with no command it prints the CLI version, with `theme rollback` it
is the target version number.

## Interactive surfaces

They only open when stdout **and** stdin are both TTYs, the required argument is missing, and
neither `--no-input`, `--json`, nor a non-empty `CI` variable is present.

| Command | What is missing | Escape flag |
| ------- | --------------- | ----------- |
| `store use` | store | `<slug>` or `--store <slug>` |
| `theme init` | theme | `--theme <id>` or `--name "<name>"` |
| `theme rollback` | version | `--version <n>` |

In the picker: `↑↓` move · `Enter` select · `1-9` jump · `/` filter · `Esc` cancel. Cancelling
behaves like a missing argument (exit 2).
