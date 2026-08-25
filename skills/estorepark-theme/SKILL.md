---
name: estorepark-theme
description: Write EstorePark storefront themes — the bundle contract covering `.vitrine` Handlebars templates with embedded section schemas, template/region JSON, `config/routes.json`, the closed helper catalogue, i18n, and the listing surfaces (search box and autocomplete, facet panel, sorting, pagination). EstorePark tema geliştirme; "section ekle", "yeni şablon", "vitrin temasını düzenle", "rota ekle", "tema ayarı ekle", "arama kutusu ekle", "filtre paneli", "sıralama", "sayfalama" gibi isteklerde kullan. To upload or publish a theme, use the estorepark-cli skill instead.
license: MIT
compatibility: The EstorePark V2 (vitrine) render engine. Validation requires `estorepark theme check`.
metadata:
  author: estorepark
  version: "0.4.0"
---

# The EstorePark theme bundle

A theme is a versioned **file bundle**; the folder on disk is the source of truth. Rendering
happens on the server with an isomorphic Handlebars derivative. This skill covers **writing**
the files; for uploading and publishing use `estorepark-cli`.

## Directory layout

```
theme/
├── config/routes.json          # REQUIRED — URL table
├── config/settings_schema.json # theme-wide settings form
├── config/settings_data.json   # values for those settings
├── layout/theme.vitrine        # REQUIRED — page shell
├── templates/<name>.json       # one file per route target
├── sections/<type>.vitrine     # band-level component (+ embedded schema)
├── blocks/<type>.vitrine       # repeating unit inside a section
├── regions/<name>.json         # page-level regions such as header/footer
├── snippets/*.vitrine          # partials
├── locales/<lang>.default.json # translations
└── assets/                     # css/js/images
```

Structural validation: `estorepark theme check` — it fails when `config/routes.json` is missing
or unparseable, when `layout/theme.vitrine` is missing, or when a route points at a
`templates/<name>.json` that does not exist.

## Anatomy of a section

A section is one file: markup plus an **embedded schema**. The file writes only the **inner**
markup — the outer wrapper (`schema.tag` + `esp-section` + editor attributes) is produced by the
engine.

```handlebars
<div class="hero">
  <h1>{{editable section.settings.heading field="heading" scope="section"}}</h1>
  {{#each section.blocks}}{{{block this}}}{{/each}}
</div>
{{!-- schema
{
  "$schema": "estorepark/section-schema/v0",
  "name": "Hero",
  "tag": "section",
  "settings": [
    { "type": "text", "id": "heading", "label": "Heading", "default": "New season" }
  ],
  "blocks": [{ "type": "button" }],
  "max_blocks": 2,
  "presets": [{ "name": "Hero" }]
}
--}}
```

Every schema field and all setting types: [references/sections.md](references/sections.md).

## Template and region JSON

`templates/index.json` — which section appears, with which settings, in which order:

```json
{
  "layout": "theme",
  "sections": {
    "hero": { "type": "hero", "settings": { "heading": "Timeless wardrobe" },
              "blocks": { "b1": { "type": "button", "settings": { "label": "Explore" } } },
              "block_order": ["b1"] },
    "featured": { "type": "featured-collection", "settings": { "heading": "Featured" } }
  },
  "order": ["hero", "featured"]
}
```

`regions/header.json` has the same shape plus `type` and `name`, and is emitted from the layout
with `{{{sections "header"}}}` (the file name is the group name). An unknown group name renders
as silent emptiness — no error, so a typo goes unnoticed.

## Helper catalogue (CLOSED)

These are the helpers the engine knows; a theme cannot add new ones:

`money` · `image_url` · `asset_url` · `stylesheet_tag` · `script_tag` · `t` / `translate` ·
`date` · `link_to` · `editable` · `editor_attributes` · `block` · `sections`

Built-ins: `if` · `unless` · `each` · `with` · `lookup`.

A helper that is not on this list (`capitalize`, `eq`, `json`, arithmetic …) **does not resolve**
at render time. Solve the transformation where the data is prepared, not in the template.

**There is no equality helper, and there will not be one.** `{{#if}}` tests truthiness only — it
cannot branch on the *value* of an enum. Every enum a theme must branch on therefore ships with a
boolean companion: `Campaign.kind` → `is_catalog`, `Cart.discounts[].scope` → `is_shipping`,
`sale_source` → `is_campaign_sale`. Branch on the boolean; keep the enum for a CSS class or
`data-*` hook.

### `date`

```handlebars
{{date post.published_at}}                    {{! 13.08.2026 — needs no locale data }}
{{date post.published_at format="long"}}      {{! 13 Ağustos 2026 — reads date.months.<1..12> }}
{{date order.created_at format="datetime"}}   {{! 13.08.2026 14:30 }}
```

It prints the wall-clock fields **as written** and never shifts: the server emits timestamps in
the store's own offset (`2026-08-13T12:00:00+03:00`). An unparseable value, or a missing month
name under `format="long"`, falls back to the raw/numeric output — never an invented date.

## i18n

Always write copy with `default=`:

```handlebars
{{t "cart.empty" default="Your cart is empty"}}
```

Resolution order: locale key → `default=` → the key itself. Even with a missing locale file the
customer sees the right text. **There is no interpolation** (no placeholder mechanism such as
`{{t "hi" name=x}}`) — a variable part is emitted as a separate element in the template.

File selection: `locales/{locale}.default.json` → `{locale}.json` → `{lang}.default.json` →
`{lang}.json`. **First match wins, there is no merge.**

## Route table

`config/routes.json` defines this theme's URLs; apart from the platform-reserved paths they
belong to the merchant. Fields and examples: [references/routes.md](references/routes.md).

## Listing surfaces

Collection, category, product index and search all render from the same objects: `products`
(`Card[]`), `filters`, `applied_filters`, `sort_options` and `paginate`. Every `url` on them is
**server-generated** — the theme prints them, it never builds one.

```handlebars
{{#each sort_options}}
  <a href="{{this.url}}" {{#if this.active}}aria-current="true"{{/if}}>{{t this.label default=this.value}}</a>
{{/each}}
```

The search box posts to `{{routes.search_url}}` with `name="q"` and works without JavaScript;
autocomplete (`{{routes.search_suggest_url}}`) and in-place refresh
(`{{routes.search_results_url}}`) are enhancements layered on top.

Objects, the range-filter form, both endpoints and their gotchas:
[references/listing.md](references/listing.md).

## Gotchas

- **A schema `default` is NOT applied at render time.** `default` is editor metadata. Rendering
  reads only the `settings` written in `templates/*.json` or `regions/*.json`. Even with
  `{"type":"checkbox","id":"show_note","default":true}` declared, if the template JSON does not
  contain `"show_note": true` the `{{#if section.settings.show_note}}` block **never renders**.
  When adding a section, write the defaults into the template/region JSON as well.
- **A setting `id` must match `^[a-z][a-z0-9_]*$`.** A hyphenated id (`hero-title`) parses as a
  **subtraction expression** in Handlebars → silent breakage, no error, empty output.
- **`/cart` and `/cart/*` are platform-reserved.** Even if the bundle declares the same path,
  the platform route wins. The cart **page** is the theme's own: `templates/cart.json` plus an
  exact route with `template: "cart"` in `routes.json` (`/sepet` in the default theme). Post
  cart forms to the platform endpoints, not to a path you invent.
- **`/search` and `/search/*` are platform-reserved too.** The search **page** is the theme's
  (`templates/search.json` plus an exact route with `template: "search"` — `/ara` in the default
  theme, read from `{{routes.search_url}}`), while autocomplete and the listing fragment are the
  platform's: `{{routes.search_suggest_url}}` and `{{routes.search_results_url}}`.
- **A theme never writes a listing querystring.** Filter, sort and pagination URLs all arrive
  ready-made on `filters` / `sort_options` / `paginate`; a hand-written `?sort=…` is dropped
  silently when it falls outside the allowlist, and a hand-written `?brand=…` wipes the active
  search term and the other filters. Read [references/listing.md](references/listing.md) before
  building any list, facet panel, sort control, pagination or search box.
- **Reserved heads:** `api`, `admin`, `graphql`, `assets`, `_next`, `.well-known`, `checkout`,
  `cart`, `search`. The first segment of a route cannot be one of these.
- **`theme init` / `theme pull` do not download binary assets** (the server returns text only).
  Running `theme push` while images are missing locally deletes the assets on the server — see
  the `DRAFT_REPLACED` warning in the `estorepark-cli` skill.
- **An unknown section type does not crash, it is skipped.** A `type` in template JSON with no
  matching `sections/<type>.vitrine` renders nothing, silently. When a region comes out empty,
  first compare the type name against the file name.
- **Rendering is deterministic.** Engine helpers are pure and deterministic; template output
  must be byte-identical on the server and in the browser. Do not try to produce output that
  varies with the current date or locale.

## Adding a new section

1. Copy `assets/section-template.vitrine` to `sections/<type>.vitrine` — the markup and embedded
   schema skeleton are ready.
2. Adjust `name`, `settings` and `blocks` for the job (id rule: `^[a-z][a-z0-9_]*$`). Labels and
   defaults are merchant-facing: write them in the store's language.
3. Bind the section to a template: add a `sections` + `order` entry as in the
   `assets/template.json` example — **write the setting values there**, a schema `default` never
   reaches the renderer.
4. Run `estorepark theme check`, then look at it with `estorepark theme dev`.

## Validation loop

1. `estorepark theme check` — catches structural errors (offline).
2. `estorepark theme dev` — live preview with real data.
3. When a region comes out empty, check in order: does the entry have `"disabled": true` → is
   the id listed in `order` → does the section file name match `type` (and with variants, does
   `sections/[<type>]/<variant>.vitrine` exist) → are the `settings` written in the template JSON
   (a schema `default` does not count).
