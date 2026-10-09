# E-mail designs in a theme

A theme can ship **optional** designs for the store's customer e-mails and an e-mail brand kit.
Read this before you create or edit anything under `emails/` or `config/email_brand.json`.

The theme only carries **data**. The storefront never renders these files, and sending never reads
the theme: the merchant applies a design explicitly in the admin panel (after publishing, or later
from **E-posta şablonları › Temadan uygula**), which **copies** it into the store's own e-mail
settings. From then on the store's copy is what gets sent — a later theme update does not change an
applied e-mail.

## Files

```
theme/
├── emails/customer/<template>.json   # one optional design per customer e-mail
└── config/email_brand.json           # optional e-mail brand kit
```

The path follows the template key exactly: `emails/customer/order-confirmation.json` designs
`customer/order-confirmation`. Only the keys below are recognised.

### Template file

```json
{
  "schemaVersion": 2,
  "subject": "Siparişiniz alındı — {{orderNumber}}",
  "blocks": [ … ]
}
```

| Field | Rule |
| ----- | ---- |
| `schemaVersion` | Required, exactly `2` |
| `subject` | Optional string. Absent, empty or whitespace-only means "the platform's default subject". `null` is a parse error |
| `blocks` | Required, a non-empty array of blocks (below) |
| `platformDefault` | Optional boolean. `true` marks a reference copy: the file is ignored and can never be applied |

Block `id`s are optional — missing or duplicated ids are filled in automatically. A working
example: [`assets/email-template.json`](../assets/email-template.json).

### Brand file

```json
{
  "logoUrl": "https://cdn.example.com/logo.png",
  "brandColor": "#1f2937",
  "kit": { "colors": { "accent": "#b45309" }, "button": { "variant": "pill" } }
}
```

Every field is optional and is checked **field by field**: an invalid field is dropped silently and
the rest stays usable. `null` or an empty string means "not given" — **a theme never clears a value
the merchant already has.** When a field is not in the file the merchant's current value is kept;
when `kit` is in the file it replaces the merchant's kit **as a whole** (no merging).

| Field | Rule (otherwise dropped) |
| ----- | ------------------------ |
| `logoUrl` | Absolute `https://` URL, at most 500 characters |
| `brandColor` | Hex colour `#` + 3–8 hex digits |
| `kit` | Object (an array or string is a parse error). Unknown keys are dropped; a kit with nothing valid left counts as "not given" |

Kit fields:

| Key | Values |
| --- | ------ |
| `colors.accent` · `.text` · `.heading` · `.pageBg` · `.contentBg` · `.buttonText` | Hex colours |
| `typography.fontFamily` | `default` · `serif` · `mono` |
| `typography.baseFontSize` | Number, clamped to 12–24 |
| `typography.headingScale` | `compact` · `normal` · `large` |
| `button.radius` | Number, clamped to 0–999 |
| `button.size` · `button.variant` | `sm`/`md`/`lg` · `filled`/`outline`/`pill` |
| `social` | Up to 7 `{ "kind", "url" }`; `kind` one of `instagram`, `facebook`, `x`, `youtube`, `tiktok`, `linkedin`, `whatsapp`; `url` must start with `http(s)://` |
| `footer.text` · `.supportEmail` · `.address` · `.phone` | Strings (max 1000 / 255 / 255 / 40); available in templates as `{{brandFooterText}}`, `{{supportEmail}}`, `{{brandAddress}}`, `{{brandPhone}}` |

## Recognised templates

| Key | Name in the admin | Dynamic blocks allowed | Template-specific tokens |
| --- | ----------------- | ---------------------- | ------------------------ |
| `customer/order-confirmation` | Sipariş Onayı | `order-meta` `order-items` `order-summary` `contracts` | order + totals |
| `customer/order-transfer-pending` | Havale/EFT Bekleniyor | `order-meta` `order-items` `order-summary` | order + totals |
| `customer/order-cancel-rejected` | İptal Talebi Reddedildi | `order-meta` `order-summary` | order |
| `customer/order-refund-initiated` | İade İşleme Alındı | `order-meta` `order-summary` | order |
| `customer/order-canceled` | Sipariş İptal Edildi | `order-meta` `order-items` `order-summary` | order |
| `customer/welcome` | Hoş Geldiniz | — | — |
| `customer/password-reset` | Şifre Sıfırlama | — | `{{resetUrl}}` `{{expiresInMinutes}}` |
| `customer/verify-email` | E-posta Doğrulama | — | `{{verifyUrl}}` |
| `customer/checkout-abandoned` | Sepet Hatırlatma | `order-items` `order-summary` | order (no `order-meta`) |
| `customer/order-shipped` | Siparişiniz Yola Çıktı | — | `{{trackingUrl}}` `{{trackingNumber}}` `{{carrierName}}` `{{shipmentNumber}}` only |
| `customer/order-delivered` | Sipariş Teslim Edildi | — | `{{shipmentNumber}}` `{{reviewUrl}}` only |
| `customer/order-refunded` | İade Tamamlandı | `order-meta` `order-summary` | order (not sent yet) |

Tokens available in every template except the two shipment e-mails: `{{storeName}}`,
`{{storeUrl}}`, `{{customerFirstName}}` and the brand footer tokens above. "order" adds
`{{orderNumber}}` `{{orderDate}}` `{{orderUrl}}` `{{totalPrice}}` `{{itemCount}}`; "totals" adds
`{{totals.subtotalPrice}}` `{{totals.goodsDiscount}}` `{{totals.shippingPrice}}`
`{{totals.shippingDiscount}}` `{{totals.addedTax}}` `{{totals.includedTax}}` (minor units — use the
`order-summary` block for formatted amounts). Helpers: `{{default value "fallback"}}`,
`{{money amount currency}}`, `{{#if (eq a b)}}`.

Merchant and system e-mails (new-order notices to the merchant, etc.) are not themeable; a file for
one of them is ignored.

## Blocks

Each block is `{ "type": …, …fields, "style"?: {…} }`. `style` values are normalised (hex colours,
clamped numbers, enums); an invalid style value is dropped, not rejected.

| Type | Fields |
| ---- | ------ |
| `logo` | `align`; optional `url`, `href`, `width` (no `url` → the store's logo, else its name) |
| `heading` | `text`, `level` 1–3, `align` |
| `text` | `html` (allowed tags: `h1–h3 p br ul ol li strong b em i u span a`) |
| `button` | `label`, `url` (required), `align` |
| `image` | `url` (required), `alt`, `align`; optional `width`, `href` |
| `divider` · `spacer` | — · `size` `sm`/`md`/`lg` |
| `social` | `networks` (≤ 7 `{ kind, url }`), `align` |
| `coupon` | `code`; optional `note` |
| `product` | `title`; optional `imageUrl`, `price`, `url`, `buttonLabel` |
| `columns` | `preset` `2`/`3`/`4`/`wide-left`/`wide-right`, `children`: one array of blocks per column — one level only, no dynamic blocks inside |
| `order-meta` · `order-items` · `order-summary` · `contracts` | Dynamic: filled at send time; only where the table above allows |

`align` is `left`, `center` or `right` — anything else makes the file invalid.

## Addresses

`button.url`, `image.url`/`href`, `logo.url`/`href`, `product.url`/`imageUrl`, social URLs **and
every `<a href>` inside a `text` block** must be either:

- an absolute address starting with `https://`, `http://` or `mailto:`, or
- start with a token, with no unsafe scheme left once the tokens are removed:
  `{{orderUrl}}`, `{{storeUrl}}/kampanya`, `{{storeUrl}}/checkout/recover/{{recoveryToken}}`.

A relative path (`/kampanya`, `assets/logo.png`) is rejected — e-mails have no base URL. A theme
asset cannot be referenced from an e-mail.

## How a file is judged

Each file is checked on its own; one bad file never affects the others. The first rule that fails,
in this order, is the reason reported:

1. not a `.json` file under `emails/` → ignored
2. path is not a recognised template → ignored
3. size → 4. JSON / top-level shape → 5. `platformDefault: true` → ignored → 6. `schemaVersion` →
   7. block structure and broken `{{…}}` → 8. subject length → 9. block not allowed here →
   10. address rule

The brand file: size → shape → field drops → no valid field left.

| Value | Kind | When | Label shown to the merchant |
| ----- | ---- | ---- | --------------------------- |
| `NOT_JSON_FILE` | ignored | A non-`.json` file under `emails/` | JSON olmayan dosya |
| `UNKNOWN_TEMPLATE` | ignored | A `.json` whose path is not a recognised template (merchant/system e-mails included) | Tanınmayan e-posta şablonu |
| `PLATFORM_DEFAULT_COPY` | ignored | `"platformDefault": true` | Platform varsayılanının referans kopyası |
| `FILE_TOO_LARGE` | template, brand | Larger than 262 144 bytes (256 KiB) | Dosya 256 KB sınırını aşıyor |
| `PARSE_ERROR` | template, brand | Unparseable JSON; root not an object; `blocks` not an array; `subject` given (also `null`) but not a string; `platformDefault` given (also `null`) but not a boolean; brand `kit` given, not `null`, not an object | Dosya okunamadı (geçersiz JSON ya da beklenmeyen yapı) |
| `UNSUPPORTED_SCHEMA_VERSION` | template | `schemaVersion` is not `2` | Desteklenmeyen şema sürümü (2 olmalı) |
| `INVALID_BLOCKS` | template | Unknown block type, wrong field type, more than 100 blocks (column children count), nested `columns`, empty list, an `align` that is not `left`/`center`/`right`, or a `{{…}}` that cannot be rendered anywhere in the e-mail (subject and image `alt` included) | Geçersiz blok yapısı ya da bozuk değişken (`{{ }}`) |
| `SUBJECT_TOO_LONG` | template | Subject longer than 255 characters | Konu satırı 255 karakteri aşıyor |
| `BLOCK_NOT_ALLOWED` | template | A dynamic block the template does not allow, or any dynamic block inside `columns` | Bu e-postada kullanılamayan blok |
| `INVALID_URL` | template | An address breaking the rule above, or an empty `button.url` / `image.url` (empty optional addresses count as absent) | Geçersiz adres (tam adres ya da `{{değişken}}` ile başlamalı) |
| `NO_VALID_FIELDS` | brand | Nothing valid left after the field drops | Marka dosyasında geçerli değer yok |

An invalid or ignored file never blocks `theme check`, `theme push` or `theme publish` — it is
reported and stays unappliable. `theme push` lists them (see the `estorepark-cli` skill).

## What the merchant sees

For each recognised file the platform compares the design with the store's current one:
**new** (the store uses the platform default and the design differs), **differs** (the store has
its own design and yours differs — applying overwrites it), **same**, or **invalid**. New items are
pre-selected; differing ones are not. Ignoring block ids, the comparison runs after the same
cleanup the editor applies, so a byte-for-byte copy of the store's design shows as **same**.
