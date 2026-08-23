export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function topbarMarkup({ subtitle = "Made just for Charlotte", showHome = true, showProgress = true, showParent = true } = {}) {
  return `
    <header class="topbar">
      <button class="brand-button" type="button" data-action="go-home" aria-label="Go to home">
        <span class="brand-mark" aria-hidden="true">✦</span>
        <span class="brand-copy">
          <span class="brand-title">Charlotte's Quest</span>
          <span class="brand-subtitle">${escapeHtml(subtitle)}</span>
        </span>
      </button>
      <div class="topbar-actions">
        ${showProgress ? `<button class="text-button" type="button" data-action="show-progress" aria-label="Show progress"><span aria-hidden="true">🏅</span><span class="optional-label">Progress</span></button>` : ""}
        ${showParent ? `<button class="text-button" type="button" data-action="open-parent" aria-label="Open parent setup"><span aria-hidden="true">📷</span><span class="optional-label">New homework</span></button>` : ""}
        ${!showHome ? `<button class="icon-button" type="button" data-action="go-home" aria-label="Go home">⌂</button>` : ""}
      </div>
    </header>
  `;
}

export function mascotMarkup() {
  return `
    <div class="mascot-stage" aria-label="Nova, Charlotte's friendly quest companion">
      <div class="mascot-aura" aria-hidden="true"></div>
      <div class="questling" aria-hidden="true">
        <div class="questling-ear left"></div>
        <div class="questling-ear right"></div>
        <div class="questling-body"></div>
        <div class="questling-face">
          <span class="questling-eye left"></span>
          <span class="questling-eye right"></span>
          <span class="questling-cheek left"></span>
          <span class="questling-cheek right"></span>
          <span class="questling-mouth"></span>
        </div>
        <div class="questling-belly"></div>
        <div class="questling-star">★</div>
        <span class="spark-dot one"></span>
        <span class="spark-dot two"></span>
        <span class="spark-dot three"></span>
      </div>
    </div>
  `;
}

export function showToast(message, type = "default", duration = 3200) {
  const region = document.getElementById("toast-region");
  if (!region) return;
  const toast = document.createElement("div");
  toast.className = `toast ${type === "default" ? "" : type}`.trim();
  const icon = type === "error" ? "!" : type === "success" ? "✓" : "✦";
  toast.innerHTML = `<strong aria-hidden="true">${icon}</strong><span>${escapeHtml(message)}</span>`;
  region.replaceChildren(toast);
  window.setTimeout(() => {
    if (toast.isConnected) toast.remove();
  }, duration);
}

export function burstConfetti(count = 44) {
  const layer = document.getElementById("confetti-layer");
  if (!layer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const colors = ["#6c55d9", "#1b9b91", "#f3b63c", "#ef7a75", "#4c7dd9"];
  const fragment = document.createDocumentFragment();
  for (let i = 0; i < count; i += 1) {
    const piece = document.createElement("span");
    piece.className = "confetti-piece";
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty("--fall-time", `${1.8 + Math.random() * 1.5}s`);
    piece.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    fragment.appendChild(piece);
    window.setTimeout(() => piece.remove(), 3600);
  }
  layer.appendChild(fragment);
}

export function playSuccessTone(enabled = true) {
  if (!enabled) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.38);
    gain.connect(context.destination);
    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      oscillator.connect(gain);
      oscillator.start(context.currentTime + index * 0.08);
      oscillator.stop(context.currentTime + 0.32 + index * 0.08);
    });
    window.setTimeout(() => context.close(), 800);
  } catch {
    // Sound is optional.
  }
}

export function formatDate(iso) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(new Date(iso));
  } catch {
    return "Recent";
  }
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
