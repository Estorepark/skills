# Command and flag reference

An annotated version of `estorepark --help`. Command names and flags are exactly these; a flag
that is not on this list exits 2 with `UNKNOWN_FLAG`.

## Session

| Command | What it does |
| ------- | ------------ |
| `estorepark login` | Device login approved in a browser (OAuth2 device flow). The password never passes through the CLI. An agent cannot complete this flow — the code is shown to the user. Requests the theme and menu scopes (`read:themes write:themes read:menus write:menus`) and stores the granted list with the session. |
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
| `theme check` | Local structural validation (does **not** check `emails/` or `config/email_brand.json`) | ✘ |
| `theme package` | Produces a deterministic zip (default `.estorepark/theme.zip`) | ✘ |
| `theme push` | Uploads and indexes as DRAFT — **does not publish**, replaces the DRAFT. Then lists the theme's e-mail design files that cannot be applied or are ignored (path + reason) | ✔ |
| `theme publish` | Publishes the DRAFT AND makes it live — asks for confirmation. Then hints when the live theme has e-mail designs the merchant can apply in the admin panel | ✔ |
| `theme versions` | Release history (`--limit` / `--offset`, defaults 20 / 0) | ✔ |
| `theme rollback --version N` | Makes an older version live again — asks for confirmation | ✔ |
| `theme pull` | Writes the DRAFT files to disk | ✔ |

### Listing surfaces in `theme dev`

Search, sorting, pagination and the **filter panel** all work — the preview reads facet
distributions from the storefront API. Two limits remain, and `theme dev` prints them on startup:

- The filter panel is built from the **platform default set**. A merchant's own filter
  configuration is admin data and is not on the public surface. Stores without custom
  configuration see exactly what production shows (production also falls back to the default set).
- **Brand, category and option selections do not narrow results in dev.** The public filter input
  takes **ids** while the URL carries slugs, and the CLI has no slug→id dictionary. Price, stock
  and on-sale selections do apply — price on the net axis in dev, gross in production.

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

## Menu

The store's navigation menus. Menus are **live data, not drafts** — every write reaches the
storefront immediately.

| Command | What it does | Network |
| ------- | ------------ | ------- |
| `menu list` | The store's menus: handle, item count, title (`estorepark menu` alone does the same) | ✔ |
| `menu get <handle>` | One menu as a tree; with `--json` the `menu` field is a ready menu file | ✔ |
| `menu create --file <path>` | Creates the menu in the file (the handle comes from the file) — asks for confirmation | ✔ |
| `menu update <handle> --file <path>` | Replaces the **whole** menu (title + item tree) with the file; the handle never changes — asks for confirmation | ✔ |
| `menu delete <handle>` | Deletes the menu — asks for confirmation | ✔ |

Menus are addressed by **handle**; the id is never asked for. The store is chosen as for theme
commands: `--store` → the store in the folder's `.estorepark/theme.json` (`--dir` or the current
directory) → the active store.

Each command runs its steps in a fixed order: file check → session and store → scope check →
handle lookup (`get` / `update` / `delete`) → confirmation → write. So a broken file fails before
anything else, no menu request is sent until the scope check passes, and `MENU_NOT_FOUND` comes before
`CONFIRMATION_REQUIRED`.

The confirmation summary (printed in Turkish) states what will happen: `create` —
`‹handle› N öğeyle oluşturulacak`; `update` — `‹handle›: öğe sayısı A → B`; `delete` —
`‹handle› silinecek; bu menüye bağlı tema bölümleri başka bir menüye ya da yedek linklerine
düşebilir`. Item counts here and in `menu list` are the stored items on all levels; children an
auto-fill item generates on the storefront are not counted.

File format, defaults and the declarative update: [menu-file.md](menu-file.md).

## Flags

| Flag | Meaning |
| ---- | ------- |
| `--store <slug>` | Store (default: the folder's `.estorepark/theme.json`, then the one selected with `store use`) |
| `--theme <id>` | Theme (default: `.estorepark/theme.json`) |
| `--dir <path>` | Theme folder (default: current directory) |
| `--port <n>` | Local port for `theme dev` (default 9292) |
| `--name <name>` | New theme name for `theme init` |
| `--out <file>` | Output path for `theme package` |
| `--version <n>` | Target version for `theme rollback` |
| `--file <path>` | Menu file for `menu create` / `menu update` (JSON; the `menu get --json` output works as is). Relative to the current directory, not `--dir` |
| `--limit <n>` `--offset <n>` | Paging for `theme versions` |
| `--json` | Machine-readable output (a single JSON document on stdout) |
| `--quiet` | Print errors only |
| `--no-input` | Disable interactive surfaces (CI). A non-empty `CI` variable does the same. |
| `--yes` | Approve live-changing operations without asking (`publish`, `rollback`, `menu create` / `update` / `delete`) |
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

Menu commands open **no picker**: a missing handle or `--file` is `MISSING_ARGUMENT` (exit 2) even
on a TTY. Their only interactive surface is the confirmation box.
