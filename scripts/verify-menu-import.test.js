import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { PGlite } from "@electric-sql/pglite";

const migrationUrl = new URL("../supabase/migrations/20260906000300_import_menu_macros.sql", import.meta.url);

async function migrationSource() {
  return readFile(migrationUrl, "utf8");
}

function importedRows(sql) {
  return [...sql.matchAll(
    /\('80000000-0000-4000-8000-(\d{12})'::uuid, '(main-meals|sides)', '([^']+)', '([^']+)', ([^,]+), ([^,]+), ([^,]+), ([^,]+), (\d+)\)/g,
  )].map((match) => ({
    sequence: Number(match[1]),
    category: match[2],
    name: match[3],
    slug: match[4],
    calories: match[5].trim(),
    protein: match[6].trim(),
    carbohydrates: match[7].trim(),
    fat: match[8].trim(),
    sortOrder: Number(match[9]),
  }));
}

test("menu import contains all 33 source-document entries in stable order", async () => {
  const rows = importedRows(await migrationSource());
  assert.equal(rows.length, 33);
  assert.deepEqual(rows.map((row) => row.sequence), Array.from({ length: 33 }, (_, index) => index + 1));
  assert.equal(rows.filter((row) => row.category === "main-meals").length, 20);
  assert.equal(rows.filter((row) => row.category === "sides").length, 13);
  assert.equal(new Set(rows.map((row) => row.slug)).size, 33);
  assert.deepEqual(
    rows.map((row) => row.name),
    [
      "Peppered Sesame Chicken", "Peppered Chicken & Veg Stir Fry", "Grilled Corn",
      "Oven-roasted Chicken and Potatoes", "Chicken Salad Bowl", "Egg Salad Bowl",
      "Vegetarian Salad Bowl", "Green Cream Pasta", "Alfredo Pasta", "Stir-fry Spaghetti",
      "Chicken Egg Wrap", "Beef Egg Wrap", "Egg Wrap", "White Basmati Rice",
      "Lemon Garlic Herb Rice", "Creamy Chicken", "Mixed Veggies", "Beef Curry", "Oats",
      "Classic Chia Pudding", "Autumn Spice Chia Pudding", "Berry Delight Chia Pudding",
      "Banana Protein Shake", "Strawberry Protein Shake", "Orange Juice", "Pineapple Juice",
      "Watermelon Juice", "Pancakes Only", "Sausages", "Eggs", "Banana", "Apples", "Strawberry",
    ],
  );
});

test("menu import preserves supplied macros and honest unknown values", async () => {
  const rows = importedRows(await migrationSource());
  const sesame = rows.find((row) => row.name === "Peppered Sesame Chicken");
  const corn = rows.find((row) => row.name === "Grilled Corn");
  const eggs = rows.find((row) => row.name === "Eggs");

  assert.deepEqual(
    [sesame.calories, sesame.protein, sesame.carbohydrates, sesame.fat],
    ["1089.7", "50.8", "18.0", "90.5"],
  );
  assert.deepEqual(
    [eggs.calories, eggs.protein, eggs.carbohydrates, eggs.fat],
    ["85.2", "4.5", "0.6", "7.2"],
  );
  assert.deepEqual(
    [corn.calories, corn.protein, corn.carbohydrates, corn.fat],
    ["null", "null", "null", "null"],
  );
  assert.equal(rows.filter((row) => row.calories === "null").length, 11);
});

test("new meals are visible but safely unorderable until pricing is supplied", async () => {
  const sql = await migrationSource();
  assert.match(sql, /null, 'price_pending', false, false, menu_item\.sort_order/);
  assert.match(sql, /on conflict \(slug\) do update set/);
  assert.doesNotMatch(sql, /on conflict \(slug\)[\s\S]*price_kobo = excluded\.price_kobo/);
  assert.doesNotMatch(sql, /on conflict \(slug\)[\s\S]*status = excluded\.status/);
});

test("decimal calories remain fixed-point across catalog and order snapshots", async () => {
  const sql = await migrationSource();
  for (const column of [
    "public.products\\s+alter column calories",
    "public.product_variants\\s+alter column calories",
    "public.product_addons\\s+alter column calories",
    "public.orders\\s+alter column total_calories",
    "public.order_items\\s+alter column calories",
    "public.order_item_addons\\s+alter column calories",
  ]) {
    assert.match(sql, new RegExp(`alter table ${column} type numeric\\(10, 2\\)`, "i"));
  }
  assert.match(sql, /\(p_order ->> 'total_calories'\)::numeric/);
  assert.match(sql, /\(item ->> 'calories'\)::numeric/);
  assert.match(sql, /\(addon ->> 'calories'\)::numeric/);
});

test("menu migration executes atomically and preserves existing commercial fields", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin;
    create schema private;
    create sequence private.order_reference_sequence start with 1001;

    create table public.categories (
      id uuid primary key, name text unique not null, slug text unique not null,
      is_enabled boolean not null, sort_order integer not null
    );
    create table public.products (
      id uuid primary key, category_id uuid not null references public.categories(id),
      product_type text not null, name text not null, slug text unique not null,
      description text not null default '', price_kobo bigint, calories integer,
      protein_g numeric(8,2), carbohydrates_g numeric(8,2), fat_g numeric(8,2),
      image_path text, status text not null, requires_variant_selection boolean not null,
      default_variant_id uuid, is_featured boolean not null, sort_order integer not null
    );
    create table public.product_variants (id uuid primary key, calories integer);
    create table public.product_addons (id uuid primary key, calories integer);
    create table public.orders (
      id uuid primary key, order_reference text, order_type text, customer_name text,
      customer_phone text, customer_email text, delivery_address text,
      delivery_landmark text, delivery_zone_id uuid, delivery_zone_name text,
      payment_method text, payment_status text, fulfilment_status text,
      subtotal_kobo bigint, delivery_fee_kobo bigint, total_kobo bigint,
      total_calories integer, total_protein_g numeric, total_carbohydrates_g numeric,
      total_fat_g numeric, nutrition_completeness text, meal_plan_start_date date,
      meal_plan_end_date date, created_at timestamptz default now()
    );
    create table public.order_items (
      id uuid primary key default gen_random_uuid(), order_id uuid, product_id uuid,
      variant_id uuid, product_name text, variant_name text, unit_base_price_kobo bigint,
      quantity integer, line_total_kobo bigint, calories integer, protein_g numeric,
      carbohydrates_g numeric, fat_g numeric, scheduled_for date, meal_slot text
    );
    create table public.order_item_addons (
      id uuid primary key default gen_random_uuid(), order_item_id uuid, addon_id uuid,
      addon_name text, unit_price_kobo bigint, calories integer, protein_g numeric,
      carbohydrates_g numeric, fat_g numeric
    );

    insert into public.categories values
      ('10000000-0000-4000-8000-000000000001', 'Main Meals', 'main-meals', true, 99);
    insert into public.products values (
      '89999999-0000-4000-8000-000000000019',
      '10000000-0000-4000-8000-000000000001', 'standard', 'Oats', 'oats',
      'Existing description', 123400, 1, 1, 1, 1, 'existing.webp', 'available',
      false, null, true, 1
    );
  `);

  await db.exec(await migrationSource());

  assert.equal((await db.query("select count(*)::integer as count from public.products")).rows[0].count, 33);
  assert.equal((await db.query("select count(*)::integer as count from public.products where status='price_pending'")).rows[0].count, 32);
  assert.deepEqual(
    (await db.query("select description,price_kobo,status,image_path,calories::text from public.products where slug='oats'")).rows[0],
    { description: "Existing description", price_kobo: 123400, status: "available", image_path: "existing.webp", calories: "681.50" },
  );
  assert.deepEqual(
    (await db.query("select price_kobo,status,calories::text from public.products where slug='peppered-sesame-chicken'")).rows[0],
    { price_kobo: null, status: "price_pending", calories: "1089.70" },
  );

  const order = {
    order_type: "cart", customer_name: "Test", customer_phone: "08000000000",
    customer_email: "", delivery_address: "Test", delivery_landmark: "",
    delivery_zone_id: "", delivery_zone_name: "Test", payment_method: "whatsapp",
    subtotal_kobo: 123400, delivery_fee_kobo: 0, total_kobo: 123400,
    total_calories: 1089.7, total_protein_g: 50.8, total_carbohydrates_g: 18,
    total_fat_g: 90.5, nutrition_completeness: "complete",
    meal_plan_start_date: null, meal_plan_end_date: null,
  };
  const items = [{
    product_id: "89999999-0000-4000-8000-000000000019", variant_id: "",
    product_name: "Oats", variant_name: "", unit_base_price_kobo: 123400,
    quantity: 1, line_total_kobo: 123400, calories: 681.5, protein_g: 23.5,
    carbohydrates_g: 91.3, fat_g: 24.7, scheduled_for: null, meal_slot: "", addons: [],
  }];
  await db.query("select public.create_order_atomic($1::jsonb, $2::jsonb)", [order, items]);
  assert.equal((await db.query("select total_calories::text from public.orders")).rows[0].total_calories, "1089.70");
  assert.equal((await db.query("select calories::text from public.order_items")).rows[0].calories, "681.50");
});
