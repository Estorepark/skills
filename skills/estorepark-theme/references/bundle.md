# Bundle directories

What each directory holds and what the engine expects from it.

## `config/`

| File | What |
| ---- | ---- |
| `routes.json` | **REQUIRED.** URL table — see [routes.md](routes.md) |
| `settings_schema.json` | Theme-wide settings form (colour scheme, typography, general preferences) |
| `settings_data.json` | Values for those settings; the `color_schemes` object lives here |
| `hosted-slots.json` | Blocks the theme contributes to slots on platform-hosted pages (checkout, account/auth) — see below |

When `config/` is missing, `theme check` warns "are you in the right folder?" — usually a sign
of running from the wrong directory.

## `layout/`

`theme.vitrine` is **required**: the `<html>` shell, the `{{{sections "header"}}}` /
`{{{sections "footer"}}}` region calls and the content slot live here. A second layout (such as
`account.vitrine`) can be added and is selected with `"layout": "account"` in the template JSON.

Layouts can be **chained**: a `layout/<name>.json` sidecar declares its own parent
(`layout/account.json` → `{ "layout": "theme" }`), and the chain is wrapped outside-in at render
time. Writing `"layout": false` in a template renders the page without any layout.

## `templates/`

One JSON per route target. Shape:

```json
{ "layout": "theme",
  "sections": { "<id>": { "type": "<section type>", "settings": {},
                          "blocks": { "<id>": { "type": "<block type>", "settings": {} } },
                          "block_order": ["<id>"] } },
  "order": ["<id>"] }
```

`order` sets the render order; an id present in `sections` but missing from `order` is **not
rendered**. A setting that is not written is `undefined` (a schema `default` is not applied).

Other fields a section or block entry may carry:

| Field | What |
| ----- | ---- |
| `variant` | Layout variant — `sections/[<type>]/<variant>.vitrine`; absent or empty means `default.vitrine` |
| `disabled` | `true` means the entry is not rendered (hide without deleting) |
| `block_order` | Block order. **When absent**, the key order of the `blocks` object is used |

Disabled blocks are skipped even if they remain in `block_order`.

## `sections/` and `blocks/`

`<type>.vitrine` — the file name must match the `type` in the template JSON exactly. A
variant-bearing element is a bracketed folder (`sections/[site-header]/default.vitrine`); the
schema is embedded in `default.vitrine` and shared by the variants.

An unknown type is **skipped silently** — no crash, just empty output.

## `regions/`

`<name>.json`, emitted from the layout with `{{{sections "<name>"}}}`. It differs from a template
JSON by carrying `type` and `name`:

```json
{ "type": "header", "name": "Header",
  "sections": { "header": { "type": "site-header", "settings": {}, "static": true } },
  "order": ["header"] }
```

`static: true` makes an entry the merchant cannot move or delete (its settings stay editable).
An unknown group name renders as silent emptiness.

## `snippets/`

Partials, called from a template with `{{> snippet-name}}`. They carry no schema.

## `locales/`

`<lang>.default.json` (e.g. `tr.default.json`). Selection chain:
`{locale}.default.json` → `{locale}.json` → `{lang}.default.json` → `{lang}.json`.
**First match wins — there is no merge.** A live request may carry a regional locale (`tr-TR`)
while themes ship the file as `tr.default.json`; that is why the base-language step exists.

Always write copy as `{{t "key" default="Text"}}`: the right text shows even when the locale file
is missing.

## `config/hosted-slots.json` in detail

Checkout and the account/login pages are surfaces **the platform** serves; they are not theme
routes. This file declares which blocks the theme puts into the named zones on those surfaces:

```json
{
  "checkout.announcement": [
    { "type": "announcement-bar", "settings": { "text": "Secure payment" } }
  ],
  "auth.footer": [{ "type": "policy-links", "settings": { "link_1_label": "Privacy" } }]
}
```

Defined zones: `checkout.announcement` · `checkout.trust` · `checkout.footer_note` ·
`auth.announcement` · `auth.footer`. Any other zone name is not rendered.

The block palette is **enforced server-side** — only these types are emitted:
`announcement-bar` · `rich-text` · `image` · `trust-badges` · `support-contact` ·
`policy-links`. A type outside the list is dropped silently; invalid JSON reduces the whole file
to nothing.

## `assets/`

CSS, JS, images, fonts. Used from templates with `{{asset_url "theme.css"}}`,
`{{stylesheet_tag …}}`, `{{script_tag …}}`.

**During `theme dev`, `assets/` is served from local disk** (images and fonts included), but
`theme init` / `theme pull` **do not download** binary assets, because the server returns text
only. Combined with `theme push`, that asymmetry can delete the assets on the server — see
`DRAFT_REPLACED` in the `estorepark-cli` skill.
