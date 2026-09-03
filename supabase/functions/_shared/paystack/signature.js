function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function signPaystackPayload(rawPayload, secretKey, cryptoImpl = crypto) {
  const encoder = new TextEncoder();
  const key = await cryptoImpl.subtle.importKey("raw", encoder.encode(secretKey), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  return bytesToHex(new Uint8Array(await cryptoImpl.subtle.sign("HMAC", key, encoder.encode(rawPayload))));
}

export async function verifyPaystackSignature(rawPayload, signature, secretKey, cryptoImpl = crypto) {
  if (!secretKey || !/^[a-f0-9]{128}$/i.test(signature || "")) return false;
  const expected = await signPaystackPayload(rawPayload, secretKey, cryptoImpl);
  // Compare the complete digest without returning at the first mismatched byte;
  // this avoids the obvious matching-prefix timing leak of a naive comparison.
  let mismatch = expected.length ^ signature.length;
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ (signature.charCodeAt(index) || 0);
  }
  return mismatch === 0;
}
