import { OrderError } from "./order/errors.js";

// Bound bytes while reading: Content-Length alone is untrusted and may be absent.
export async function readRequestText(request, maxBytes = 128 * 1024) {
  const tooLarge = () => new OrderError("PAYLOAD_TOO_LARGE", "The request is too large.", { status: 413, stage: "request" });
  if (Number(request.headers.get("content-length")) > maxBytes) throw tooLarge();
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) {
        await reader.cancel();
        throw tooLarge();
      }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

export async function readRequestJson(request) {
  return JSON.parse(await readRequestText(request));
}
