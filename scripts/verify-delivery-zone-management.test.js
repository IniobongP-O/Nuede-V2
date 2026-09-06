import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { createDeliveryZoneAdminFormSchema } from "../packages/validation/src/checkout.js";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("delivery-area creation validates a trimmed name and integer-kobo-compatible fee", () => {
  assert.deepEqual(
    createDeliveryZoneAdminFormSchema.parse({ name: "  Maitama  ", feeNgn: "1800.50" }),
    { name: "Maitama", feeNgn: "1800.50" },
  );
  assert.equal(createDeliveryZoneAdminFormSchema.safeParse({ name: "   ", feeNgn: "1800" }).success, false);
  assert.equal(createDeliveryZoneAdminFormSchema.safeParse({ name: "Maitama", feeNgn: "-1" }).success, false);
  assert.equal(createDeliveryZoneAdminFormSchema.safeParse({ name: "Maitama", feeNgn: "1.001" }).success, false);
});

test("delivery-area management centralizes insert and delete operations and confirms deletion", async () => {
  const [api, hooks, page, foundation] = await Promise.all([
    read("../apps/admin/src/features/checkout-settings/api/checkoutSettingsApi.js"),
    read("../apps/admin/src/features/checkout-settings/hooks/useCheckoutSettingsAdmin.js"),
    read("../apps/admin/src/pages/DeliveryPage.jsx"),
    read("../supabase/migrations/20260831000100_create_database_foundation.sql"),
  ]);

  assert.match(api, /export async function createDeliveryZone/);
  assert.match(api, /\.from\("delivery_zones"\)[\s\S]*?\.insert\(/);
  assert.match(api, /export async function deleteDeliveryZone/);
  assert.match(api, /\.from\("delivery_zones"\)[\s\S]*?\.delete\(\)/);
  assert.match(hooks, /useCreateDeliveryZone/);
  assert.match(hooks, /useDeleteDeliveryZone/);
  assert.match(page, /Add delivery area/);
  assert.match(page, /Delete delivery area\?/);
  assert.match(page, /This action cannot be undone/);
  assert.match(foundation, /delivery_zone_id uuid[\s\S]*?foreign key \(delivery_zone_id\) references public\.delivery_zones\(id\) on delete set null/);
});
