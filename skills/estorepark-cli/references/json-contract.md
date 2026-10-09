# The `--json` output contract

Under `--json`, **stdout carries exactly one JSON document.** Progress lines, warnings and the
spinner go to stderr. That is why `estorepark theme list --json | jq` is safe.

## Success

```json
{ "ok": true, "...": "command-specific body" }
```

## Error

```json
{ "ok": false, "error": { "code": "NO_STORE_SELECTED", "message": "mağaza seçilmedi" } }
```

Branch on **`error.code`**; `message` is for humans, is written in Turkish, and may change.
Code list: [errors.md](errors.md).

## The `warnings` field

A success body (`ok: true`) can carry warnings. Do not mistake their presence for a failure.

`theme push` — **unconditional**, on every call:

```json
{ "ok": true, "store": "mystore", "themeId": "…", "version": { "contentHash": "…" },
  "warnings": ["DRAFT_REPLACED"] }
```

The field is never empty: it is unconditional so a script can always learn that "this operation
replaced the DRAFT entirely".

`theme push` also reports the theme's **e-mail design files** (`emails/`, `config/email_brand.json`)
as the server judged them in the new DRAFT. Both codes are **conditional** and come after
`DRAFT_REPLACED`:

| Code | Present when | Extra body |
| ---- | ------------ | ---------- |
| `EMAIL_DESIGNS_INVALID` | at least one design/brand file cannot be applied | `emailDesigns.invalid: [{ path, reason }]` |
| `EMAIL_DESIGNS_IGNORED` | an unknown template key or a non-JSON file under `emails/` | `emailDesigns.ignored: [{ path, reason }]` |

```json
{ "ok": true, "warnings": ["DRAFT_REPLACED", "EMAIL_DESIGNS_INVALID"],
  "emailDesigns": { "invalid": [{ "path": "emails/customer/welcome.json", "reason": "BLOCK_NOT_ALLOWED" },
                                { "path": "config/email_brand.json", "reason": "NO_VALID_FIELDS" }] } }
```

`reason` is the raw value (`INVALID_BLOCKS`, `INVALID_URL`, `UNKNOWN_TEMPLATE`, …), not a label;
`path` is relative to the theme root. Reference copies (`"platformDefault": true`) are never
listed. None of this changes the exit code — the push succeeded.

`theme publish` — **conditional** `emailDesigns` when the now-live theme has e-mail designs the
merchant could apply (new or different from the store's current ones):

```json
{ "ok": true, "version": { "version": 9 },
  "emailDesigns": { "applicableTemplateKeys": ["customer/welcome"], "brandApplicable": true } }
```

Applying happens only in the admin panel (**E-posta şablonları › Temadan uygula**); the CLI cannot
apply. If the e-mail report cannot be fetched, `push`/`publish` still succeed with the same exit
code, stderr gets one line (`E-posta tasarım raporu alınamadı`) and the body carries neither
`emailDesigns` nor these codes.

`theme package` — **conditional**: if the `--out` target lands inside the theme folder,
`warnings: ["OUTPUT_INSIDE_THEME"]` is added (the produced zip would be bundled into the next
package). The default `.estorepark/theme.zip` does not trip it; with no warning the field is
absent.

## `theme dev` — a long-running command

`theme dev --json` prints a single "ready" document the moment the proxy starts listening, then
keeps running. Because the process does not exit, stdout never reaches EOF.

```json
{ "ok": true, "ready": true, "proxyUrl": "http://localhost:9292", "targetOrigin": "https://…",
  "sessionIdPrefix": "a1b2c3d4…", "themeId": "…", "store": "mystore", "dir": "/…/theme",
  "fileCount": 42, "payloadBytes": 123456 }
```

Sync and heartbeat lines stay on stderr.

```bash
# WRONG — jq waits for EOF and hangs
estorepark theme dev --json | jq

# RIGHT — read the document from a file
estorepark theme dev --json --no-input > dev.json &
# take proxyUrl from dev.json once it is written
```

`sessionIdPrefix` is truncated; the full session id **never enters the body** because it is a
capability key that opens the theme through `<store-host>/?epid=…`. Do not paste even the
truncated form into logs, issues or chat.

## Help text

Asking for help with `--json` does **not** print the help to stdout as plain text — that would
break the single-document contract. An agent that wants to read the help must not pass `--json`.
