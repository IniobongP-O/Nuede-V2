import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { PGlite } from "@electric-sql/pglite";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("meal-plan checkout uses a deterministic inverse button variant", async () => {
  const button = await read("apps/storefront/src/components/ui/Button.jsx");
  const summary = await read("apps/storefront/src/features/planner/components/PlannerSummary.jsx");
  assert.match(button, /inverse: "bg-white text-brand-950 hover:bg-brand-100 active:bg-brand-200"/);
  assert.match(summary, /variant="inverse"/);
  assert.doesNotMatch(summary, /className="[^"]*bg-white[^"]*text-brand-950/);
});

test("admin WhatsApp payment confirmation is guarded, explicit, and centralized", async () => {
  const migration = await read("supabase/migrations/20260906000200_enable_admin_whatsapp_payment_confirmation.sql");
  const api = await read("apps/admin/src/features/orders/api/ordersApi.js");
  const action = await read("apps/admin/src/features/orders/components/MarkWhatsappPaidAction.jsx");
  const detailPage = await read("apps/admin/src/pages/OrderDetailPage.jsx");

  assert.match(migration, /admin_user\.role in \('owner', 'admin'\)/);
  assert.match(migration, /order_record\.payment_method <> 'whatsapp'/);
  assert.match(migration, /for update/);
  assert.match(migration, /insert into public\.payments/);
  assert.match(migration, /'whatsapp_order_marked_paid'/);
  assert.match(migration, /create or replace view private\.analytics_eligible_sales/);
  assert.match(migration, /audit\.new_values ->> 'payment_id' = payment\.id::text/);
  assert.match(migration, /revoke all on function public\.mark_whatsapp_order_paid\(uuid\) from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.mark_whatsapp_order_paid\(uuid\) to authenticated/);
  assert.match(api, /\.rpc\("mark_whatsapp_order_paid"/);
  assert.match(action, /\["owner", "admin"\]\.includes/);
  assert.match(action, /Mark as paid/);
  assert.match(action, /confirming that Nuede received/);
  assert.match(detailPage, /MarkWhatsappPaidAction/);
  assert.doesNotMatch(`${api}\n${action}\n${detailPage}`, /\.from\(["']orders["']\)\.update/i);
});

test("WhatsApp payment confirmation is atomic, audited, and never applies to Paystack", async () => {
  const db = new PGlite();
  const actorId = "11111111-1111-4111-8111-111111111111";
  const whatsappOrderId = "22222222-2222-4222-8222-222222222222";
  const paystackOrderId = "33333333-3333-4333-8333-333333333333";
  const refundedOrderId = "44444444-4444-4444-8444-444444444444";

  try {
    await db.exec(`
      create schema auth;
      create schema private;
      create role anon;
      create role authenticated;
      create function auth.uid() returns uuid language sql stable as $$ select '${actorId}'::uuid $$;
      create table public.admin_users (id uuid primary key, email text, is_active boolean, role text);
      create table public.orders (
        id uuid primary key, order_reference text, order_type text, payment_method text,
        payment_status text, fulfilment_status text, delivery_zone_id uuid,
        delivery_zone_name text, subtotal_kobo bigint, delivery_fee_kobo bigint, total_kobo bigint
      );
      create table public.payments (
        id uuid primary key default gen_random_uuid(), order_id uuid, payment_method text,
        provider text, amount_kobo bigint, status text, verification_status text,
        verified_at timestamptz, provider_amount_kobo bigint, provider_currency text,
        created_at timestamptz default now()
      );
      create table public.admin_audit_log (
        id uuid primary key default gen_random_uuid(), admin_user_id uuid, admin_email_snapshot text,
        action text, entity_type text, entity_id uuid, previous_values jsonb, new_values jsonb,
        created_at timestamptz default now()
      );
      insert into public.admin_users values ('${actorId}', 'finance@nuede.test', true, 'editor');
      insert into public.orders values
        ('${whatsappOrderId}', 'NUE-WA-001', 'cart', 'whatsapp', 'unpaid', 'confirmed', null, 'Central', 4000000, 350000, 4350000),
        ('${paystackOrderId}', 'NUE-PS-001', 'cart', 'paystack', 'pending', 'pending', null, 'Central', 400000, 100000, 500000),
        ('${refundedOrderId}', 'NUE-WA-REFUND', 'cart', 'whatsapp', 'refunded', 'cancelled', null, 'Central', 500000, 100000, 600000);
    `);
    await db.exec(await read("supabase/migrations/20260906000200_enable_admin_whatsapp_payment_confirmation.sql"));

    await assert.rejects(
      db.query(`select public.mark_whatsapp_order_paid('${whatsappOrderId}')`),
      /PAYMENT_MANAGEMENT_ACCESS_REQUIRED/,
    );
    await db.exec(`update public.admin_users set role = 'admin' where id = '${actorId}'`);

    await assert.rejects(
      db.query(`select public.mark_whatsapp_order_paid('${paystackOrderId}')`),
      /WHATSAPP_ORDER_REQUIRED/,
    );
    await assert.rejects(
      db.query(`select public.mark_whatsapp_order_paid('${refundedOrderId}')`),
      /INVALID_WHATSAPP_PAYMENT_TRANSITION/,
    );

    const result = await db.query(`select public.mark_whatsapp_order_paid('${whatsappOrderId}') as result`);
    assert.equal(result.rows[0].result.payment_status, "paid");
    assert.equal(result.rows[0].result.already_paid, false);
    assert.equal((await db.query(`select payment_status from public.orders where id = '${whatsappOrderId}'`)).rows[0].payment_status, "paid");

    const payment = (await db.query(`select * from public.payments where order_id = '${whatsappOrderId}'`)).rows[0];
    assert.equal(payment.payment_method, "whatsapp");
    assert.equal(payment.provider, null);
    assert.equal(payment.amount_kobo, 4350000);
    assert.equal(payment.status, "paid");
    assert.equal(payment.verification_status, "not_applicable");

    const audit = (await db.query(`select * from public.admin_audit_log where entity_id = '${whatsappOrderId}'`)).rows[0];
    assert.equal(audit.action, "whatsapp_order_marked_paid");
    assert.equal(audit.previous_values.payment_status, "unpaid");
    assert.equal(audit.new_values.payment_status, "paid");
    assert.equal(audit.new_values.amount_kobo, 4350000);
    const sale = (await db.query(`select * from private.analytics_eligible_sales where order_id = '${whatsappOrderId}'`)).rows[0];
    assert.equal(sale.revenue_kobo, 4350000);
    assert.equal(sale.payment_method, "whatsapp");

    const retry = await db.query(`select public.mark_whatsapp_order_paid('${whatsappOrderId}') as result`);
    assert.equal(retry.rows[0].result.already_paid, true);
    assert.equal((await db.query(`select count(*)::integer as count from public.payments where order_id = '${whatsappOrderId}'`)).rows[0].count, 1);
    assert.equal((await db.query(`select count(*)::integer as count from public.admin_audit_log where entity_id = '${whatsappOrderId}'`)).rows[0].count, 1);
    assert.equal((await db.query(`select payment_status from public.orders where id = '${paystackOrderId}'`)).rows[0].payment_status, "pending");
  } finally {
    await db.close();
  }
});
