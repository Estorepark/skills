# The menu file

The JSON file `menu create --file` and `menu update <handle> --file` read. It is also exactly the
`menu` field of the `menu get --json` body, so the usual way to write one is to start from `get`.

```json
{
  "handle": "main-menu",
  "title": "Ana Menü",
  "items": [
    { "title": "Kategoriler", "kind": "HEADING", "autoFill": "ALL_CATEGORIES" },
    {
      "title": "Koleksiyonlar",
      "kind": "EXTERNAL",
      "url": "/koleksiyonlar",
      "children": [
        { "title": "Yaz", "kind": "ENTITY", "resourceType": "COLLECTION", "entityId": "<collection id>" }
      ]
    },
    { "title": "Blog", "kind": "EXTERNAL", "url": "https://blog.example.com", "newTab": true }
  ]
}
```

## Fields

Menu:

| Field | Rule |
| ----- | ---- |
| `id` | Output only (`menu get --json`); `create` / `update` ignore it |
| `handle` | **Required for `create`.** Optional for `update` — if present it must equal the command's handle |
| `title` | Required, string |
| `items` | Required, array (an empty array is valid) |

Item:

| Field | Rule |
| ----- | ---- |
| `title` | Required, string |
| `kind` | Required: `EXTERNAL` · `ENTITY` · `HEADING` · `ROUTE` |
| `url` | `EXTERNAL` only: `https://…` / `http://…` or root-relative (`/koleksiyonlar`) |
| `resourceType` | `ENTITY` only: `PRODUCT` · `COLLECTION` · `CATEGORY` · `BRAND` · `BLOG_POST` · `PAGE` |
| `entityId` | `ENTITY` only: the record's id |
| `routeId` | `ROUTE` only — kept so old menus round-trip; do not use it in new menus |
| `newTab` | Open in a new tab. Default `false` |
| `autoFill` | `NONE` (default, manual children) · `SUBCATEGORIES` · `ALL_CATEGORIES` · `PRODUCTS`. Anything but `NONE` → no `children` |
| `autoFillLimit` | How many children to generate. Default: products 8 (max 20), categories 20 (max 50 per level) |
| `autoFillSort` | `PRODUCTS` only: `NEWEST` (default) · `PRICE_ASC` · `PRICE_DESC` · `NAME_ASC` · `NAME_DESC` · `DISCOUNT` |
| `children` | Sub-items. Default `[]` |

- **Order is array order.** There is no `position` field. Unknown fields (an item `id`, a
  `position`) are dropped, and `null` counts as "not given".
- Which item may auto-fill: `SUBCATEGORIES` — an `ENTITY` `CATEGORY` item; `ALL_CATEGORIES` — a
  `HEADING` or `EXTERNAL` item with no entity target; `PRODUCTS` — an `ENTITY` `CATEGORY` or
  `COLLECTION` item. An auto-filled item sits at depth 1 or 2.
- Auto-filled children are generated on the storefront at render time. They are never stored,
  never appear in `menu get`, and never count toward the item counts.
- The store saves normalised values: after a write, `menu get` shows an auto-fill item's effective
  `autoFillLimit` / `autoFillSort` even if the file omitted them.

## What `--file` accepts

- **A bare menu file** (the object above).
- **The whole `menu get --json` body** — `{ "ok": true, "store": …, "menu": { … } }`. The `menu`
  field is read; you do not have to strip the wrapper.

A relative path resolves against the **current directory**, not `--dir`.

## `menu update` is declarative

- The file's `title` and item tree **replace the whole menu.** An item missing from the file is
  deleted; `"items": []` deletes every item. Never write an update file from scratch — start from
  `menu get --json`.
- **The handle never changes.** The CLI does not send it; a file `handle` that differs from the
  argument stops the command with `INVALID_ARGUMENT` (exit 2) before any request. Themes find menus
  by handle, so a renamed menu would detach from every theme that looks it up.

## Round trip

```bash
estorepark menu get main-menu --json > menu.json   # the body, wrapper included
# edit menu.json
estorepark menu update main-menu --file menu.json  # summary "main-menu: öğe sayısı A → B", then confirmation
```

`menu get --json` writes the defaults out (`newTab`, `autoFill` and `children` are always present,
`null` fields are omitted), so an unchanged body sent back leaves the menu exactly as it was.

## Encoding

The file must be **UTF-8**. A UTF-8 BOM is skipped. A UTF-16 file is rejected with
`INVALID_ARGUMENT` — Windows PowerShell 5.1's `>` writes UTF-16, so save it with:

```powershell
estorepark menu get main-menu --json | Out-File -Encoding utf8 menu.json
```

## Who checks what

**The CLI checks only the file's form**, before any request; a failure is `INVALID_ARGUMENT`
(exit 2) and the message names the file and, for a field problem, the field
(`items[2].children[0].kind`):

- the file is readable and UTF-8, and parses as a JSON object;
- required fields are present with the right JSON type — `handle` / `title` / `kind` strings,
  `items` / `children` arrays, every item an object;
- for `update`, a file `handle` matches the argument.

Optional fields go to the store untouched.

**The store checks every value rule.** A violation is `MENU_INVALID` (exit 1) with the rule in
`error.reason`:

| `error.reason` | Rule |
| -------------- | ---- |
| `MENU_HANDLE_INVALID` | Handle `^[a-z0-9-]+$`, 1–100 characters |
| `MENU_TITLE_INVALID` | Menu title not blank after trimming, at most 160 characters (stored untrimmed) |
| `MENU_ITEM_TITLE_INVALID` | Same for item titles |
| `MENU_ITEM_URL_TOO_LONG` | `EXTERNAL` url at most 2048 characters |
| `MENU_DEPTH_EXCEEDED` | At most 3 levels |
| `MENU_TOO_MANY_ITEMS` | At most 500 items, all levels together |
| `MENU_ITEM_CYCLE` | The item tree contains a cycle |
| `MENU_ITEM_KIND_FIELDS_INVALID` | The fields do not match `kind`: `EXTERNAL` without `url`, `ENTITY` without `resourceType` + `entityId`, `ROUTE` without `routeId`, or a field another kind owns (a `url` on a `HEADING`) |
| `MENU_ITEM_URL_INVALID` | `EXTERNAL` url is neither `http(s)://…` nor root-relative |
| `MENU_ITEM_ROUTE_NOT_FOUND` | A `ROUTE` item's route does not exist or is disabled |
| `MENU_ITEM_AUTOFILL_INVALID_TARGET` | `autoFill` on an item that cannot carry it (see the list above) |
| `MENU_ITEM_AUTOFILL_HAS_CHILDREN` | An auto-filled item also has manual `children` |
| `MENU_ITEM_AUTOFILL_DEPTH_OUT_OF_RANGE` | An auto-filled item at depth 3 — no level left to fill |
| `MENU_ITEM_AUTOFILL_LIMIT_OUT_OF_RANGE` | `autoFillLimit` outside 1–20 (products) / 1–50 (categories) |
| `MENU_ITEM_AUTOFILL_SORT_NOT_APPLICABLE` | `autoFillSort` on anything but `PRODUCTS` |
| `MENU_AUTOFILL_ITEMS_EXCEEDED` | More than 10 auto-filled items in one menu |

**A blank url is not a missing url.** `url` absent, `null` or `""` means "no url"; a url made
only of whitespace counts as *given*. So `"url": "  "` on an `EXTERNAL` item is
`MENU_ITEM_URL_INVALID`, and on a `HEADING`, `ENTITY` or `ROUTE` item it is
`MENU_ITEM_KIND_FIELDS_INVALID`. Remove the field instead of blanking it.

`MENU_INVALID` **without** a `reason` means the file holds a value the API does not know at all —
an undefined `kind` / enum string, or an optional field of the wrong type. The CLI does not check
enum values; they reach the store and come back this way.

Not checked anywhere: whether an `ENTITY` item's `entityId` exists. A wrong id is saved, then
silently dropped on the storefront together with its subtree. `PAGE` and `BRAND` entity items
are saved but never render — link a page with a root-relative `EXTERNAL` url to its route.

## Handles themes look for

The reference theme shows the menu with handle **`main-menu`** in the header and **`footer`** in
the footer whenever the section has no menu selected. Creating menus under these handles makes them
appear without touching the theme or the editor. Which items to put in them when you do not know
the store's ids (auto-fill, root-relative links) is covered by the `estorepark-theme` skill's menus
reference.
