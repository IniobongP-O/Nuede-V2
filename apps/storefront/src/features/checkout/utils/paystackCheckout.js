/** Accepts only HTTPS redirects hosted on Paystack's checkout origin. */
export function isSafePaystackAuthorizationUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "checkout.paystack.com";
  } catch {
    return false;
  }
}

/** Navigates to a validated Paystack checkout URL and reports whether navigation began. */
export function redirectToPaystackCheckout(value, navigate = (url) => window.location.assign(url)) {
  if (!isSafePaystackAuthorizationUrl(value)) return false;
  try {
    navigate(value);
    return true;
  } catch {
    return false;
  }
}
