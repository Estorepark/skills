# Bundle dizinleri

Her dizinin ne taşıdığı ve motorun ondan ne beklediği.

## `config/`

| Dosya | Ne |
| ----- | -- |
| `routes.json` | **ZORUNLU.** URL tablosu — bkz. [routes.md](routes.md) |
| `settings_schema.json` | Tema geneli ayar formu (renk şeması, tipografi, genel tercihler) |
| `settings_data.json` | O ayarların değerleri; `color_schemes` objesi burada yaşar |
| `hosted-slots.json` | Platformun kendi sunduğu sayfalardaki (checkout, hesap/auth) slot'lara temanın basacağı bloklar — aşağıya bakın |

`config/` yoksa `theme check` "doğru klasörde misiniz?" uyarısı verir — genelde yanlış dizinden
çalıştırma işaretidir.

## `layout/`

`theme.vitrine` **zorunludur**: `<html>` iskeleti, `{{{sections "header"}}}` /
`{{{sections "footer"}}}` bölge çağrıları ve içerik yuvası burada. İkinci bir layout
(`account.vitrine` gibi) eklenebilir; template JSON'unda `"layout": "account"` ile seçilir.

Layout'lar **zincirlenebilir**: `layout/<ad>.json` sidecar'ı kendi ebeveynini bildirir
(`layout/account.json` → `{ "layout": "theme" }`), zincir DIŞ→İÇ sarılarak render edilir.
Template'te `"layout": false` yazarsanız sayfa layout'suz render edilir.

## `templates/`

Rota hedefi başına bir JSON. Şekli:

```json
{ "layout": "theme",
  "sections": { "<id>": { "type": "<section tipi>", "settings": {},
                          "blocks": { "<id>": { "type": "<block tipi>", "settings": {} } },
                          "block_order": ["<id>"] } },
  "order": ["<id>"] }
```

`order` render sırasını belirler; `sections` içinde olup `order`'da olmayan bir id
**render edilmez**. `settings` yazılmayan bir ayar `undefined`'dır (şema `default`'u
uygulanmaz).

Section ve block girdilerinin taşıyabileceği diğer alanlar:

| Alan | Ne |
| ---- | -- |
| `variant` | Layout varyantı — `sections/[<type>]/<variant>.vitrine`; yoksa/boşsa `default.vitrine` |
| `disabled` | `true` ise o girdi render edilmez (silinmeden gizlemek için) |
| `block_order` | Blok sırası. **Verilmezse** `blocks` objesinin anahtar sırası kullanılır |

`disabled` bloklar `block_order`'da kalsa bile atlanır.

## `sections/` ve `blocks/`

`<tip>.vitrine` — dosya adı, template JSON'undaki `type` ile birebir aynı olmalı. Varyantlı
element köşeli parantezli klasördür (`sections/[site-header]/default.vitrine`), şema
`default.vitrine`'e gömülüdür ve varyantlar onu paylaşır.

Bilinmeyen tip **sessizce atlanır** — çökme yok, boş çıktı var.

## `regions/`

`<ad>.json`; layout'tan `{{{sections "<ad>"}}}` ile basılır. Template JSON'undan farkı `type`
ve `name` alanlarını taşımasıdır:

```json
{ "type": "header", "name": "Üst Bilgi",
  "sections": { "header": { "type": "site-header", "settings": {}, "static": true } },
  "order": ["header"] }
```

`static: true` girdiyi merchant'ın taşıyıp silemeyeceği hâle getirir (ayarı düzenlenebilir).
Bilinmeyen grup adı sessizce boş render edilir.

## `snippets/`

Partial'lar. Şablondan `{{> snippet-adi}}` ile çağrılır; şema taşımaz.

## `locales/`

`<dil>.default.json` (ör. `tr.default.json`). Seçim zinciri:
`{locale}.default.json` → `{locale}.json` → `{dil}.default.json` → `{dil}.json`.
**İlk bulunan kazanır — merge yoktur.** Canlı istek bölgeli locale taşıyabilir (`tr-TR`) ama
temalar dosyayı `tr.default.json` adıyla gönderir; taban dil adımı bu yüzden vardır.

Metinleri daima `{{t "anahtar" default="Metin"}}` ile yazın: locale dosyası eksik olsa bile
doğru metin görünür.

## `config/hosted-slots.json` ayrıntısı

Checkout ve hesap/giriş sayfaları **platformun** sunduğu yüzeylerdir, temanın rotası değildir.
Bu dosya o yüzeylerdeki adlandırılmış zone'lara temanın hangi blokları basacağını söyler:

```json
{
  "checkout.announcement": [
    { "type": "announcement-bar", "settings": { "text": "Güvenli ödeme" } }
  ],
  "auth.footer": [{ "type": "policy-links", "settings": { "link_1_label": "Gizlilik" } }]
}
```

Tanımlı zone'lar: `checkout.announcement` · `checkout.trust` · `checkout.footer_note` ·
`auth.announcement` · `auth.footer`. Başka zone adı render'a girmez.

Blok paleti **sunucu tarafında sınırlıdır** — yalnız şu tipler basılır:
`announcement-bar` · `rich-text` · `image` · `trust-badges` · `support-contact` ·
`policy-links`. Listede olmayan bir tip sessizce düşer; geçersiz JSON tüm dosyayı boşa
indirger.

## `assets/`

CSS, JS, görsel, font. Şablonda `{{asset_url "theme.css"}}`, `{{stylesheet_tag …}}`,
`{{script_tag …}}` ile kullanılır.

**`theme dev` sırasında `assets/` yerel diskten servis edilir** (görsel/font dahil); ama
`theme init`/`theme pull` binary asset **indirmez**, çünkü sunucu yalnız metin döndürür. Bu
asimetri `theme push` ile birleşince sunucudaki asset'leri silebilir — bkz. `estorepark-cli`
skill'i, `DRAFT_REPLACED`.
