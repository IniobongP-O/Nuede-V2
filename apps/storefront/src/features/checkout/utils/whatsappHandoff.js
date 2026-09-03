export function isSafeWhatsappUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === "wa.me"
      && url.username === ""
      && url.password === ""
      && /^\/\d{8,15}$/.test(url.pathname)
      && url.searchParams.has("text");
  } catch {
    return false;
  }
}

export function openWhatsappHandoff(url, opener = globalThis.window?.open?.bind(globalThis.window)) {
  if (!isSafeWhatsappUrl(url) || typeof opener !== "function") return false;
  try {
    return opener(url, "_blank", "noopener,noreferrer") !== null;
  } catch {
    return false;
  }
}
