import { analyzeHomeworkPayload } from "../lib/handlers.mjs";
import { readJsonRequest, sendJson } from "../lib/http.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { ok: false, code: "METHOD_NOT_ALLOWED", message: "Use POST." });
  }

  try {
    const body = await readJsonRequest(req);
    const result = await analyzeHomeworkPayload(body);
    return sendJson(res, result.status, result.body);
  } catch (error) {
    return sendJson(res, error?.status || 400, {
      ok: false,
      code: "INVALID_REQUEST",
      message: error?.message || "The request could not be read."
    });
  }
}
