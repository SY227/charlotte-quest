export async function getApiHealth() {
  return requestJson("/api/health", { method: "GET" }, 12000);
}

export async function analyzeHomework(images) {
  return requestJson(
    "/api/analyze",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grade: 3,
        childName: "Charlotte",
        images: images.map((image) => ({
          data: image.base64,
          mimeType: image.mimeType
        }))
      })
    },
    70000
  );
}

export async function generateQuestionBatch({
  pack,
  selectedConcepts,
  count,
  startingIndex,
  avoidFingerprints,
  performanceSummary
}) {
  return requestJson(
    "/api/generate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pack,
        selectedConcepts,
        count,
        startingIndex,
        avoidFingerprints,
        performanceSummary
      })
    },
    70000
  );
}

async function requestJson(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.ok) {
      const error = new Error(data?.message || `Request failed (${response.status}).`);
      error.code = data?.code || `HTTP_${response.status}`;
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = new Error("That took too long. Please try again.");
      timeoutError.code = "TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
