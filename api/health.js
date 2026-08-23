import { healthPayload } from "../lib/handlers.mjs";
import { sendJson } from "../lib/http.mjs";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED", message: "Use GET." });
  }
  const result = healthPayload();
  return sendJson(res, result.status, result.body);
}
