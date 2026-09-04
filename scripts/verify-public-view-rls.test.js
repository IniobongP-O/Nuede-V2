import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Executes the actual migration in embedded PostgreSQL, against a focused
// pre-migration privilege fixture. This is not hosted Supabase/pgTAP proof.
test("public views execute as caller without exposing metadata, drafts or writes", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    create schema private;
    revoke all on schema private from public;
    grant usage on schema private to authenticated;
    create function private.is_active_admin() returns boolean language sql stable
      security definer set search_path='' as $$
        select current_setting('nuede_test.active_admin', true) = 'true';
      $$;
    revoke all on function private.is_active_admin() from public, anon;
    grant execute on function private.is_active_admin() to authenticated;
    create table public.checkout_settings (
      id boolean primary key default true check(id),
      paystack_enabled boolean not null, whatsapp_enabled boolean not null,
      updated_at timestamptz default now(), updated_by uuid,
      check (paystack_enabled or whatsapp_enabled)
    );
    create table public.testimonials (
      id uuid primary key, customer_name text, message text, rating smallint,
      is_published boolean not null default false, published_at timestamptz,
      source_feedback_id uuid, created_at timestamptz default now(), updated_at timestamptz default now()
    );
    alter table public.checkout_settings enable row level security;
    alter table public.testimonials enable row level security;
    grant select on public.checkout_settings, public.testimonials to authenticated;
    grant update (paystack_enabled, whatsapp_enabled) on public.checkout_settings to authenticated;
    grant update on public.testimonials to authenticated;
    create policy settings_admin_read on public.checkout_settings for select to authenticated using ((select private.is_active_admin()));
    create policy settings_admin_update on public.checkout_settings for update to authenticated using ((select private.is_active_admin())) with check ((select private.is_active_admin()));
    create policy stories_admin_read on public.testimonials for select to authenticated using ((select private.is_active_admin()));
    create policy stories_admin_update on public.testimonials for update to authenticated using ((select private.is_active_admin())) with check ((select private.is_active_admin()));
    insert into public.checkout_settings values (true,true,true,now(),'18000000-0000-4000-8000-000000000099');
    insert into public.testimonials(id,customer_name,message,rating,is_published,source_feedback_id)
      values ('18000000-0000-4000-8000-000000000001','Public name','Reviewed story',5,true,'18000000-0000-4000-8000-000000000098'),
             ('18000000-0000-4000-8000-000000000002','Private draft','Unpublished text',4,false,null);
    create view public.checkout_payment_options with (security_barrier=true) as
      select paystack_enabled,whatsapp_enabled from public.checkout_settings where id;
    create view public.published_testimonials with (security_barrier=true) as
      select id,customer_name,message,rating from public.testimonials where is_published=true;
    grant select on public.checkout_payment_options,public.published_testimonials to anon,authenticated,service_role;
  `);
  const migration = await readFile(new URL("../supabase/migrations/20260904000400_use_invoker_public_views.sql", import.meta.url), "utf8");
  await db.exec(migration);

  await t.test("both views use invoker security and retain their barriers", async () => {
    const { rows } = await db.query("select reloptions from pg_class where oid in ('public.checkout_payment_options'::regclass,'public.published_testimonials'::regclass)");
    assert.equal(rows.length, 2);
    for (const row of rows) { assert.ok(row.reloptions.includes("security_invoker=true")); assert.ok(row.reloptions.includes("security_barrier=true")); }
  });
  await db.exec("set role anon");
  await t.test("guest storefront contracts still return only approved fields", async () => {
    assert.deepEqual((await db.query("select * from public.checkout_payment_options")).rows, [{ paystack_enabled: true, whatsapp_enabled: true }]);
    assert.deepEqual((await db.query("select * from public.published_testimonials")).rows, [{ id: "18000000-0000-4000-8000-000000000001", customer_name: "Public name", message: "Reviewed story", rating: 5 }]);
  });
  await t.test("direct table queries cannot recover drafts or private columns", async () => {
    assert.equal((await db.query("select id,message from public.testimonials where not is_published")).rows.length, 0);
    for (const sql of [
      "select * from public.checkout_settings", "select updated_by from public.checkout_settings",
      "select updated_at from public.checkout_settings", "select * from public.testimonials",
      "select source_feedback_id from public.testimonials", "select published_at,created_at,updated_at from public.testimonials",
      "select id from public.testimonials where source_feedback_id is not null",
    ]) await assert.rejects(db.query(sql), { code: "42501" }, sql);
  });
  await t.test("neither public base tables nor views permit guest writes", async () => {
    for (const sql of [
      "update public.checkout_settings set paystack_enabled=false", "update public.checkout_payment_options set paystack_enabled=false",
      "update public.testimonials set is_published=true", "update public.published_testimonials set message='forged'",
      "delete from public.testimonials", "delete from public.published_testimonials",
      "insert into public.testimonials(id,message) values(gen_random_uuid(),'forged')",
    ]) await assert.rejects(db.query(sql), { code: "42501" }, sql);
  });
  await db.exec("reset role; set nuede_test.active_admin='false'; set role authenticated");
  await t.test("authenticated non-admin identities get no metadata or bypass through a view", async () => {
    for (const relation of ["checkout_settings", "testimonials", "checkout_payment_options", "published_testimonials"]) assert.equal((await db.query(`select * from public.${relation}`)).rows.length, 0);
    assert.equal((await db.query("update public.testimonials set is_published=true returning id")).rows.length, 0);
  });
  await db.exec("reset role; set nuede_test.active_admin='true'; set role authenticated");
  await t.test("existing authorized admin reads and publication updates remain functional", async () => {
    assert.equal((await db.query("select source_feedback_id from public.testimonials")).rows.length, 2);
    assert.equal((await db.query("select updated_by from public.checkout_settings")).rows.length, 1);
    await db.query("update public.testimonials set is_published=false");
    await db.query("update public.checkout_settings set paystack_enabled=false");
    await db.exec("reset role; set role anon");
    assert.equal((await db.query("select * from public.published_testimonials")).rows.length, 0);
    assert.equal((await db.query("select paystack_enabled from public.checkout_payment_options")).rows[0].paystack_enabled, false);
  });
});
