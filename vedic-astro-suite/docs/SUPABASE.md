# Supabase setup (cloud login + profile sync)

Project: `pbnfpbugxcndmrgpuved` (name: Vedic Astro Suite, region ap-south-1 / Mumbai).
URL: https://pbnfpbugxcndmrgpuved.supabase.co  (publishable key is inside `parts/srcB_*` cloud block; it is safe to be public).

## Tables (all in `public`, RLS ON)
- `chart_profiles`: one saved chart per row, owner-only (select/insert/update/delete where `auth.uid() = user_id`).
- `member_access`: `status` trial | active | blocked. Users can only READ their own row. Only you (admin/service role) can change it.
- `private.app_admins`: list of admin user ids (not exposed to the API).
A trigger adds a `member_access` row (status `trial`) for every new sign-up.

## One-time dashboard settings (cannot be done from code)
Authentication > Sign In / Providers > Email: turn OFF "Confirm email" (simplest; otherwise built-in email limits apply).
Authentication > URL Configuration: set Site URL to your live app URL, add it to Redirect URLs (used by password-reset emails).

## Give someone access manually (until the admin page exists)
SQL editor: `update public.member_access set status='active', plan='monthly', expires_at=now()+interval '30 days' where email='their@email.com';`

## Admin panel
Sign in with an admin account > Menu > account card > "Admin". Lists members, lets you add +30/+90/+365 days, lifetime, trial or block. All checks run on the server (functions `admin_list_members`, `admin_set_access`, `is_admin`).
Make another admin (SQL editor): `insert into private.app_admins(user_id) select id from auth.users where email='them@example.com';`
