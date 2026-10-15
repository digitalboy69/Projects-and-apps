# The Door (login → pay → app) — how the paid system works

```
Customer ──▶ site/index.html (login · pay · brand)  ──▶ Supabase Edge Functions ──▶ private storage: app/current.html
You      ──▶ admin/admin.html (a file on YOUR computer, not hosted)
```

## Pieces
| Piece | Where | Notes |
|---|---|---|
| Door site | `door-site/site/` (deploy to Cloudflare Pages — free tier allows commercial use; Vercel Hobby does NOT) | index.html, legal.html (fill the [PLACEHOLDERS]), _headers |
| Admin | `door-site/admin/admin.html` | Open locally. Sign in with the admin account. Customers · Payments · Settings · App update |
| Functions | `door-site/functions/*.ts` (deployed on Supabase) | `create-order`, `verify-payment`, `rzp-webhook`, `get-app` (all verify_jwt=false; each checks auth itself) |
| Customer app | built by `python3 tools/build_customer.py` → `dist/customer-edition.html` | derived from the ORIGINAL sources, which stay unchanged. Upload it in Admin → App update |

## Rules the server enforces (never trust the browser)
- Price comes from `app_settings`, not from the page. `activate_payment()` is idempotent and only callable by the service role.
- A payment activates only after Razorpay's HMAC signature is verified (`verify-payment`) or the signed webhook arrives (`rzp-webhook`).
- Blocked users stay blocked even if they pay. Lifetime users keep lifetime.
- `get-app` returns the app only for `status='active'` and not expired. The file lives in the PRIVATE bucket `app` (admin-only write).
- Per-customer brand (`brand_profiles`) and feature flags (`member_access.features`) are injected as `window.__VAX_BRAND/__VAX_FEATURES`.

## Customer edition (tools/build_customer.py)
Removes the Developer menu/card/strip and every "Copy …" control, blocks clipboard writes except a single share link, disables text selection outside inputs/notes, adds brand badge + accent colour + brand header on the text report. Export/Download is kept.
Honest limit: this is a deterrent, not DRM (screenshots, DevTools and re-typing still work).
Tests: `python3 tests/customer_smoke.py`.

## Secrets (set in Supabase → Edge Functions → Secrets, never in code)
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
Razorpay → Settings → Webhooks: URL `https://pbnfpbugxcndmrgpuved.supabase.co/functions/v1/rzp-webhook`, same secret, events `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`.

## Go-live checklist
1. Test mode keys → secrets → pay with Razorpay test UPI `success@razorpay`.
2. Cloudflare Pages (Direct Upload of `site/`), then Supabase → Auth → URL Configuration: Site URL = that address.
3. Admin → App update → upload `customer-edition.html`.
4. Fill legal.html placeholders; Razorpay KYC → switch keys to Live.
5. Make the old source repo PRIVATE.
