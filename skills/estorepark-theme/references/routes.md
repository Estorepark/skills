# `config/routes.json`

The theme's URL table. `theme check` verifies that the file exists and contains a route array,
and that a `templates/<name>.json` exists for every `template` it points at.

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

The paths above are the ones shipped by the default theme; they are Turkish because the store
front is. Paths are the merchant's to choose — template names are not.

## Fields

| Field | Values | Note |
| ----- | ------ | ---- |
| `path` | `/…` | The path the merchant chose |
| `match` | `exact` · `prefix` | `prefix` = the root of a resource's detail URLs |
| `kind` | `home` · `resource` · `system` · `page` | Route class |
| `resource` | `product` · `collection` · `category` · `blog` | Metadata/UI only; dispatch happens **from `template`** |
| `template` | `templates/<name>.json` | Detail template |
| `indexTemplate` | `templates/<name>.json` | List template, on `prefix` routes |
| `previousPaths` | string[] | Old paths → source of 301s; filled in when `path` is renamed |
| `enabled` | boolean | `false` means the route is ignored |

The resource mapping is derived primarily from the template name: `product` → product,
`collection` → collection, `category` → category, and **`article` → blog** (the detail template
of the blog resource is `article`, its list is `blog`).

## Reserved paths

The first segment of a route cannot be any of:

`api` · `admin` · `graphql` · `assets` · `_next` · `.well-known` · `checkout` · `cart` · `search`

`/cart` and `/cart/*` are the **platform cart endpoints**; even if the bundle declares the same
path, the static route wins. The cart **page** belongs to the theme and is derived from the
exact route with `template: "cart"` — `/sepet` in the example above.

`/search` and `/search/*` follow the same split: `/search/suggest` (autocomplete JSON) and
`/search/results` (listing fragment HTML) are the platform's, reachable through
`{{routes.search_suggest_url}}` and `{{routes.search_results_url}}`. The search **page** is the
theme's, derived from the exact route with `template: "search"` — `/ara` above, read from
`{{routes.search_url}}`. See [listing.md](listing.md).

## Template names

The file name under `templates/` equals the `template` value in the route table. In the default
theme: `index`, `product`, `product_index`, `collection`, `collection_index`, `category`,
`category_index`, `blog`, `article`, `cart`, `search`, `account`, `account.settings`,
`page.<slug>`.

Names containing dots are single files: `templates/account.settings.json`,
`templates/page.hakkimizda.json`.
