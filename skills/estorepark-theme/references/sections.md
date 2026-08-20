# Section and block schemas

The schema is embedded in the body of the `.vitrine` file inside a `{{!-- schema … --}}`
comment. It is fully declarative: the editor generates a form from it and `theme check`
validates it.

## The engine produces the wrapper

A `.vitrine` file writes only the **inner** markup. The engine wraps every section in this
shell:

```html
<section id="esp-section-<id>" class="esp-section <schema.class> section--<width>">…</section>
```

The tag comes from `schema.tag` (`div` when absent), the class from `schema.class`, and
`section--<mode>` from **`settings.width`** (`contained` · `full` · `narrow`; an unrecognised
value is ignored). Editor selection attributes (`data-editor-section`, plus
`data-editor-container` inside a region) are added automatically in design mode — do not write
your own shell.

Blocks are wrapped too: `{{{block this}}}` puts the output inside
`<div class="block block--<type>" data-editor-block=… data-editor-type=…>`. That is why the
`editor_attributes` helper is unnecessary on the standard path; use it only when your own custom
markup needs selection attributes (the reference theme never does).

## Block files

`blocks/<type>.vitrine` — the context is `block` (`{{block.settings.x}}`), the schema header is
`"$schema": "estorepark/block-schema/v0"`, and `editable` takes `scope="block"`:

```handlebars
<p>{{editable block.settings.body field="body" scope="block"}}</p>
```

## Section fields

| Field | Type | Note |
| ----- | ---- | ---- |
| `name` | string | Name shown in the editor (required) |
| `tag` | `article\|aside\|div\|footer\|header\|section` | Wrapper element |
| `class` | string | Class added to the wrapper |
| `width` | `contained\|full\|narrow` | Container width mode (sections only) |
| `limit` | number | How many times this type may be added |
| `settings` | AnySettingDef[] | Settings form |
| `blocks` | BlockSchema[] | Accepted block types |
| `max_blocks` | number | Upper bound on blocks |
| `presets` | PresetDef[] | Ready-made variations in the "add section" list |
| `accepts` | string[] | Accepted child node types |
| `role` | `section\|block` | Band vs inline (absent: root = section, nested = block) |
| `static` | boolean | The merchant cannot move or delete it, only edit its settings |
| `enabled_on` / `disabled_on` | `{ templates, groups? }` | Which templates/groups it may be used in |
| `variants` | VariantDef[] | Folder-based layout variants (label/order) |
| `family` | string | Grouping label |
| `locales` | `Record<lang, Record<key, text>>` | Translations embedded in the section |

A block schema uses the same base and additionally carries `type` (required); it can nest via
`blocks`.

`presets[]`: `{ name, category?, settings?, blocks? }` — the starting values used when a merchant
adds the section.

## Variants

A variant-bearing element is a **bracketed folder**:

```
sections/[site-header]/
├── default.vitrine     # the schema lives HERE and is shared by all variants
└── centered.vitrine    # only the markup differs
```

Switching variants preserves merchant data (settings/blocks) and changes only the markup.
`variants[]` is only for labels and ordering; discovery also works from the folder.

## Setting types

Common fields: `id` (required, `^[a-z][a-z0-9_]*$`), `label` (required), `info`, `role`,
`visible_if`, `enabled_if`.

| Type | Additional fields |
| ---- | ----------------- |
| `text` | `default`, `placeholder`, `max_length`, `i18n` |
| `textarea` | `default`, `placeholder`, `rows`, `max_length`, `i18n` |
| `richtext` | `default`, `toolbar: full\|basic`, `i18n` |
| `inline_richtext` | `default`, `i18n` |
| `number` | `default`, `min`, `max`, `step`, `unit`, `placeholder` |
| `range` | `default`, `min`, `max` (required), `step`, `unit` |
| `checkbox` | `default`, `style: toggle\|checkbox` |
| `select` | `options[]` (required), `default`, `display: dropdown\|segmented`, `option_hints` |
| `radio` | `options[]` (required), `default` |
| `icon_select` | `options[]` (required), `default`, `allow_empty` |
| `color` | `default`, `alpha`, `placeholder` |
| `color_scheme` | `default` |
| `color_scheme_group` | `definition[]` — DEFINES the colour schemes, carries no value |
| `font_picker` | `default` (required) |
| `image` | — |
| `video_url` | `accept: ('youtube'\|'vimeo')[]` (required) |
| `url` | `default`, `placeholder`, `allow_relative`, `open_target` |
| `text_alignment` | `default: left\|center\|right` |
| `resource` | `resource: product\|collection\|category\|page\|blog\|article\|menu` |
| `resource_list` | `resource`, `limit` (required) |
| `datetime` | `placeholder`, `with_time` |

The table above is **all 21 value-carrying types**. There are also 2 types that carry no value
and only structure the form: `header` (`content`, `info?`) and `paragraph` (`content`).

## Conditional visibility

`visible_if` / `enabled_if` are **structural**, not expression strings:

```json
{ "key": "layout_style", "op": "eq", "value": "grid", "scope": "section" }
```

`op`: `eq` · `neq` · `in` · `not_in` · `empty` · `not_empty`.
`scope`: `sibling` (default) · `section` · `block`.

## Render context

Templates read `section.settings.<id>`, `section.blocks`, `block.settings.<id>`. A schema
`default` **never enters the render**; without a value the setting is `undefined` (see SKILL.md
→ Gotchas).
