# Error codes

The `error.code` values in the `--json` body, together with the `EXIT` mapping from the source.
The exit code and the error code are **separate axes**; read both.

> Counter-intuitive: **"no data" situations exit with 2** (`NO_STORES`, `NO_VERSIONS`,
> `VERSION_NOT_FOUND`). The CLI treats them as "you cannot call the command like this", not as
> "it ran and the outcome was negative".

## Identity / authorization — exit 3

| Code | Meaning | What to do |
| ---- | ------- | ---------- |
| `NOT_LOGGED_IN` | No local session | Ask the user to run `estorepark login` — an agent cannot complete the browser approval |
| `UNAUTHENTICATED` / `UNAUTHORIZED` | Token invalid or expired | Log in again |
| `FORBIDDEN` | Insufficient permission | The user's staff permissions on that store are not enough |
| `INSUFFICIENT_SCOPE` | Token scope insufficient | The CLI token only carries theme scopes; product/order/customer/settings surfaces cannot be reached with another command either |
| `ACCESS_DENIED` | The user denied approval in the browser | Run `login` again |
| `LOGIN_FAILED` | Device flow failed server-side | Environment/access problem; retry |
| `CODE_EXPIRED` | The approval code was not entered in time | Run `login` again |

## Usage error — exit 2

| Code | Meaning | What to do |
| ---- | ------- | ---------- |
| `MISSING_ARGUMENT` | Required argument missing (no picker in CI) | Pass the argument explicitly |
| `INVALID_ARGUMENT` | Wrong format (e.g. `--version` not a positive integer, malformed `--limit`) | Fix the value — the CLI does not silently fall back to a default |
| `UNKNOWN_FLAG` / `UNKNOWN_COMMAND` | Typos are not swallowed | Compare against the list in `commands.md` |
| `NO_STORE_SELECTED` | No active store | `estorepark store use <slug>` or `--store <slug>` |
| `STORE_NOT_FOUND` | The given slug is not among the reachable stores | `estorepark store list` |
| `NO_STORES` | The account can reach no stores | Nothing to fix in the CLI; tell the user |
| `NO_THEME` | The folder is not bound to a theme, or no theme could be selected | `theme init` or `--theme <id>` |
| `NO_VERSIONS` | The theme has no release history | Nothing to roll back to; `publish` first |
| `VERSION_NOT_FOUND` | The requested version is not in the history | List with `theme versions` |
| `VERSION_SCAN_TRUNCATED` | The version scan hit its page ceiling before finding the target | Narrow it with `--limit` / `--offset` |
| `CONFIRMATION_REQUIRED` | `publish` / `rollback` called without confirmation in a non-interactive context | Add `--yes` only if the user explicitly asked |
| `PORT_IN_USE` | The `theme dev` port is busy | `--port <n>` |
| `ENOENT` | File or directory missing | Check the `--dir` path |

## Command ran, outcome negative — exit 1

| Code | Meaning | What to do |
| ---- | ------- | ---------- |
| `ABORTED` | "No" at the confirmation box | Nothing was changed; do not ask again |
| `THEME_INVALID` | The bundle failed structural validation before upload | Fix what `estorepark theme check` reports |
| `UPLOAD_FAILED` | Upload HTTP failure | Network/environment; retry |
| `PAYLOAD_TOO_LARGE` | The preview payload exceeds the limit | Shrink the theme's text files |
| `DEV_MODE_UNAVAILABLE` | The store is not on the V2 render engine, or the platform has no preview origin configured | An environment condition — do not try flags |
| `UNSAFE_PATH` | A path inside the bundle escapes the directory | Remove the symlink / `..` entry |
| `RATE_LIMITED` | 429 | Wait; do not retry in a loop |
| `GRAPHQL_ERROR` | Server-side business rule rejection | Pass the message to the user |
| `INTERNAL_SERVER_ERROR` | 5xx | Environment problem |
| `BAD_RESPONSE` / `EMPTY_RESPONSE` | Response unreadable or empty | Usually a wrong `--api` / `--accounts` root, or an unreachable environment |
| `UNEXPECTED` | Unclassified failure | Relay the message as-is |

## Warning codes (`ok: true`)

These are not errors; they arrive in the `warnings` array of a successful body.

| Code | When |
| ---- | ---- |
| `DRAFT_REPLACED` | On **every `theme push`** — the DRAFT was replaced entirely |
| `OUTPUT_INSIDE_THEME` | When `theme package --out` writes inside the theme folder — the produced zip would be bundled into the next package |
