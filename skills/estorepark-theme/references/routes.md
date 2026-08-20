# `config/routes.json`

Temanın URL tablosu. `theme check` bu dosyanın varlığını ve bir rota dizisi içerdiğini
doğrular; işaret ettiği her `template` için `templates/<ad>.json` bulunmalıdır.

```json
{
  "routes": [
    { "path": "/", "match": "exact", "kind": "home", "template": "index" },
    { "path": "/urunler", "match": "prefix", "kind": "resource", "resource": "product",
      "template": "product", "indexTemplate": "product_index" },
    { "path": "/koleksiyonlar", "match": "prefix", "kind": "resource", "resource": "collection",
      "template": "collection", "indexTemplate": "collection_index" },
    { "path": "/kategoriler", "match": "prefix", "kind": "resource", "resource": "category",
      "template": "category", "indexTemplate": "category_index" },
    { "path": "/blog", "match": "prefix", "kind": "resource", "resource": "blog",
      "template": "article", "indexTemplate": "blog" },
    { "path": "/sepet", "match": "exact", "kind": "system", "template": "cart" },
    { "path": "/ara", "match": "exact", "kind": "system", "template": "search" },
    { "path": "/hesap", "match": "exact", "kind": "system", "template": "account" },
    { "path": "/hesap/ayarlar", "match": "exact", "kind": "system", "template": "account.settings" },
    { "path": "/hakkimizda", "match": "exact", "kind": "page", "template": "page.hakkimizda" }
  ]
}
```

## Alanlar

| Alan | Değerler | Not |
| ---- | -------- | --- |
| `path` | `/…` | Merchant'ın seçtiği yol; Türkçe olabilir |
| `match` | `exact` · `prefix` | `prefix` = kaynak detay URL'lerinin kökü |
| `kind` | `home` · `resource` · `system` · `page` | Rota sınıfı |
| `resource` | `product` · `collection` · `category` · `blog` | Yalnız metadata/UI; dispatch **`template`'ten** yapılır |
| `template` | `templates/<ad>.json` | Detay şablonu |
| `indexTemplate` | `templates/<ad>.json` | `prefix` rotalarında liste şablonu |
| `previousPaths` | string[] | Eski yollar → 301 kaynağı; `path` yeniden adlandırılınca doldurulur |
| `enabled` | boolean | `false` ise rota yok sayılır |

Kaynak eşlemesi birincil olarak `template` adından türetilir: `product` → ürün,
`collection` → koleksiyon, `category` → kategori, **`article` → blog** (blog kaynağının
DETAYI `article`, listesi `blog`).

## Rezerve yollar

Bir rotanın ilk segmenti şunlar olamaz:

`api` · `admin` · `graphql` · `assets` · `_next` · `.well-known` · `checkout` · `cart`

`/cart` ve `/cart/*` **platform sepet uçlarıdır**; bundle aynı yolu tanımlasa bile statik
route kazanır. Sepet **sayfası** temanındır ve `template: "cart"` exact rotasından türetilir —
yukarıdaki örnekte `/sepet`. Yol adını değiştirmek serbesttir, `template` adı değildir.

## Şablon adları

`templates/` altındaki dosya adı = rota tablosundaki `template` değeri. Varsayılan temada:
`index`, `product`, `product_index`, `collection`, `collection_index`, `category`,
`category_index`, `blog`, `article`, `cart`, `search`, `account`, `account.settings`,
`page.<slug>`.

Nokta içeren adlar tek dosyadır: `templates/account.settings.json`, `templates/page.hakkimizda.json`.
