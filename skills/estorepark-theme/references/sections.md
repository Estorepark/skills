# Section ve block şeması

Şema, `.vitrine` dosyasının gövdesine `{{!-- schema … --}}` yorumu içinde gömülüdür. Tamamen
bildirimseldir: editör formu buradan üretir, `theme check` bunu doğrular.

## Section alanları

| Alan | Tip | Not |
| ---- | --- | --- |
| `name` | string | Editörde görünen ad (zorunlu) |
| `tag` | `article\|aside\|div\|footer\|header\|section` | Sarmalayıcı etiket |
| `class` | string | Sarmalayıcıya eklenen sınıf |
| `width` | `contained\|full\|narrow` | Container genişlik modu (yalnız section'da) |
| `limit` | number | Aynı tipten en fazla kaç kez eklenebilir |
| `settings` | AnySettingDef[] | Ayar formu |
| `blocks` | BlockSchema[] | Kabul edilen block tipleri |
| `max_blocks` | number | Block üst sınırı |
| `presets` | PresetDef[] | "Bölüm ekle" listesindeki hazır varyasyonlar |
| `accepts` | string[] | Kabul edilen child node tipleri |
| `role` | `section\|block` | Band mı satır-içi mi (yoksa: kök=section, iç=block) |
| `static` | boolean | Merchant taşıyamaz/silemez, yalnız ayarını düzenler |
| `enabled_on` / `disabled_on` | `{ templates, groups? }` | Hangi şablon/gruplarda kullanılabilir |
| `variants` | VariantDef[] | Klasör-tabanlı layout varyantları (etiket/sıra) |
| `family` | string | Gruplama etiketi |
| `locales` | `Record<dil, Record<anahtar, metin>>` | Section'a gömülü çeviriler |

Block şeması aynı tabanı kullanır, ek olarak `type` (zorunlu) taşır ve `blocks` ile iç içe
geçebilir.

`presets[]`: `{ name, category?, settings?, blocks? }` — merchant bölümü eklediğinde
başlangıç değerleri buradan gelir.

## Varyantlar

Varyantlı element **köşeli parantezli klasördür**:

```
sections/[site-header]/
├── default.vitrine     # şema BURADA gömülüdür, varyantlar paylaşır
└── merkezi.vitrine     # yalnız markup farklı
```

Varyant değişince merchant verisi (settings/blocks) korunur, yalnız markup değişir.
`variants[]` yalnız etiket/sıra içindir; keşif klasörden de yapılır.

## Ayar tipleri (22)

Ortak alanlar: `id` (zorunlu, `^[a-z][a-z0-9_]*$`), `label` (zorunlu), `info`, `role`,
`visible_if`, `enabled_if`.

| Tip | Ek alanlar |
| --- | ---------- |
| `text` | `default`, `placeholder`, `max_length`, `i18n` |
| `textarea` | `default`, `placeholder`, `rows`, `max_length`, `i18n` |
| `richtext` | `default`, `toolbar: full\|basic`, `i18n` |
| `inline_richtext` | `default`, `i18n` |
| `number` | `default`, `min`, `max`, `step`, `unit`, `placeholder` |
| `range` | `default`, `min`, `max` (zorunlu), `step`, `unit` |
| `checkbox` | `default`, `style: toggle\|checkbox` |
| `select` | `options[]` (zorunlu), `default`, `display: dropdown\|segmented`, `option_hints` |
| `radio` | `options[]` (zorunlu), `default` |
| `icon_select` | `options[]` (zorunlu), `default`, `allow_empty` |
| `color` | `default`, `alpha`, `placeholder` |
| `color_scheme` | `default` |
| `color_scheme_group` | `definition[]` — renk şemalarını TANIMLAR, değer taşımaz |
| `font_picker` | `default` (zorunlu) |
| `image` | — |
| `video_url` | `accept: ('youtube'\|'vimeo')[]` (zorunlu) |
| `url` | `default`, `placeholder`, `allow_relative`, `open_target` |
| `text_alignment` | `default: left\|center\|right` |
| `resource` | `resource: product\|collection\|category\|page\|blog\|article\|menu` |
| `resource_list` | `resource`, `limit` (zorunlu) |
| `datetime` | `placeholder`, `with_time` |

Değer taşımayan (form düzenleyen) tipler: `header` (`content`, `info?`) ve `paragraph`
(`content`).

## Koşullu görünürlük

`visible_if` / `enabled_if` **yapısaldır**, ifade string'i değil:

```json
{ "key": "layout_style", "op": "eq", "value": "grid", "scope": "section" }
```

`op`: `eq` · `neq` · `in` · `not_in` · `empty` · `not_empty`.
`scope`: `sibling` (varsayılan) · `section` · `block`.

## Render context'i

Şablonda `section.settings.<id>`, `section.blocks`, `block.settings.<id>` okunur. Şemadaki
`default` **render'a girmez** — değer yoksa `undefined`'dır (bkz. SKILL.md → Tuzaklar).
