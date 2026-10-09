---
name: estorepark-theme
description: Write EstorePark storefront themes — the bundle contract covering `.vitrine` Handlebars templates with embedded section schemas, template/region JSON, `config/routes.json`, the closed helper catalogue, i18n, the listing surfaces (search box and autocomplete, facet panel, sorting, pagination), and optional customer e-mail designs shipped with the theme (`emails/`, `config/email_brand.json`). EstorePark tema geliştirme; "section ekle", "yeni şablon", "vitrin temasını düzenle", "rota ekle", "tema ayarı ekle", "arama kutusu ekle", "filtre paneli", "sıralama", "sayfalama", "temaya e-posta tasarımı ekle", "e-posta şablonu tasarla" gibi isteklerde kullan. To upload or publish a theme, use the estorepark-cli skill instead.
license: MIT
compatibility: The EstorePark V2 (vitrine) render engine. Validation requires `estorepark theme check`.
metadata:
  author: estorepark
  version: "0.6.0"
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
├── assets/                     # css/js/images
├── emails/customer/<t>.json    # optional — customer e-mail designs (not rendered by the storefront)
└── config/email_brand.json     # optional — e-mail brand kit
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

### `image_url`

Picks a generated size/format variant of a store image. **Always route catalogue images through
it** — product, collection, blog and cart images arrive as full-size originals otherwise.

```handlebars
{{image_url image width=800}}                        {{! smallest variant at least 800px wide }}
{{image_url image variant="small"}}                  {{! that exact rung — beats width= }}
{{image_url image variant="medium" format="webp"}}   {{! the WebP of that rung }}
{{image_url image}}                                  {{! the original }}
```

The rungs are `thumbnail` 150 · `small` 400 · `medium` 800 · `large` 1600, each in the original
format **and** WebP. `width=` expresses the slot you are filling and survives a rung change, so
prefer it; reach for `variant=` when you need two specific URLs side by side.

Serving WebP takes a `<picture>`, because the engine renders identically on the server and in the
browser and so cannot negotiate on `Accept`:

```handlebars
<picture>
  <source srcset="{{image_url image variant="medium" format="webp"}}" type="image/webp">
  <img src="{{image_url image variant="medium"}}" alt="{{image.alt}}" loading="lazy">
</picture>
```

`variant=` also makes a hand-written `srcset` possible — write the width descriptors yourself:

```handlebars
srcset="{{image_url image variant="small"}} 400w, {{image_url image variant="medium"}} 800w"
```

Anything the helper cannot satisfy — no variants, no rung wide enough, an unknown name, a missing
format, a `width` that is not a number — falls back to the original. A working large image beats a
broken small one, and variants are not guaranteed: processing is asynchronous and can fail, and
images uploaded before the pipeline existed have none at all.

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

## E-mail designs

A theme can carry designs for the store's **customer** e-mails (`emails/customer/<template>.json`)
and an e-mail brand kit (`config/email_brand.json`). They are data, not templates: the storefront
never renders them and nothing is sent from them until the merchant applies them in the admin panel,
which copies them into the store's e-mail settings. Read
[references/emails.md](references/emails.md) **before creating or editing any file under `emails/`
or `config/email_brand.json`** — file format, the recognised template keys, the block vocabulary,
tokens, the address rule and every rejection reason are there. A working file to start from:
[`assets/email-template.json`](assets/email-template.json).

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
- **`{{image.url}}` is the ORIGINAL — never put it in an `<img src>` for a card or thumbnail.**
  Originals are archive-grade: one measured product photo is 617 KB as `original.jpg` and 45 KB
  as `medium.jpg`. Route catalogue images through `{{image_url image width=…}}`. `image.url`
  stays in the contract because `og:image`, JSON-LD and the image sitemap need the full size.
- **`image_url` used to append a meaningless `?width=N`.** The CDN ignored the query string, so
  the original was served at full size and the theme author believed they had optimised. It now
  selects a real variant and appends nothing. If you are reading an older theme, every
  `width=` call there was a no-op.
- **The rungs stop at 1600.** `width=1920` matches nothing and falls back to the original — ask
  for `width=1600` and you get `large`, which is usually pixel-identical to the original but
  around 78% smaller.
- **E-mail addresses cannot be relative.** In `emails/*.json` a `/kampanya` link or a path to a
  theme asset is rejected (`INVALID_URL`) — e-mails have no base URL. Write `{{storeUrl}}/kampanya` or an
  absolute `https://` address; theme assets cannot be referenced from an e-mail at all.
- **`schemaVersion` must be exactly `2`; block `id`s are optional.** Missing or duplicated ids are
  filled in for you — do not invent an id scheme.
- **The storefront never renders `emails/` or `config/email_brand.json`, and a bad file never
  fails `theme check`, `push` or `publish`.** It is only reported (`theme push` lists it) and can
  never be applied. A typo in the file name (`order-confirmaton.json`) makes the file silently
  *ignored* as an unknown template.
- **Only customer e-mails come from a theme.** Merchant/system e-mails (new-order notices etc.)
  are not themeable; such a file is ignored.
- **Applying an e-mail design copies it.** After the merchant applies it, a later theme update does
  not change the sent e-mail; nothing is applied automatically on publish.
- **The default theme's e-mail files are marked `"platformDefault": true`.** They are reference
  copies of the platform defaults and can never be applied. If you copy one as a starting point,
  **remove that line**, otherwise your design is ignored (`PLATFORM_DEFAULT_COPY`).
- **Keep the unsubscribe link in `customer/checkout-abandoned`.** The default design links
  `{{storeUrl}}/checkout/unsubscribe/{{unsubscribeToken}}`; it is legally required for this
  e-mail and nothing enforces it if you drop it.
- **Image-type SETTINGS do not get variants.** A merchant-uploaded `image` setting is stored as
  a bare URL string, so `{{image_url settings.logo width=480}}` returns that string unchanged.
  Only catalogue images (product, collection, blog, cart) carry variants.

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
