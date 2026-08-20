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
