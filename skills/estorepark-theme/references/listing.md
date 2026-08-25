# Listing, search, filtering, sorting

The data contract behind the four listing surfaces — **collection**, **category**, **product
index** and **search** — plus the two platform endpoints a theme talks to from JavaScript.

## The one invariant

**Every URL on this page is server-generated.** A theme never builds a listing querystring.

Three reasons, each sufficient on its own:

- The helper catalogue is closed — there is no arithmetic, no comparison, no string concatenation
  helper. A theme cannot compute "this URL, minus this one group".
- `sort` values are an **allowlist** (below). A value outside it is dropped silently, so a
  hand-written `?sort=recommended` looks like it works and sorts nothing.
- A bare `?brand=x` link **replaces** the whole querystring: the active search term, the other
  filters and the page number all disappear. Server-built URLs carry them.

## Objects on a listing surface

| Object | Type | Note |
| ------ | ---- | ---- |
| `products` | `Card[]` | The page's slice. Filled on **all four** surfaces — read this, not `collection.products` |
| `filters` | `FilterGroup[]` | Facet groups. Already hidden server-side when a group has no values or only one |
| `applied_filters` | `AppliedFilter[]` | One entry per active selection, for the "chips" row |
| `sort_options` | `SortOption[]` | Always the full set; exactly one is `active` |
| `paginate` | `Paginate` | `page` · `pages` · `has_prev` · `has_next` · `prev_url` · `next_url` |
| `search` | `{ results, terms, results_count }` | **Search template only.** `results` is the same array as `products` |
| `collections` / `categories` | `Collection[]` / `Category[]` | **Index templates only** (`collection_index`, `category_index`) — empty on a collection or category detail page |

`FilterGroup`: `key` · `label` · `kind` (`list` · `range` · `toggle`) · `values[]` · `clear_url`,
and for `kind: "range"` a `range` object.

`FilterValue`: `value` · `label` · `count` · `active` · `url` — where `url` **toggles** that value
(adds it when off, removes it when on).

`AppliedFilter`: `group_key` · `group_label` · `value` · `label` · `remove_url`.

`SortOption`: `value` · `label` · `active` · `url`. **`label` is a locale key, not display text** —
render it as `{{t this.label default=this.value}}`.

Sort allowlist and its keys: `relevance` (`sort.relevance`) · `newest` (`sort.newest`) ·
`price-asc` (`sort.price_asc`) · `price-desc` (`sort.price_desc`) · `name-asc` (`sort.name_asc`) ·
`name-desc` (`sort.name_desc`) · `discount` (`sort.discount`).

## The price range form

A range filter is the one place the theme submits rather than links, and a GET form cannot produce
the canonical combined `price=100-500` in a single field. So it sends **two** fields, and the
server reassembles them:

```handlebars
<form method="get" action="{{this.range.form_action}}">
  {{#each this.range.hidden_fields}}
    <input type="hidden" name="{{this.name}}" value="{{this.value}}">
  {{/each}}
  <input type="number" name="{{this.key}}_min">
  <input type="number" name="{{this.key}}_max">
  <button type="submit">Apply</button>
</form>
```

`form_action` and `hidden_fields` are **server-generated and required**. Without `action` the
browser posts to the current path and wipes the querystring; without the hidden fields every other
active selection is lost on submit — and the theme cannot rebuild them itself (closed helpers).

Range bounds are **minor units** (`min_amount: 1000` = 10.00), the same axis as `Money`. The URL
carries major units; the conversion happens on the server.

## Search: the theme's page, the platform's endpoints

| Route | Owner | Where it comes from |
| ----- | ----- | ------------------- |
| Search **page** | theme | The `template: "search"` exact route in `config/routes.json` → `routes.search_url` |
| `/search/suggest` | platform | `routes.search_suggest_url` |
| `/search/results` | platform | `routes.search_results_url` |

Same split as the cart: the cart *page* is the theme's, the cart *endpoints* are the platform's.
`search` is a **reserved head** — a bundle route starting with `/search` never wins.

Never hardcode any of the three. The merchant can rename the search page (`/ara`, `/arama`, …) and
the theme has to follow.

### `/search/suggest` — autocomplete (JSON)

`GET {{routes.search_suggest_url}}?q=<term>` →

```json
{ "query": "tea",
  "products": [{ "id": "…", "title": "…", "url": "/urunler/…",
                 "image": { "url": "…" }, "price": { "amount": 14990, "currency": "TRY" },
                 "on_sale": true, "discount_percent": 20 }],
  "categories": [{ "id": "…", "title": "…", "url": "/kategoriler/…" }],
  "collections": [{ "id": "…", "title": "…", "url": "/koleksiyonlar/…" }],
  "results_url": "/ara?q=tea" }
```

- Under **2 characters** the endpoint returns empty arrays — do not fire the request at all.
- Rate limit: 60 requests/minute per session. Debounce and abort in-flight requests, or the box
  spends its budget on keystrokes.
- `results_url` is the "see all results" link, ready-made. Do not build `?q=` yourself.
- The response carries **no** session or customer field, which is why it is cacheable. Rendering it
  into `innerHTML` by string concatenation is a stored-XSS hole: product titles are merchant input.
  Build the panel with `createElement` + `textContent`.

### `/search/results` — listing fragment (HTML)

`GET {{routes.search_results_url}}?<the target URL's querystring>&path=<page path>&sections=<addresses>`

- `path` is the page's **own** path — the fragment is rendered with that page's template.
- `sections` is comma-separated and accepts a section **type token** (`listing-grid`) or a full
  address; **at most 3** are rendered, extras are ignored.
- The response is `{ "sections": { "<address>": "<html>" } }` and each `html` **includes the section
  wrapper**: `<section id="esp-section-<template key>" class="esp-section …">`. Replace the node
  with that id — writing it into `innerHTML` nests a section per refresh and duplicates ids.
- Empty `sections` (unknown address, error, or a cache-sensitive template such as `cart`/`account`,
  which is refused) means **reload the page**. Same contract as the cart fragment.
- Bind the click handler **once, on the document**, by delegation. The section node is replaced on
  every refresh, so a listener bound to the node either disappears with it or accumulates.

## Gotchas

- **Listing surfaces carry `Card`, not `Product`.** `collection.products` and `products` are
  `Card[]`: `title` · `url` · `image` · `price` · `compare_at_price` · `available` ·
  `default_variant_id` · `price_varies` and the discount fields. No `variants`, no `options`, no
  `description` — those exist on the product **detail** page.
- **Read `products`, not `collection.products`.** Category data is written to `category.products`;
  a grid that reads `collection.products` first renders **empty** on the category page. All four
  surfaces fill `products`.
- **`collections` / `categories` are empty on a detail listing page.** A sidebar built only from
  them reserves a column and renders nothing on collection, category and product-index pages.
- **A template section key that also exists in a region produces a duplicate DOM id.** The engine
  emits `id="esp-section-<key>"` for both, and fragment replacement finds the wrong node. Do not
  name a template section `header` when `regions/header.json` has a section called `header`.
- **`sort_options[].label` is a locale key.** Printing `{{this.label}}` puts `sort.price_asc` on
  the page.
- **An enum you must branch on always has a boolean companion.** There is no equality helper, so
  `{{#if this.scope}}` is true for *every* scope. Use `is_shipping` / `is_catalog` /
  `is_campaign_sale`; the enum itself is for a CSS class or `data-*` hook. Printing a cart-level
  campaign's percentage as if it were a catalogue discount is the mistake this prevents — a cart
  discount does not change the shelf price.
- **Dates arrive as RFC 3339 in the store's offset** and are printed with `{{date …}}`. Printing
  the raw field puts `2026-08-13T09:00:00+03:00` on the page.
- **Pagination is not automatic.** The server fills `paginate`, but if the theme prints no links,
  everything past the first page (24 products) is unreachable — including for crawlers.
