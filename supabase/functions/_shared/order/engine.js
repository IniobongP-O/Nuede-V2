import { loadOrderContext, validateOrderContext } from "./catalog.js";
import { persistOrderAtomically } from "./persistence.js";
import { flattenOrderItems } from "./request.js";
import { buildSuccessResponse } from "./response.js";
import { parseCheckoutRequest } from "./schema.js";
import { buildOrderSnapshot } from "./snapshots.js";

export async function createAuthoritativeOrder(candidate, client, dependencies = {}) {
  const loadContext = dependencies.loadContext || loadOrderContext;
  const persist = dependencies.persist || persistOrderAtomically;
  // Keep the trust boundary linear: accept only the selection contract, reload
  // every mutable commercial value, validate relationships, calculate, snapshot,
  // and finally persist. Reordering these stages can make browser data authoritative.
  const request = parseCheckoutRequest(candidate);
  const sourceItems = flattenOrderItems(request);
  const context = await loadContext(client, request, sourceItems);
  const validated = validateOrderContext(request, sourceItems, context);
  const snapshot = buildOrderSnapshot(request, validated);
  const persisted = await persist(client, snapshot);
  return buildSuccessResponse(request, snapshot, persisted);
}
