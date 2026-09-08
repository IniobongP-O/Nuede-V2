const numberFormatter = new Intl.NumberFormat("en-NG");

/** Converts supported integer-kobo inputs to an exact BigInt representation. */
function asKobo(value) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return BigInt(value);
  if (typeof value === "string" && /^\d+$/.test(value)) return BigInt(value);
  throw new Error("Kobo values must be non-negative integers.");
}

/**
 * Formats a non-negative integer-kobo value for display without converting
 * through floating-point naira. This keeps large stored monetary values exact.
 *
 * @param {number|string|bigint|null|undefined} value
 * @param {string} [pendingLabel]
 * @returns {string}
 */
export function formatKobo(value, pendingLabel = "Price pending") {
  if (value === null || value === undefined) return pendingLabel;
  const kobo = asKobo(value);
  const wholeNaira = kobo / 100n;
  const fractionalKobo = kobo % 100n;
  const fraction = fractionalKobo === 0n ? "" : `.${fractionalKobo.toString().padStart(2, "0")}`;
  return `₦${numberFormatter.format(wholeNaira)}${fraction}`;
}

/**
 * Converts integer kobo to the decimal text expected by admin NGN inputs.
 * The returned string is an editing value, not an authoritative price.
 *
 * @param {number|string|bigint|null|undefined} value
 * @returns {string}
 */
export function koboToNairaInput(value) {
  if (value === null || value === undefined) return "";
  const kobo = asKobo(value);
  const wholeNaira = kobo / 100n;
  const fractionalKobo = kobo % 100n;
  return fractionalKobo === 0n
    ? wholeNaira.toString()
    : `${wholeNaira}.${fractionalKobo.toString().padStart(2, "0")}`;
}
