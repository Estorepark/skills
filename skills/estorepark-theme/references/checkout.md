# Checkout page settings — `config/checkout.json`

The checkout and thank-you pages are **built by the platform**: steps, address and delivery forms, coupon field, card
fields, 3-D Secure, totals and the "Siparişi onayla" button are locked. A theme cannot ship HTML, CSS or JavaScript for
them. It ships only **data**, in `config/checkout.json`, validated against a fixed platform schema (`schema_version: 1`).
The theme cannot extend the schema. The file is optional; the merchant edits it in the admin theme editor and publishes it
with the theme.

```json
{
  "schema_version": 1,
  "layout": { "columns": "two", "summary_side": "left", "mobile_summary": "collapsed" },
  "header": {
    "show_logo": true, "logo_position": "left", "logo_size": "medium", "show_back_link": true,
    "announcement": "Ücretsiz kargo", "color_scheme": "scheme-2", "background_image": null
  },
  "main": { "color_scheme": null, "background_image": null },
  "summary": { "heading": "Sipariş özeti", "show_trust_badges": true, "color_scheme": null, "background_image": null },
  "footer": { "visible": true, "style": "minimal", "note": "" },
  "style": { "corners": "soft", "field_style": "outlined", "button_style": "solid" },
  "typography": { "heading_font": "theme", "body_font": "theme" },
  "thank_you": { "style": "default", "heading": "Siparişiniz alındı", "message": "Teşekkür ederiz." },
  "zones": {
    "checkout.after_header": [{ "type": "announcement-bar", "settings": { "text": "Güvenli ödeme" } }]
  }
}
```

## Values

| Field | Values |
| ----- | ------ |
| `layout.columns` | `two` · `one` |
| `layout.summary_side` | `left` (default) · `right` |
| `layout.mobile_summary` | `collapsed` · `expanded` |
| `header.logo_position` / `logo_size` | `left` · `center` / `small` · `medium` · `large` |
| `header.announcement` | plain text, ≤ 200 |
| `*.color_scheme` (`header`, `main`, `summary`) | an id from `config/settings_data.json` → `current.color_schemes`, or `null` (the theme's brand colours) |
| `*.background_image` | a **media id** from the store's media library, or `null` — URLs are rejected |
| `summary.heading` | plain text, ≤ 60 |
| `footer.style` / `footer.note` | `minimal` · `detailed` / plain text, ≤ 500 |
| `style.corners` / `field_style` / `button_style` | `sharp` · `soft` · `round` / `outlined` · `filled` / `solid` · `outline` |
| `typography.*_font` | `theme` (follow the theme's heading / body `font_picker`) or any platform font library id (see [settings.md](settings.md#fonts)) |
| `thank_you.style` / `heading` / `message` | `default` · `celebratory` · `compact` / ≤ 80 / ≤ 1000 |

Text is plain: HTML is stripped, line breaks are kept (multi-line fields only), and overlong text is cut. The thank-you
page uses the checkout page's header, footer, colour and font values.

## Zones

Checkout: `checkout.after_header`, `checkout.before_form`, `checkout.after_summary`, `checkout.after_pay_button`,
`checkout.footer`. Thank-you: `thank_you.top`, `thank_you.after_summary`, `thank_you.footer`. At most **5 blocks** per zone.
Allowed block types: `announcement-bar` · `rich-text` · `image` · `trust-badges` · `support-contact` · `policy-links`. Each one
renders with **your theme's** `blocks/<type>.vitrine` (or `blocks/[<type>]/default.vitrine`) through a restricted engine and
an HTML sanitizer; `checkout-*` classes are removed from block output. Ship those block files if you want zones to show
anything.

## How the store reads it

Per field: a valid value in your file → the store's older checkout settings → the platform default. An invalid or unknown
value never breaks the page; it falls through to the next source. `estorepark theme check` warns about every problem
(invalid value, unknown key, unknown colour scheme or font, disallowed block, more than 5 blocks, unreadable JSON). The live
checkout reads the **published** version of the store's active theme; when the merchant switches themes, the new theme's file
applies.

`config/hosted-slots.json`'s checkout zones (`checkout.announcement`, `checkout.trust`, `checkout.footer_note`) are read only
as the store's older settings. Put new checkout blocks in `config/checkout.json` → `zones`. The `auth.*` zones of
`hosted-slots.json` still apply to the platform's fallback login/register page.
