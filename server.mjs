import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { analyzeHomeworkPayload, generateQuestionsPayload, healthPayload } from "./lib/handlers.mjs";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
await loadEnvFile(path.join(ROOT, ".env.local"));
await loadEnvFile(path.join(ROOT, ".env"), false);

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || "0.0.0.0";
const MAX_BODY_BYTES = 19 * 1024 * 1024;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    setSecurityHeaders(res);

    if (url.pathname === "/api/health") {
      if (req.method !== "GET") return sendJson(res, 405, { ok: false, message: "Use GET." });
      const result = healthPayload();
      return sendJson(res, result.status, result.body);
    }

    if (url.pathname === "/api/analyze") {
      if (req.method !== "POST") return sendJson(res, 405, { ok: false, message: "Use POST." });
      const body = await readJson(req, MAX_BODY_BYTES);
      const result = await analyzeHomeworkPayload(body);
      return sendJson(res, result.status, result.body);
    }

    if (url.pathname === "/api/generate") {
      if (req.method !== "POST") return sendJson(res, 405, { ok: false, message: "Use POST." });
      const body = await readJson(req, 3 * 1024 * 1024);
      const result = await generateQuestionsPayload(body);
      return sendJson(res, result.status, result.body);
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendJson(res, 405, { ok: false, message: "Method not allowed." });
    }

    return serveStatic(url.pathname, req, res);
  } catch (error) {
    console.error(error);
    return sendJson(res, error?.status || 500, {
      ok: false,
      message: error?.status ? error.message : "Something went wrong on the local server."
    });
  }
});

server.listen(PORT, HOST, () => {
  const configured = Boolean(process.env.GEMINI_API_KEY);
  console.log("\nCharlotte's Quest is ready.\n");
  console.log(`Mac:  http://localhost:${PORT}`);
  for (const address of getLanAddresses()) {
    console.log(`iPad: http://${address}:${PORT}`);
  }
  console.log(`\nGemini: ${configured ? `configured (${process.env.GEMINI_MODEL || "gemini-3.6-flash"})` : "not configured — built-in practice still works"}`);
  console.log("Keep this terminal window open while Charlotte uses the app.\n");
});

async function serveStatic(requestPath, req, res) {
  const pathname = requestPath === "/" ? "/index.html" : requestPath;
  const allowed =
    pathname === "/index.html" ||
    pathname === "/styles.css" ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/robots.txt" ||
    pathname.startsWith("/js/") ||
    pathname.startsWith("/shared/") ||
    pathname.startsWith("/icons/");

  if (!allowed || pathname.includes("..")) {
    return sendText(res, 404, "Not found");
  }

  const filePath = path.join(ROOT, pathname);
  try {
    const data = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    res.statusCode = 200;
    res.setHeader("Content-Type", mimeType(extension));
    res.setHeader(
      "Cache-Control",
      pathname === "/sw.js" || pathname === "/index.html"
        ? "no-cache"
        : "public, max-age=3600"
    );
    if (req.method === "HEAD") return res.end();
    return res.end(data);
  } catch {
    return sendText(res, 404, "Not found");
  }
}

async function readJson(req, limit) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > limit) {
      const error = new Error("The upload is too large. Try fewer or more tightly cropped photos.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    const error = new Error("The request was not valid JSON.");
    error.status = 400;
    throw error;
  }
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function sendText(res, status, text) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(text);
}

function setSecurityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data: blob:; connect-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; manifest-src 'self'; worker-src 'self';"
  );
}

function mimeType(extension) {
  return {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8"
  }[extension] || "application/octet-stream";
}

async function loadEnvFile(filePath, overwrite = true) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator < 1) continue;
      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (overwrite || process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // Optional file.
  }
}

function getLanAddresses() {
  const addresses = [];
  for (const entries of Object.values(os.networkInterfaces())) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) addresses.push(entry.address);
    }
  }
  return [...new Set(addresses)];
}
