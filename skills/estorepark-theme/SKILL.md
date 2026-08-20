---
name: estorepark-theme
description: Write EstorePark storefront themes — the bundle contract covering `.vitrine` Handlebars templates with embedded section schemas, template/region JSON, `config/routes.json`, the closed helper catalogue, and i18n. EstorePark tema geliştirme; "section ekle", "yeni şablon", "vitrin temasını düzenle", "rota ekle", "tema ayarı ekle" gibi isteklerde kullan. Temayı yüklemek/yayınlamak için estorepark-cli skill'ini kullan.
license: MIT
compatibility: EstorePark V2 (vitrine) render motoru. Doğrulama için `estorepark theme check` gerekir.
metadata:
  author: estorepark
  version: "0.1.0"
---

# EstorePark tema bundle'ı

Tema, versiyonlanmış bir **dosya bundle'ıdır**; kaynağın doğrusu diskteki klasördür. Render
sunucuda, izomorfik bir Handlebars türevi motorla yapılır. Bu skill dosyaları **yazmayı**
anlatır; yükleme/yayınlama için `estorepark-cli`.

## Dizin yapısı

```
tema/
├── config/routes.json          # ZORUNLU — URL tablosu
├── config/settings_schema.json # tema geneli ayar formu
├── config/settings_data.json   # o ayarların değerleri
├── layout/theme.vitrine        # ZORUNLU — sayfa iskeleti
├── templates/<ad>.json         # her rota hedefi için bir dosya
├── sections/<tip>.vitrine      # band düzeyi bileşen (+ gömülü şema)
├── blocks/<tip>.vitrine        # section içi tekrar eden birim
├── regions/<ad>.json           # header/footer gibi sayfa-üstü bölgeler
├── snippets/*.vitrine          # partial
├── locales/<dil>.default.json  # çeviriler
└── assets/                     # css/js/görsel
```

Yapısal doğrulama: `estorepark theme check` — `config/routes.json` yoksa/parse edilmiyorsa,
`layout/theme.vitrine` yoksa ya da bir rota olmayan bir `templates/<ad>.json`'u işaret ediyorsa
hata verir.

## Section anatomisi

Bir section tek dosyadır: markup + **gövdeye gömülü şema**. Dosya yalnız **iç** markup'ı
yazar — dış sarmalayıcıyı (`schema.tag` + `esp-section` + editör attribute'ları) motor üretir.

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
    { "type": "text", "id": "heading", "label": "Başlık", "default": "Yeni sezon" }
  ],
  "blocks": [{ "type": "button" }],
  "max_blocks": 2,
  "presets": [{ "name": "Hero" }]
}
--}}
```

Şema alanlarının tamamı ve 22 ayar tipi: [references/sections.md](references/sections.md).

## Template ve region JSON

`templates/index.json` — hangi section'ın hangi ayarla, hangi sırayla görüneceği:

```json
{
  "layout": "theme",
  "sections": {
    "hero": { "type": "hero", "settings": { "heading": "Zamansız gardırop" },
              "blocks": { "b1": { "type": "button", "settings": { "label": "Keşfet" } } },
              "block_order": ["b1"] },
    "featured": { "type": "featured-collection", "settings": { "heading": "Öne çıkanlar" } }
  },
  "order": ["hero", "featured"]
}
```

`regions/header.json` aynı şekildedir, ek olarak `type` + `name` taşır ve layout'tan
`{{{sections "header"}}}` ile basılır (dosya adı = grup adı). Bilinmeyen grup adı sessizce boş
render edilir — hata vermez, bu yüzden yazım hatası fark edilmez.

## Helper kataloğu (KAPALI)

Motorun tanıdığı helper'lar bunlardır; yenisi tema tarafından eklenemez:

`money` · `image_url` · `asset_url` · `stylesheet_tag` · `script_tag` · `t` / `translate` ·
`link_to` · `editable` · `editor_attributes` · `block` · `sections`

Yerleşikler: `if` · `unless` · `each` · `with` · `lookup`.

Bu listede olmayan bir helper (`capitalize`, `date`, `json` …) render'da **çözülmez**. İhtiyaç
duyulan dönüşümü şablonda değil, veriyi hazırlayan tarafta çözün.

## i18n

Metinler daima `default=` ile yazılır:

```handlebars
{{t "cart.empty" default="Sepetiniz boş"}}
```

Çözüm sırası: locale anahtarı → `default=` → anahtarın kendisi. Locale dosyası eksik olsa bile
müşteri doğru metni görür. **İnterpolasyon yoktur** (`{{t "hi" name=x}}` gibi bir yer tutucu
mekanizması yok) — değişken kısım şablonda ayrı bir eleman olarak basılır.

Dosya seçimi: `locales/{locale}.default.json` → `{locale}.json` → `{dil}.default.json` →
`{dil}.json`. **İlk bulunan kazanır, merge yoktur.**

## Rota tablosu

`config/routes.json` bu temanın URL'lerini tanımlar; platform tarafındaki rezerve yollar
dışında merchant'ındır. Alanlar ve örnekler: [references/routes.md](references/routes.md).

## Tuzaklar

- **Şemadaki `default` render'da UYGULANMAZ.** `default`, editör metadata'sıdır. Render yalnız
  `templates/*.json` ∨ `regions/*.json` içindeki `settings`'i okur. `{"type":"checkbox",
  "id":"show_note","default":true}` tanımlı olsa bile template JSON'unda `"show_note": true`
  yoksa `{{#if section.settings.show_note}}` bloğu **hiç render edilmez**. Yeni section eklerken
  varsayılanları template/region JSON'una da yazın.
- **Ayar `id`'si `^[a-z][a-z0-9_]*$` olmalı.** Tireli id (`hero-title`) Handlebars'ta
  **çıkarma işlemi** olarak ayrışır → sessiz bozulma, hata yok, boş çıktı.
- **`/cart` ve `/cart/*` platform-rezervedir.** Bundle aynı yolu tanımlasa bile platform
  route'u kazanır. Sepet **sayfası** ise temanındır: `templates/cart.json` + `routes.json`'da
  `template: "cart"` exact rotası (varsayılan temada `/sepet`). Sepet formlarını kendi
  uydurduğunuz bir yola değil, platform uçlarına gönderin.
- **Rezerve head'ler:** `api`, `admin`, `graphql`, `assets`, `_next`, `.well-known`,
  `checkout`, `cart`. Bir rotanın ilk segmenti bunlardan biri olamaz.
- **`theme init` / `theme pull` binary asset indirmez** (sunucu yalnız metin döndürür).
  Yerelde eksik görselle `theme push` yaparsanız sunucudaki asset'ler silinir — bkz.
  `estorepark-cli` skill'indeki `DRAFT_REPLACED` uyarısı.
- **Bilinmeyen section tipi çökmez, atlanır.** Template JSON'unda `sections/<tip>.vitrine`
  karşılığı olmayan bir `type` sessizce render edilmez. Boş çıkan bir bölgede önce tip adını
  ve dosya adını karşılaştırın.
- **Render deterministiktir.** Motor helper'ları saf ve deterministiktir; şablon çıktısı
  sunucu ve tarayıcıda birebir aynı olmalıdır. Tema tarafında tarih/locale'e göre değişen
  çıktı üretmeye çalışmayın.

## Yeni section eklemek

1. `assets/section-template.vitrine` dosyasını `sections/<tip>.vitrine` olarak kopyalayın —
   markup + gömülü şema iskeleti hazırdır.
2. Şemadaki `name`, `settings` ve `blocks`'u işe göre düzenleyin (`id` kuralı: `^[a-z][a-z0-9_]*$`).
3. Bölümü bir şablona bağlayın: `assets/template.json` örneğindeki gibi `sections` + `order`
   girdisi ekleyin — **ayar değerlerini burada yazın**, şemadaki `default` render'a girmez.
4. `estorepark theme check`, sonra `estorepark theme dev` ile bakın.

## Doğrulama döngüsü

1. `estorepark theme check` — yapısal hataları yakalar (ağa çıkmaz).
2. `estorepark theme dev` — gerçek veriyle canlı önizleme.
3. Bir bölge boş çıkıyorsa sırayla bak: girdide `"disabled": true` var mı → `order` dizisinde
   id geçiyor mu → section dosya adı `type` ile aynı mı (varyant kullanılıyorsa
   `sections/[<type>]/<variant>.vitrine` var mı) → template JSON'da `settings` yazılı mı
   (şema `default`'u sayılmaz).
