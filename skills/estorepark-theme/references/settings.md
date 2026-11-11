# Theme settings, colour schemes, fonts and style presets

The platform's default theme **Arasta** is the reference implementation of everything on this page — when in doubt,
copy its patterns (`config/settings_schema.json`, `config/settings_data.json`, any `sections/*.vitrine`).

## Setting principles (what makes a theme easy for merchants)

- Every setting makes a **visible** difference in the preview. No "advanced" toggles nobody can see.
- Each concept is set in **one** place: one corner style, one heading + one body font. Don't add a card radius next to a
  button radius next to a global radius.
- Offer choices in merchant language — `select` with `display: "segmented"` ("Köşeler: Keskin / Yumuşak / Yuvarlak")
  instead of pixel sliders (`range`).
- No explanatory text under settings: no `paragraph` entries, no `info` fields. If a setting needs a paragraph to be
  understood, redesign the setting.
- Checkout appearance lives in `config/checkout.json`, not in the theme settings (see [checkout.md](checkout.md)).
- Theme-wide settings: four groups, about 11 settings (Arasta: **Marka** logo + logo size · **Renkler** colour schemes +
  page scheme · **Yazı tipi** heading font, body font, type scale · **Stil** corners, buttons, cards, product image ratio).
- Every section carries `color_scheme` and `spacing` (`compact` / `normal` / `wide`, labelled Sıkı / Normal / Geniş) and
  at most 8 settings in total (blocks not counted). Content (text, images, links, resource pickers) belongs to sections
  and blocks.

## Colour schemes

Define the scheme fields once with a `color_scheme_group` (it carries no value) and store the schemes in
`config/settings_data.json` → `current.color_schemes`:

```json
{ "type": "color_scheme_group", "id": "color_schemes", "label": "Renk şemaları",
  "definition": [
    { "type": "color", "id": "background", "label": "Arka plan" },
    { "type": "color", "id": "text", "label": "Metin" },
    { "type": "color", "id": "accent", "label": "Vurgu" },
    { "type": "color", "id": "accent_text", "label": "Vurgu üstü metin" },
    { "type": "color", "id": "surface", "label": "Yüzey" },
    { "type": "color", "id": "border", "label": "Çizgi" }
  ],
  "role": { "bg": "background", "text": "text", "primary": "accent", "on_primary": "accent_text", "surface": "surface", "border": "border" } }
```

A **`color_scheme` setting** picks one of those schemes by id. On a **section**, the platform wraps the section in
`class="… color-<scheme-id>"` and prints, once per page, `.color-<scheme-id>{--color-<field>:<value>}` for every scheme.
Your CSS only reads the variables:

```css
body, .esp-section[class*=" color-"] { background: var(--color-background); color: var(--color-text) }
.btn { background: var(--color-accent); color: var(--color-accent_text) }
```

- Use a theme-wide `color_scheme` setting for the page background (Arasta: `page_scheme`) and put
  `class="color-{{settings.page_scheme}}"` on `<body>`. The same setting tells hosted pages and e-mails which colours are
  the theme's brand.
- Blocks are not wrapped — a block that offers `color_scheme` adds `color-{{block.settings.color_scheme}}` itself.
- Only hex, `rgb()` and `hsl()` values are printed; an unknown scheme id produces no class. Keep every scheme at WCAG AA
  (text on background and accent text on accent ≥ 4.5:1) — the editor flags "Düşük kontrast" below that.
- Derived colours that depend on the scheme (e.g. a muted text colour) must be declared on `body, .esp-section`, not on
  `:root`, or they freeze to the page scheme.

## Fonts

A `font_picker` value is an id from the **platform font library**: `system`, `inter`, `roboto`, `poppins`,
`montserrat`, `manrope`, `dm-sans`, `figtree`, `work-sans`, `nunito-sans`, `rubik`, `fraunces`, `lora`, `eb-garamond`,
`source-serif-4`, `space-grotesk`, `playfair-display`, `jetbrains-mono`. All cover Turkish and ship at least 400 and 700.

For every `font_picker` the platform prints `--font-<setting id>` (the family's fallback stack) and the `@font-face`
rules of the selected families only — the files come from the store's own origin (`/fonts/v1/…`), so no external font
service and no CSP change is needed. Mark the heading font `"role": "heading"` (its main weight is preloaded) and the
body font `"role": "body"` (hosted pages and e-mails use it).

```json
{ "type": "font_picker", "id": "heading_font", "label": "Başlık yazı tipi", "default": "manrope", "role": "heading" },
{ "type": "font_picker", "id": "body_font", "label": "Gövde yazı tipi", "default": "inter", "role": "body" }
```

```css
body { font-family: var(--font-body_font, system-ui, sans-serif) }
h1, h2, h3 { font-family: var(--font-heading_font, var(--font-body_font, system-ui, sans-serif)) }
```

Print `{{{content_for_header}}}` in the layout's `<head>` — that is where the variables and `@font-face` rules arrive.
Never hard-code `@font-face`, Google Fonts links or font files in the theme.

## Style presets

`config/settings_data.json` may carry ready-made styles next to `current`:

```json
"presets": {
  "sade":  { "name": "Sade",  "settings": { "color_schemes": { … }, "heading_font": "manrope", "body_font": "inter", "corners": "soft", … } },
  "zarif": { "name": "Zarif", "settings": { … } },
  "canli": { "name": "Canlı", "settings": { … } }
}
```

The editor shows them at the top of "Tema ayarları"; choosing one copies its `settings` onto the draft in one undoable
step. A preset holds **only** colour schemes, fonts and style settings — never the logo, sections or texts. Make the
first preset equal to the default values so a fresh store "is" that style. Keys must exist in `settings_schema.json`.

## `theme check`

Warns (never blocks upload) about: a `color_scheme` default or value that is not one of the theme's schemes, a
`font_picker` default or value that is not a library id, a preset that is not `{ name, settings }`, a preset key that is
not a theme setting, and a preset page scheme that its own schemes don't define.
