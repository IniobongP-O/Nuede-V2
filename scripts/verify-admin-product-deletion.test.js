import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { PGlite } from "@electric-sql/pglite";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("admin catalog exposes confirmed permanent deletion through the centralized API", async () => {
  const api = await read("apps/admin/src/features/catalog/api/catalogApi.js");
  const hooks = await read("apps/admin/src/features/catalog/hooks/useCatalog.js");
  const actions = await read("apps/admin/src/features/catalog/components/ProductActions.jsx");
  const page = await read("apps/admin/src/pages/MenuPage.jsx");
  const security = await read("supabase/migrations/20260831000200_enable_auth_and_rls.sql");

  assert.match(api, /export async function deleteProduct\(product\)/);
  assert.match(api, /from\("products"\)\.delete\(\)/);
  assert.match(api, /Promise\.allSettled\(imagePaths\.map/);
  assert.match(hooks, /export function useDeleteProduct\(\)/);
  assert.match(actions, /Delete permanently/);
  assert.match(page, /window\.confirm\(`Permanently delete/);
  assert.match(page, /await deleteMeal\(product\)/);
  assert.match(security, /products_active_admin_delete[\s\S]*for delete to authenticated[\s\S]*private\.is_active_admin\(\)/i);
});

test("product deletion is audited and preserves historical order snapshots", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  const actorId = "91000000-0000-4000-8000-000000000001";
  const productId = "92000000-0000-4000-8000-000000000001";

  await db.exec(`
    create schema auth;
    create schema private;
    create role anon nologin;
    create role authenticated nologin;
    create function auth.uid() returns uuid language sql stable as $$ select '${actorId}'::uuid $$;
    create table public.admin_users (id uuid primary key, email text, is_active boolean, role text);
    create table public.products (
      id uuid primary key, category_id uuid, product_type text, name text, slug text,
      description text, price_kobo bigint, calories numeric, protein_g numeric,
      carbohydrates_g numeric, fat_g numeric, image_path text, status text,
      requires_variant_selection boolean, default_variant_id uuid,
      created_at timestamptz default now(), updated_at timestamptz default now()
    );
    create table public.product_variants (
      id uuid primary key, product_id uuid references public.products(id) on delete cascade
    );
    create table public.product_addon_assignments (
      product_id uuid references public.products(id) on delete cascade, addon_id uuid
    );
    create table public.order_items (
      id uuid primary key, product_id uuid references public.products(id) on delete set null,
      product_name text not null
    );
    create table public.admin_audit_log (
      id uuid primary key default gen_random_uuid(), admin_user_id uuid,
      admin_email_snapshot text, action text, entity_type text, entity_id uuid,
      previous_values jsonb, new_values jsonb
    );
    insert into public.admin_users values ('${actorId}', 'admin@nuede.test', true, 'admin');
    insert into public.products values (
      '${productId}', null, 'standard', 'Delete Me', 'delete-me', 'Snapshot test',
      500000, 500, 40, 50, 15, null, 'available', false, null, now(), now()
    );
    insert into public.product_variants values ('93000000-0000-4000-8000-000000000001', '${productId}');
    insert into public.product_addon_assignments values ('${productId}', '94000000-0000-4000-8000-000000000001');
    insert into public.order_items values ('95000000-0000-4000-8000-000000000001', '${productId}', 'Delete Me');
  `);

  await db.exec(await read("supabase/migrations/20260906000400_audit_admin_product_deletion.sql"));
  await db.query("delete from public.products where id=$1", [productId]);

  assert.equal((await db.query("select count(*)::integer as count from public.products")).rows[0].count, 0);
  assert.equal((await db.query("select count(*)::integer as count from public.product_variants")).rows[0].count, 0);
  assert.equal((await db.query("select count(*)::integer as count from public.product_addon_assignments")).rows[0].count, 0);
  assert.deepEqual(
    (await db.query("select product_id,product_name from public.order_items")).rows[0],
    { product_id: null, product_name: "Delete Me" },
  );
  assert.deepEqual(
    (await db.query("select action,entity_id,previous_values->>'name' as name from public.admin_audit_log")).rows[0],
    { action: "product_removed", entity_id: productId, name: "Delete Me" },
  );
});
