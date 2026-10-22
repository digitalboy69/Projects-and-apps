#!/usr/bin/env python3
"""Builds the 6 pages Razorpay checks (about, contact, pricing, terms, privacy, refund) as plain static HTML.
Edit pay-hub/site/business.json, then run:  python3 pay-hub/tools/build_legal.py
Static on purpose: the Razorpay website checker may not run JavaScript."""
import json, html, pathlib, datetime, sys

root = pathlib.Path(__file__).resolve().parent.parent / "site"
B = json.loads((root / "business.json").read_text(encoding="utf-8"))
e = lambda s: html.escape(str(s))
today = datetime.date.today().strftime("%d %B %Y")
name, brand = e(B["owner_name"]), e(B["brand"])
mail, phone, addr = e(B["email"]), e(B["phone"]), e(B["address"])
what, days = e(B["what_you_sell"]), int(B["refund_days"])
deliv, hours = e(B["delivery"]), e(B["support_hours"])
site = e(B["site_url"])

NAV = [("index.html", "Home"), ("about.html", "About us"), ("pricing.html", "Pricing"), ("contact.html", "Contact us"),
       ("terms.html", "Terms and conditions"), ("privacy.html", "Privacy policy"), ("refund.html", "Cancellation and refund policy")]

CSS = """:root{--bg:#12100d;--card:#1b1814;--line:#3a332a;--fg:#f1ebdf;--muted:#aaa190;--gold:#d4a24a;--gold2:#f0c46a;color-scheme:dark}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(800px 400px at 50% -100px,rgba(212,162,74,.16),transparent 70%),var(--bg);color:var(--fg);font:16px/1.65 system-ui,-apple-system,'Segoe UI',sans-serif;padding:0 16px 40px}
.w{max-width:760px;margin:0 auto}header{padding:22px 0 8px;display:flex;gap:10px;align-items:center;color:var(--muted)}header b{color:var(--gold2)}
.dot{width:24px;height:24px;border-radius:50%;background:radial-gradient(circle at 35% 30%,var(--gold2),var(--gold))}
nav{display:flex;flex-wrap:wrap;gap:6px 14px;padding:8px 0 18px;border-bottom:1px solid var(--line);font-size:14.5px}
a{color:var(--gold2)}h1{font:600 30px/1.2 Georgia,serif;margin:26px 0 6px}h2{font:600 20px Georgia,serif;margin:28px 0 6px;color:var(--gold2)}
p,li{color:#e4dccb}.muted{color:var(--muted);font-size:14px}table{width:100%;border-collapse:collapse;margin:14px 0}th,td{border:1px solid var(--line);padding:10px;text-align:left;vertical-align:top}th{color:var(--gold2);background:var(--card)}
footer{margin-top:40px;border-top:1px solid var(--line);padding-top:16px;font-size:14px;color:var(--muted)}footer a{margin-right:12px;white-space:nowrap}"""

def page(file, title, body):
    nav = "".join(f'<a href="{f}">{t}</a>' for f, t in NAV)
    foot = "".join(f'<a href="{f}">{t}</a>' for f, t in NAV[1:])
    out = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} | {brand}</title><meta name="description" content="{title} for {brand}.">
<style>{CSS}</style></head><body><div class="w">
<header><span class="dot"></span><b>{brand}</b></header><nav>{nav}</nav>
<main><h1>{title}</h1><p class="muted">Last updated: {today}</p>{body}</main>
<footer><p>{foot}</p><p>&copy; {datetime.date.today().year} {name}. All prices are in Indian Rupees (INR). Payments are processed securely by Razorpay.</p></footer>
</div></body></html>
"""
    (root / file).write_text(out, encoding="utf-8")

offers = "".join(
    f"<tr><td>{e(o['name'])}</td><td>{e(o['what'])}</td><td>{e(o['price'])}</td></tr>" for o in B["offerings"])

page("about.html", "About us", f"""
<p>{brand} is run by {name} from India. We offer: {what}.</p>
<h2>What we do</h2><p>{what}</p>
<h2>How to reach us</h2><p>Email <a href="mailto:{mail}">{mail}</a> or see our <a href="contact.html">contact page</a>.</p>
<h2>Please note</h2><p>Astrology and related readings are provided for guidance and personal reflection. They are not medical, legal or financial advice.</p>""")

page("contact.html", "Contact us", f"""
<p>We are happy to help with questions, payments or refunds.</p>
<table><tr><th>Business name</th><td>{brand} ({name})</td></tr>
<tr><th>Email</th><td><a href="mailto:{mail}">{mail}</a></td></tr>
<tr><th>Phone</th><td>{phone}</td></tr>
<tr><th>Address</th><td>{addr}</td></tr>
<tr><th>Support hours</th><td>{hours}</td></tr></table>
<p>We usually reply within 2 working days.</p>""")

page("pricing.html", "Pricing details", f"""
<p>All prices are in Indian Rupees (INR) and are shown before you pay. You pay the amount shown on the payment page. There are no hidden charges.</p>
<table><tr><th>Item</th><th>What you get</th><th>Price</th></tr>{offers}</table>
<h2>Delivery</h2><p>{deliv}</p>
<h2>Payment methods</h2><p>UPI, debit and credit cards, and net banking, through Razorpay.</p>""")

page("terms.html", "Terms and conditions", f"""
<p>These terms apply when you use this website or pay for anything from {brand}. By paying or using the site you agree to them.</p>
<h2>1. What we offer</h2><p>{what}. The details of each item are shown on its payment page or on our <a href="pricing.html">pricing page</a>.</p>
<h2>2. Payments</h2><p>Payments are made in INR through Razorpay. We never see or store your card, UPI PIN or bank details. A purchase is complete only when you see the "Payment received" message and receive a Payment ID.</p>
<h2>3. Your responsibilities</h2><p>Give correct name and email so we can reach you. Do not misuse the site, try to break it, or use it for anything illegal.</p>
<h2>4. Refunds and cancellations</h2><p>See our <a href="refund.html">Cancellation and refund policy</a>.</p>
<h2>5. Guidance only</h2><p>Astrology content is for guidance and reflection. It is not medical, legal or financial advice, and results are not guaranteed.</p>
<h2>6. Ownership</h2><p>The content, design and software on this site belong to {name}. You may not copy or resell them without written permission.</p>
<h2>7. Limits of responsibility</h2><p>We work hard to keep the site running, but we cannot promise it will always be available or error free. To the extent the law allows, our responsibility is limited to the amount you paid for the item in question.</p>
<h2>8. Changes</h2><p>We may update these terms. The date at the top shows the latest version.</p>
<h2>9. Law</h2><p>These terms follow the laws of India. Disputes are subject to the courts at {addr}.</p>
<h2>10. Contact</h2><p><a href="mailto:{mail}">{mail}</a>, {phone}.</p>""")

page("privacy.html", "Privacy policy", f"""
<p>{brand} ({name}) respects your privacy. This page explains what we collect and why.</p>
<h2>What we collect</h2><ul><li>Your name and email address (and phone number or a note, only if the payment page asks for them).</li><li>Payment details such as amount, date, order ID and payment ID. Card, UPI and bank details are handled only by Razorpay. We never see them.</li></ul>
<h2>Why we collect it</h2><p>To process your payment, send your receipt, deliver what you bought, give support, and follow the law (for example, keeping accounting records).</p>
<h2>Who we share it with</h2><p>Only service providers needed to run the site: Razorpay (payments), Supabase (database) and Cloudflare (website hosting). We do not sell your data.</p>
<h2>How long we keep it</h2><p>As long as needed for the purposes above and for legal and accounting rules.</p>
<h2>Your choices</h2><p>You can ask us to show, correct or delete your data by emailing <a href="mailto:{mail}">{mail}</a>. We will answer within a reasonable time, except where the law requires us to keep records.</p>
<h2>Cookies</h2><p>We do not use advertising or tracking cookies. Razorpay's payment window may use its own cookies to keep payments secure.</p>
<h2>Children</h2><p>This site is not meant for children under 18 without a parent or guardian.</p>
<h2>Contact</h2><p><a href="mailto:{mail}">{mail}</a>, {phone}, {addr}.</p>""")

page("refund.html", "Cancellation and refund policy", f"""
<h2>Cancellation</h2><p>You can cancel before the item is delivered or started by writing to <a href="mailto:{mail}">{mail}</a> with your Payment ID.</p>
<h2>Refunds</h2><p>If you are not satisfied, write to us within <b>{days} days</b> of payment with your Payment ID and the reason. If your request is approved, we refund the full or a fair part of the amount to your original payment method.</p>
<h2>How long it takes</h2><p>Approved refunds are started within 3 working days. Your bank or UPI app usually shows the money within 5 to 7 working days after that.</p>
<h2>Not refundable</h2><p>Items that have already been delivered or used in full, and requests made after {days} days.</p>
<h2>Failed or double payments</h2><p>If money was deducted but you did not get a "Payment received" message, it is normally returned automatically by your bank within 5 to 7 working days. If not, email us your Payment ID and we will check it.</p>
<h2>Contact</h2><p><a href="mailto:{mail}">{mail}</a>, {phone}.</p>""")

page("index.html", f"{brand}", f"""
<p>Welcome. {brand} is run by {name} in India. We offer: {what}.</p>
<h2>What you can buy</h2><table><tr><th>Item</th><th>What you get</th><th>Price</th></tr>{offers}</table>
<p>To buy, use the payment link you were given. Payments are secure and handled by Razorpay (UPI, cards, net banking).</p>
<p>Questions? See <a href="contact.html">Contact us</a>, <a href="refund.html">Cancellation and refund policy</a> or <a href="terms.html">Terms and conditions</a>.</p>
<p class="muted"><a href="admin/">Owner sign in</a></p>""")

print("built 7 pages in", root, "for", site)
missing = [k for k in ("email", "phone", "address", "what_you_sell") if "[" in str(B[k])]
if missing: print("STILL PLACEHOLDERS:", ", ".join(missing)); sys.exit(1)
