# Customer pages and platform blocks

Login, registration, password and account pages are written **by the theme**, but their addresses,
forms and customer data belong **to the platform**. The theme designs the page around a required
**platform block** (`@platform/*`) that the platform fills in.

## Pages

The addresses are fixed. A theme cannot open a route for them: any `config/routes.json` row whose
path starts with `/account`, or whose `template` / `indexTemplate` is a `customer`, `policy` or
`account` template, is ignored.

| Template file | Address | Required block | Optional blocks |
| ------------- | ------- | -------------- | --------------- |
| `templates/customer.login.json` | `/account/login` | `@platform/login-form` | — |
| `templates/customer.register.json` | `/account/register` | `@platform/register-form` | — |
| `templates/customer.forgot_password.json` | `/account/forgot-password` | `@platform/forgot-password-form` | — |
| `templates/customer.reset_password.json` | `/account/reset-password` | `@platform/reset-password-form` | — |
| `templates/customer.verify_email.json` | `/account/verify-email` | `@platform/verify-email` | — |
| `templates/customer.social_complete.json` | `/account/auth/complete` | `@platform/social-complete-form` | — |
| `templates/customer.json` | `/account` | `@platform/account-summary` | `order-list`, `address-book` |
| `templates/customer.orders.json` | `/account/orders` | `@platform/order-list` | — |
| `templates/customer.order.json` | `/account/orders/<number>` | `@platform/order-detail` | `order-shipments`, `order-addresses`, `order-cancel`, `order-review` |
| `templates/customer.addresses.json` | `/account/addresses` | `@platform/address-book` | `address-form` |
| `templates/customer.address.json` | `/account/addresses/new`, `/account/addresses/<id>` | `@platform/address-form` | — |
| `templates/customer.settings.json` | `/account/settings` | `@platform/profile-form` | `address-book`, `address-form` |
| `templates/customer.change_password.json` | `/account/change-password` | `@platform/change-password-form` | — |
| `templates/policy.json` | `/policies/<slug>` | `@platform/policy-body` | — |

Link to them with `{{routes.account_url}}` (`/account`), `{{routes.account_login_url}}`,
`{{routes.account_register_url}}`, `{{routes.account_orders_url}}`, `{{routes.account_addresses_url}}`,
`{{routes.account_settings_url}}`, `{{routes.account_forgot_password_url}}` and
`{{routes.account_logout_url}}`. The old `/hesap…` addresses redirect (301) to the new ones, and
`templates/account*.json` is never used.

## Writing a customer template

```json
{
  "layout": "theme",
  "sections": {
    "main": {
      "type": "customer-main",
      "settings": { "heading": "Giriş yap" },
      "blocks": { "form": { "type": "@platform/login-form", "settings": { "submit_label": "Giriş" } } },
      "block_order": ["form"]
    }
  },
  "order": ["main"]
}
```

The section that holds the platform block must **accept** it in its schema and **render its
blocks**:

```handlebars
<section class="customer-main">
  {{#if section.settings.heading}}<h1>{{section.settings.heading}}</h1>{{/if}}
  {{#each section.blocks}}{{{block this}}}{{/each}}
</section>
{{!-- schema
{
  "name": "Müşteri sayfası",
  "settings": [{ "id": "heading", "type": "text", "label": "Başlık" }],
  "blocks": [{ "type": "@platform/login-form" }, { "type": "@platform/account-summary" }]
}
--}}
```

## Rules

- **Fallback.** If the template is missing, or the required block is missing, disabled, or not
  actually rendered (because its section does not loop over `section.blocks`), or the theme render
  fails, the store shows the **platform's fallback page** instead. The page always works, but it
  will not look like your theme.
- **The block's HTML is the platform's.** Never ship `blocks/@platform/*` files: the platform never
  uses them, and `estorepark theme check` reports them as an **error**. You can only change the
  block's **settings** (headings, labels), from the template JSON or in the editor.
- **One of each.** Each platform block renders at most once per page; the first one wins.
- **Customer data only inside platform blocks.** In your own sections and blocks, `account` and
  `form` are empty and `customer` is `null`. Do not try to print the customer's name or e-mail
  from a theme section. Your snippets do not run inside a platform block.
- **No theme JavaScript.** On customer pages `script_tag` outputs nothing. Your stylesheet
  (`stylesheet_tag`) still loads. The pages use a strict content security policy and have no
  browser tracking. They must work without JavaScript.
- **The policy page is a full storefront page.** Theme scripts and tracking run there. Without
  `templates/policy.json`, the policy text renders inside your layout.

## Platform blocks and their settings

| Block | Settings |
| ----- | -------- |
| `@platform/login-form` | `heading`, `submit_label`, `show_social`, `show_register_link` |
| `@platform/register-form` | `heading`, `submit_label`, `show_social` |
| `@platform/forgot-password-form` | `heading`, `description`, `submit_label` |
| `@platform/reset-password-form` | `heading`, `submit_label` |
| `@platform/verify-email` | `heading`, `submit_label` |
| `@platform/social-complete-form` | `heading`, `submit_label` |
| `@platform/change-password-form` | `heading`, `submit_label` |
| `@platform/account-summary` | `greeting`, `heading`, `orders_label`, `spend_label`, `logout_label` |
| `@platform/order-list` | `heading`, `empty_text`, `all_label` |
| `@platform/order-detail` | `heading` |
| `@platform/order-shipments` | `heading`, `empty_text` |
| `@platform/order-addresses` | `heading`, `shipping_label`, `billing_label` |
| `@platform/order-cancel` | `heading`, `reason_label`, `reason_placeholder`, `note`, `submit_label` |
| `@platform/order-review` | `heading`, `rating_label`, `title_placeholder`, `body_placeholder`, `submit_label`, `done_text` |
| `@platform/address-book` | `heading`, `default_label`, `empty_text`, `show_actions`, `edit_label`, `save_label`, `delete_label` |
| `@platform/address-form` | `heading`, `edit_heading`, `name_label`, `address1_label`, `address2_label`, `city_label`, `region_label`, `postal_label`, `country_label`, `country_default`, `country_code`, `phone_label`, `default_label`, `submit_label` |
| `@platform/profile-form` | `heading`, `first_name_label`, `last_name_label`, `phone_label`, `submit_label` |
| `@platform/policy-body` | — |

## Styling: stable CSS classes

Style the platform blocks only through these classes. They are **add-only**: the platform never
removes or renames them, but it may add new ones.

- Wrapper: `block block--platform block--platform-<name>` (e.g. `block--platform-login-form`).
- Messages: `customer-notice`, `customer-notice--flash`, `customer-notice--error`.
- Forms: `auth-form`, `auth-title`, `auth-subtext`, `auth-label`, `auth-input`, `auth-optional`,
  `auth-button`, `auth-links`, `auth-social`, `auth-divider`, `auth-consent`, `auth-consent-note`.
- Block roots: `customer-login`, `customer-register`, `customer-forgot-password`,
  `customer-reset-password`, `customer-verify`, `customer-social-complete`,
  `customer-change-password`, `account-summary`, `order-list`, `order-detail`, `order-shipping`,
  `order-shipment`, `order-timeline`, `order-addresses`, `order-cancel`, `order-review`,
  `address-book`, `address-form`, `profile-form`, `policy`, `line-customizations`, and their BEM
  children (`order-detail__title`, `address-form__input` …).

## Checking and previewing

- `estorepark theme check` warns about `/account*` and `/hesap*` rows in the route table, about
  rows that point at a platform template, about unused `templates/account*.json`, about a missing,
  hidden or duplicated required block, and about a section schema that does not accept the
  platform block. A `blocks/@platform/` file is an error.
- `estorepark theme dev` shows the account address (`/account`). Pages render with a sample
  customer, and forms are not submitted in the preview.
- In the admin editor, a page your theme has not designed yet has a **"Bu sayfayı düzenle"**
  action. It copies the platform's starter template and section into the draft.
