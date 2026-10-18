# Pay Hub

Your own payment pages on Razorpay. You make a page (title, price, description), copy its link or button, and share it anywhere. Payments show up in your admin panel.

```
Visitor ─▶ site/pay.html ─▶ Supabase edge functions ─▶ Razorpay
Owner   ─▶ site/admin/   ─▶ Supabase (login + database rules)
```

## What is here
| Path | What it does |
|---|---|
| `sql/001_init.sql` | Tables `ph_admins`, `ph_pages`, `ph_orders` and the safety rules. Everything is prefixed `ph_`, so it never touches the Door app tables. |
| `functions/ph-order.ts` | Creates the Razorpay order. The price comes from the database. |
| `functions/ph-verify.ts` | Checks Razorpay's signature, then marks the order paid. |
| `functions/ph-webhook.ts` | Backup: Razorpay tells us about payments even if the customer closes the tab. |
| `site/pay.html` | The public payment page. |
| `site/admin/index.html` | Your control panel: create pages, copy links and button code, see payments. |
| `site/config.js` | Public settings (project URL, public key, your name). |

## Go-live steps (test mode first)
1. **Database:** run `sql/001_init.sql` once (Supabase → SQL editor).
2. **Functions:** deploy `ph-order`, `ph-verify` (verify JWT off) and `ph-webhook` (verify JWT off). Each one also needs `_common.ts` next to it.
3. **Secrets** (Supabase → Edge Functions → Secrets): `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (the same ones the Door app uses), and a new `PH_WEBHOOK_SECRET`.
4. **Webhook** (Razorpay → Settings → Webhooks): URL `https://pbnfpbugxcndmrgpuved.supabase.co/functions/v1/ph-webhook`, the same secret as `PH_WEBHOOK_SECRET`, events `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`.
5. **Site:** upload the `site/` folder to Cloudflare Pages (free plan allows commercial use). Use Cloudflare Pages or Netlify if you want short links like `/p/name`.
6. **First sign-in:** open `/admin/`, create an account, then press "Make me the owner". Do this straight away: the first person to claim becomes the owner.
7. **Test:** make a page for ₹1 and pay it with a Razorpay test UPI or card. Switch to live keys after Razorpay KYC.

## Safety notes
- Browsers cannot read the tables directly. Visitors only see a page's public fields. Only the owner can read payments.
- Money changes only through the server, after Razorpay's signature is verified.
- Turn off "Allow new users to sign up" in Supabase → Authentication once you are the owner, so nobody else can create accounts.
