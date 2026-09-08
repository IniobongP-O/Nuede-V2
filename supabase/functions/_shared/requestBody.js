import { OrderError } from "./order/errors.js";

/**
 * Reads a request body while enforcing the byte limit on the actual stream.
 * `Content-Length` is used only as an early rejection because it may be absent or false.
 */
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

/** Reads a bounded request body and parses it as JSON. */
export async function readRequestJson(request) {
  return JSON.parse(await readRequestText(request));
}
