const numberFormatter = new Intl.NumberFormat("en-NG");

function asKobo(value) {
  if (typeof value === "bigint") return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) return BigInt(value);
  if (typeof value === "string" && /^\d+$/.test(value)) return BigInt(value);
  throw new Error("Kobo values must be non-negative integers.");
}

export function formatKobo(value, pendingLabel = "Price pending") {
  if (value === null || value === undefined) return pendingLabel;
  const kobo = asKobo(value);
  const wholeNaira = kobo / 100n;
  const fractionalKobo = kobo % 100n;
  const fraction = fractionalKobo === 0n ? "" : `.${fractionalKobo.toString().padStart(2, "0")}`;
  return `₦${numberFormatter.format(wholeNaira)}${fraction}`;
}

export function koboToNairaInput(value) {
  if (value === null || value === undefined) return "";
  const kobo = asKobo(value);
  const wholeNaira = kobo / 100n;
  const fractionalKobo = kobo % 100n;
  return fractionalKobo === 0n
    ? wholeNaira.toString()
    : `${wholeNaira}.${fractionalKobo.toString().padStart(2, "0")}`;
}
