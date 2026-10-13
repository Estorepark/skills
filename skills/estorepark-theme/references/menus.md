# Navigation menus

Menus are **store data**, not theme files. The merchant manages them in the admin panel, or an
agent manages them with the `estorepark menu` commands (`estorepark-cli` skill). A theme only
**finds** a menu and renders it — it never ships menu content in the bundle.

A theme reaches menus two ways:

- a section setting of `type: "resource"`, `resource: "menu"` — the merchant picks one menu;
- the `linklists` global — every menu of the store, keyed by **handle**.

The reference theme combines them in a fixed lookup order (below). Copy it; do not invent another.

## The shape

```ts
interface Menu     { id: string; items: MenuLink[] }
interface MenuLink { title: string; url?: string; is_heading?: boolean; new_tab?: boolean;
                     active?: boolean; children?: MenuLink[]; has_more?: boolean }
```

| Field | Note |
| ----- | ---- |
| `Menu.id` | The menu's **handle** (`main-menu`), not the database id the setting stores |
| `Menu.items` | Top-level links in the merchant's order. There is **no menu title** in the contract — a column heading is the theme's own copy (`{{t "general.menu" default="Menü"}}`) |
| `title` | Link text |
| `url` | Ready to print: built by the server for entity and auto-filled links (it follows the theme's route prefixes), the stored value for external links. **Absent on headings** |
| `is_heading` | A group label (mega-menu column, drawer divider), not a link — render a `<span>` |
| `new_tab` | The merchant asked for a new tab → `target="_blank" rel="noopener"`. Absent when false |
| `active` | Declared in the contract but **not set on menu links today** — do not build current-page highlighting on it |
| `children` | Sub-links; absent when there are none. At most three levels in total |
| `has_more` | The item's children were auto-filled and the source has more than shown (limit, per-page budget or depth). Print a "view all" link to the item's own `url`. Absent when false |

```handlebars
{{#each menu.items}}
  {{#if is_heading}}<span>{{title}}</span>{{else}}<a href="{{url}}"{{#if new_tab}} target="_blank" rel="noopener"{{/if}}>{{title}}</a>{{/if}}
  {{#if children}}
    {{#each children}}…{{/each}}
    {{#if has_more}}{{#if url}}<a href="{{url}}">{{t 'menu.view_all' default='Tümünü gör'}}</a>{{/if}}{{/if}}
  {{/if}}
{{/each}}
```

Guard `has_more` with `{{#if url}}` — a heading has nowhere to link to.

## A bound setting (`resource: menu`)

```json
{ "type": "resource", "id": "menu", "resource": "menu", "label": "Menü",
  "info": "Header navigasyonu için bir menü seç. Seçilmezse ya da bu mağazada bulunamazsa main-menu handle'lı menü, o da yoksa temanın menüsüz görünümü kullanılır." }
```

- The stored value is the menu's **database id** — it exists on one store only.
- The engine resolves it and puts the `Menu` at the **top level of the section scope, under the
  setting id**: `{{menu.items}}` for `"id": "menu"`, `{{footer_menu.items}}` for
  `"id": "footer_menu"`. `section.settings.menu` keeps the raw id string.
- An id that does not resolve on this store (another store's menu, a deleted menu) leaves the
  top-level variable **absent**. `section.settings.menu` is still a non-empty string, so never
  branch on it — branch on the bound object.
- A resolved menu with no items — including one whose every item was dropped at render — is
  still a truthy object: `{{#if menu}}` passes and `{{#each menu.items}}` renders nothing.
- Only **section** settings are bound. A `resource` setting in a block schema is not resolved.

## `linklists`

A global available in every template: all of the store's menus, keyed by handle.

```handlebars
{{linklists.footer.items}}
{{linklists.[main-menu].items}}
```

Write a hyphenated handle as a **segment literal** — `linklists.[main-menu]`. It is the form the
reference theme uses and reads unambiguously for any handle (handles are `a-z`, `0-9` and `-`).

Handle constants (sector norm, used by the reference theme): **`main-menu`** for the header,
**`footer`** for the footer.

## The lookup order

Header (all three variants, desktop nav and mobile drawer) and footer find their menu like this:

1. **The menu selected in the section setting** — if it resolves on this store. A resolved menu
   with no items still wins: the section shows its no-menu fallback, it does **not** fall through
   to the handle.
2. Nothing selected, or the selected id does not resolve here → the menu with the handle
   `main-menu` (header) / `footer` (footer).
3. Neither exists → the section's no-menu behaviour: the reference theme's `default` and
   `merkezi` headers and the footer print fallback links; the `minimal` header hides its desktop
   nav (the drawer still prints fallback links).

The working idiom — rule 1 in the `{{#if}}`, rule 2 as a **partial hash parameter**, rule 3 inside
the snippet:

```handlebars
{{!-- sections/[site-header]/default.vitrine --}}
<nav class="site-header__nav">
  {{#if menu}}{{> header-nav}}{{else}}{{> header-nav menu=linklists.[main-menu]}}{{/if}}
</nav>

{{!-- sections/site-footer.vitrine --}}
{{#if menu}}{{> footer-menu}}{{else}}{{> footer-menu menu=linklists.footer}}{{/if}}
```

```handlebars
{{!-- snippets/header-nav.vitrine — reads `menu` either way --}}
{{#if menu.items}}
  {{#each menu.items}}…{{/each}}
{{else}}
  <a class="nav-item" href="{{routes.collections_url}}">Koleksiyonlar</a>
  …
{{/if}}
```

The hash parameter adds `menu` to the partial's context, so one snippet serves both paths. When
`linklists.[main-menu]` does not exist, `menu` is undefined inside the snippet and the fallback
renders. The `minimal` variant wraps the whole `<nav>` in `{{#if menu.items}}` /
`{{#if linklists.[main-menu].items}}` instead, so an empty menu hides the nav.

Rules that keep a theme portable:

- **Never hard-code a menu id** in `templates/*.json` or `regions/*.json`. The id belongs to one
  store; leave the setting unset so a fresh store falls through to the handle.
- Keep the setting `info` text in sync with the lookup order — the merchant reads it in the editor.
- If you rename the setting id, rename the variable in the idiom too (`{{#if nav_menu}}{{> header-nav menu=nav_menu}}…`).

## What a menu can contain, and what disappears

Rules enforced when a menu is saved (the CLI and the admin panel both hit them):

- depth ≤ 3 levels, ≤ 500 items in total (all levels), ≤ 10 auto-filled items per menu;
- auto-fill limits: products default 8, max 20; categories default 20, max 50 **per level**.

Dropped at render time, silently:

- **`PAGE` and `BRAND` entity items** never resolve on the storefront. Link a page with a
  root-relative `EXTERNAL` url to its route (`/hakkimizda`) instead.
- **Entity items whose target cannot be resolved** (unknown or deleted id, unpublished
  collection) are dropped **together with their whole subtree**. Entity ids are not checked when
  the menu is saved, so a wrong id only shows up as a missing link.
- Entity-link resolution is budgeted per page (150 across all menus); items past the budget drop.

Auto-filled children are generated at render and are never stored in the menu. They also have a
per-page budget; when it runs out the item keeps its own link, gets no (or fewer) children and
carries `has_more`.

## Writing menu content

When an agent builds menus for a theme it usually does not know the store's category, collection
or product ids — and the CLI cannot look them up. Prefer content that needs no ids:

- **Auto-fill.** A `HEADING` (or `EXTERNAL`) item with `"autoFill": "ALL_CATEGORIES"` lists the
  store's active root categories (and their subcategories, within the depth limit) at render time.
  An auto-filled item must sit at depth 1 or 2 and cannot have manual children.
- **Root-relative `EXTERNAL` links** to routes the theme declares in `config/routes.json`:
  `/koleksiyonlar`, `/urunler`, `/blog`, `/hakkimizda`. Such a url is stored verbatim — it does not
  follow a later route rename, while entity and auto-filled links do.
- Use `ENTITY` items only with ids the user gave you. `ROUTE` items exist for old menus only.

```json
{ "handle": "main-menu", "title": "Ana Menü", "items": [
  { "title": "Kategoriler", "kind": "HEADING", "autoFill": "ALL_CATEGORIES" },
  { "title": "Koleksiyonlar", "kind": "EXTERNAL", "url": "/koleksiyonlar" },
  { "title": "Hakkımızda", "kind": "EXTERNAL", "url": "/hakkimizda" }
] }
```

Create it with `estorepark menu create --file …` — the file format, confirmation rules and error
codes are in the `estorepark-cli` skill. A created or changed menu shows up in `theme dev` /
`theme preview` on the next page load.
