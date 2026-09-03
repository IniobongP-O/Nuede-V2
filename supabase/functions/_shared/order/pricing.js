import { OrderError } from "./errors.js";

function arithmeticFailure() {
  return new OrderError("ORDER_VALUE_OUT_OF_RANGE", "The order is too large to calculate safely.", {
    status: 422,
    stage: "pricing",
  });
}

export function addKobo(values) {
  // Money remains integer kobo throughout trusted arithmetic. Safe-integer
  // guards reject totals that JavaScript could no longer represent exactly.
  let total = 0;
  for (const value of values) {
    if (!Number.isSafeInteger(value) || value < 0) throw arithmeticFailure();
    total += value;
    if (!Number.isSafeInteger(total)) throw arithmeticFailure();
  }
  return total;
}

export function multiplyKobo(value, quantity) {
  if (!Number.isSafeInteger(value) || value < 0 || !Number.isInteger(quantity) || quantity < 1) {
    throw arithmeticFailure();
  }
  const total = value * quantity;
  if (!Number.isSafeInteger(total)) throw arithmeticFailure();
  return total;
}

export function calculateItemPrice({ basePriceKobo, addons, configuration }) {
  // Validation has already established unique compatible add-ons, so each add-on
  // contributes once to the configured unit before quantity is applied.
  const addonPriceKobo = addKobo(addons.map((addon) => Number(addon.price_kobo)));
  const unitPriceKobo = addKobo([basePriceKobo, addonPriceKobo]);
  return {
    addonPriceKobo,
    unitPriceKobo,
    lineTotalKobo: multiplyKobo(unitPriceKobo, configuration.quantity),
  };
}
