import { CHARLOTTE_SAMPLE_PACK, cloneSamplePack } from "/shared/sample-pack.js";
import {
  isAnswerCorrect,
  normalizeAnswer
} from "/shared/question-engine.js";
import { analyzeHomework, generateQuestionBatch, getApiHealth } from "/js/api.js";
import { formatBytes, prepareImageFiles } from "/js/image-utils.js";
import {
  addHistoryEntry,
  clearAllLocalData,
  loadHistory,
  loadLearningPack,
  loadSettings,
  saveLearningPack,
  saveSettings
} from "/js/storage.js";
import {
  burstConfetti,
  clamp,
  escapeHtml,
  formatDate,
  mascotMarkup,
  playSuccessTone,
  showToast,
  topbarMarkup
} from "/js/ui-utils.js";

const app = document.getElementById("app");
const settings = loadSettings();
const savedLearningPack = loadLearningPack();
const initialPack = savedLearningPack?.source === "uploaded-homework"
  ? savedLearningPack
  : cloneSamplePack();

const state = {
  screen: "home",
  pack: initialPack,
  selectedConcepts: new Set(),
  uploadImages: [],
  processingImages: false,
  analyzing: false,
  apiHealth: null,
  session: null,
  modal: null,
  settings
};

resetSelectedConcepts();
registerGlobalEvents();
render();
loadHealth();
registerServiceWorker();

function registerGlobalEvents() {
  app.addEventListener("click", handleClick);
  app.addEventListener("change", handleChange);
  app.addEventListener("input", handleInput);
  app.addEventListener("keydown", handleKeydown);
}

async function loadHealth() {
  try {
    state.apiHealth = await getApiHealth();
  } catch {
    state.apiHealth = { configured: false, model: "gemini-3.6-flash" };
  }
  if (["home", "parent"].includes(state.screen)) render();
}

function render() {
  if (!app) return;
  const markup = {
    home: renderHome,
    parent: renderParentSetup,
    review: renderReview,
    loading: renderLoading,
    practice: renderPractice,
    results: renderResults,
    progress: renderProgress
  }[state.screen]?.() || renderHome();

  app.innerHTML = markup + renderModal();
  afterRender();
}

function afterRender() {
  if (state.screen === "parent") {
    const dropZone = document.querySelector("[data-drop-zone]");
    if (dropZone) {
      dropZone.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropZone.classList.add("dragging");
      });
      dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));
      dropZone.addEventListener("drop", (event) => {
        event.preventDefault();
        dropZone.classList.remove("dragging");
        if (event.dataTransfer?.files?.length) handleSelectedFiles(event.dataTransfer.files);
      });
    }
  }

  if (state.screen === "practice") {
    const input = document.querySelector("[data-number-answer]");
    if (input && !currentResponse()?.completed) {
      window.setTimeout(() => input.focus(), 60);
    }
  }
}

function renderHome() {
  const pack = state.pack || CHARLOTTE_SAMPLE_PACK;
  const concepts = (pack.concepts || []).filter((concept) => concept.selectedByDefault !== false).slice(0, 5);
  const configured = state.apiHealth?.configured;
  const sourceLabel = pack.source === "uploaded-homework" ? "Based on the latest homework" : "Built from Charlotte's current homework set";

  return `
    <div class="app-shell">
      ${topbarMarkup({ subtitle: configured ? "Gemini practice ready" : "Private Grade 3 practice" })}
      <main class="page">
        <section class="home-grid">
          <article class="hero-card">
            <div class="hero-copy">
              <div class="eyebrow">Charlotte's learning adventure</div>
              <h1 class="hero-title">Practice what you’re learning. <em>Grow stronger.</em></h1>
              <p class="hero-text">Short questions from your schoolwork, with help when you need it.</p>
              <div class="hero-actions">
                <button class="primary-button" type="button" data-action="start-session" data-length="10">
                  <span aria-hidden="true">▶</span> Start 10 questions
                </button>
                <button class="soft-button" type="button" data-action="open-parent">
                  <span aria-hidden="true">📷</span> Add today's homework
                </button>
              </div>
            </div>
            ${mascotMarkup()}
          </article>

          <aside class="mission-panel">
            <article class="mission-card">
              <div class="mission-heading-row">
                <div>
                  <div class="section-kicker">Current mission</div>
                  <h2>${escapeHtml(pack.shortTitle || pack.title)}</h2>
                </div>
                <div class="mission-icon" aria-hidden="true">${escapeHtml(pack.concepts?.[0]?.icon || "✦")}</div>
              </div>
              <p class="mission-description">${escapeHtml(pack.childIntro || "Let's practice the ideas from your schoolwork.")}</p>
              <div class="skill-chip-row">
                ${concepts.map((concept) => `<span class="skill-chip"><span aria-hidden="true">${escapeHtml(concept.icon || "⭐")}</span>${escapeHtml(concept.childFriendlyName || concept.name)}</span>`).join("")}
              </div>
              <div class="session-grid" aria-label="Choose a practice length">
                ${sessionButtonMarkup(10, "Quick quest", "About 5–7 min")}
                ${sessionButtonMarkup(20, "Full quest", "About 10–15 min")}
                ${sessionButtonMarkup(50, "Power quest", "Long practice")}
                ${sessionButtonMarkup("free", "Free mode", "Keep going")}
              </div>
            </article>
            <div class="quick-card">
              <div class="quick-card-icon" aria-hidden="true">🧠</div>
              <div>
                <strong>${escapeHtml(sourceLabel)}</strong>
                <span>Your first answer sets the score. Fixing mistakes still counts as learning.</span>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </div>
  `;
}

function sessionButtonMarkup(length, title, subtitle) {
  return `
    <button class="session-button" type="button" data-action="start-session" data-length="${escapeHtml(length)}">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(subtitle)}</span>
    </button>
  `;
}

function renderParentSetup() {
  const configured = state.apiHealth?.configured;
  const model = state.apiHealth?.model || "gemini-3.6-flash";
  const imageCount = state.uploadImages.length;

  return `
    <div class="app-shell">
      ${topbarMarkup({ subtitle: "Parent setup", showProgress: false, showParent: false, showHome: false })}
      <main class="page page-narrow">
        <div class="page-heading">
          <div>
            <div class="eyebrow">Parent setup</div>
            <h1>Add today's schoolwork</h1>
            <p>Add clear photos. I’ll find the main skills, then you pick what Charlotte practices.</p>
          </div>
        </div>

        ${stepStripMarkup(1)}

        <section class="panel-card">
          <div class="upload-zone" data-drop-zone>
            <div>
              <div class="upload-zone-icon" aria-hidden="true">📚</div>
              <h2>${imageCount ? `${imageCount} photo${imageCount === 1 ? "" : "s"} ready` : "Add homework photos"}</h2>
              <p>${imageCount ? "Add more pages if they belong to the same lesson, or analyze what is ready." : "Add the worksheet and Charlotte's work when you can. More pages can help."}</p>
              <div class="upload-actions">
                <label class="primary-button button-small" for="camera-input"><span aria-hidden="true">📷</span> Take photo</label>
                <input id="camera-input" class="file-input" type="file" accept="image/*" capture="environment" />
                <label class="soft-button button-small" for="library-input"><span aria-hidden="true">🖼️</span> Choose from Photos</label>
                <input id="library-input" class="file-input" type="file" accept="image/*" multiple />
              </div>
            </div>
          </div>

          ${imageCount ? renderImagePreviews() : ""}

          <div class="privacy-note">
            <span aria-hidden="true">🔒</span>
            <div><strong>Private prototype behavior:</strong> photos are resized on this device, sent only for analysis, and are not saved in Charlotte's local progress. Crop out names or school details when convenient.</div>
          </div>

          ${configured === false ? `
            <div class="warning-note">
              <span aria-hidden="true">⚙️</span>
              <div><strong>Gemini is needed for practice.</strong> Questions are generated fresh from Charlotte's learning concepts. New homework analysis also uses Gemini.</div>
            </div>
          ` : configured ? `
            <div class="info-note">
              <span aria-hidden="true">✦</span>
              <div><strong>${escapeHtml(model)} is ready.</strong> The app uses structured multimodal analysis and keeps the practice interface separate from the AI.</div>
            </div>
          ` : ""}

          <div class="panel-footer">
            <button class="soft-button" type="button" data-action="use-sample-pack">Use Charlotte's current concept set</button>
            <button class="primary-button" type="button" data-action="analyze-images" ${!imageCount || state.processingImages || state.analyzing ? "disabled" : ""}>
              <span aria-hidden="true">${state.analyzing ? "⏳" : "✦"}</span>
              ${state.processingImages ? "Preparing photos…" : state.analyzing ? "Analyzing schoolwork…" : "Find the skills"}
            </button>
          </div>
        </section>
      </main>
    </div>
  `;
}

function renderImagePreviews() {
  return `
    <div class="preview-grid" aria-label="Selected homework photos">
      ${state.uploadImages.map((image, index) => `
        <article class="preview-card">
          <img src="${image.previewUrl}" alt="Homework preview ${index + 1}" />
          <div class="preview-meta">
            <span>Page ${index + 1} · ${escapeHtml(formatBytes(image.compressedSize))}</span>
            <button class="preview-remove" type="button" data-action="remove-image" data-image-id="${escapeHtml(image.id)}" aria-label="Remove page ${index + 1}">×</button>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function stepStripMarkup(activeStep) {
  const labels = ["Add pages", "Pick skills", "Start practice"];
  return `
    <div class="step-strip" aria-label="Setup progress">
      ${labels.map((label, index) => {
        const step = index + 1;
        const className = step < activeStep ? "complete" : step === activeStep ? "active" : "";
        return `<div class="step-item ${className}"><span class="step-number">${step < activeStep ? "✓" : step}</span>${escapeHtml(label)}</div>`;
      }).join("")}
    </div>
  `;
}

function renderReview() {
  const pack = state.pack;
  const selectedCount = state.selectedConcepts.size;
  const topStrength = pack.strengths?.[0];
  const focusNeeds = (pack.practiceNeeds || []).slice(0, 2);

  return `
    <div class="app-shell">
      ${topbarMarkup({ subtitle: "Pick today’s practice", showProgress: false, showParent: false, showHome: false })}
      <main class="page">
        <div class="page-heading">
          <div>
            <div class="eyebrow">Homework ready</div>
            <h1>${escapeHtml(pack.shortTitle || pack.title)}</h1>
            <p>Pick what Charlotte should practice today.</p>
          </div>
        </div>

        ${stepStripMarkup(2)}

        <section class="review-layout">
          <div class="review-main">
            <article class="summary-card tint-purple">
              <div class="card-heading">
                <div class="card-heading-icon" aria-hidden="true">👀</div>
                <div>
                  <div class="section-kicker">Quick look</div>
                  <h2>What I found</h2>
                </div>
              </div>
              <ul class="insight-list compact-insights">
                ${topStrength ? `
                  <li class="insight-item">
                    <span class="insight-bullet" aria-hidden="true">✓</span>
                    <div><strong>Doing well</strong><span>${escapeHtml(topStrength.title)}.</span></div>
                  </li>
                ` : ""}
                ${focusNeeds.length ? `
                  <li class="insight-item">
                    <span class="insight-bullet" aria-hidden="true">→</span>
                    <div><strong>Practice next</strong><span>${focusNeeds.map((need) => escapeHtml(need.title)).join(" · ")}</span></div>
                  </li>
                ` : ""}
              </ul>
              ${pack.uncertainNotes?.length ? `
                <div class="warning-note">
                  <span aria-hidden="true">?</span>
                  <div><strong>Please check:</strong> ${escapeHtml(pack.uncertainNotes.join(" "))}</div>
                </div>
              ` : ""}
            </article>

            <article class="summary-card">
              <div class="card-heading">
                <div class="card-heading-icon" aria-hidden="true">🎯</div>
                <div>
                  <div class="section-kicker">Today’s skills</div>
                  <h2>Pick what to practice</h2>
                </div>
              </div>
              <div class="concept-grid">
                ${(pack.concepts || []).map((concept) => conceptToggleMarkup(concept)).join("")}
              </div>
              <div class="info-note">
                <span aria-hidden="true">💡</span>
                <div>${selectedCount} skill${selectedCount === 1 ? "" : "s"} picked. Questions will look a little different each time.</div>
              </div>
            </article>
          </div>

          <aside class="review-side">
            <article class="summary-card tint-gold">
              <div class="card-heading">
                <div class="card-heading-icon" aria-hidden="true">🧭</div>
                <div>
                  <div class="section-kicker">Simple plan</div>
                  <h3>4 steps to use</h3>
                </div>
              </div>
              <ol class="strategy-list">
                ${(pack.reusableStrategy || []).slice(0, 4).map((step, index) => `
                  <li class="strategy-step">
                    <span class="strategy-step-number">${index + 1}</span>
                    <p>${escapeHtml(step)}</p>
                  </li>
                `).join("")}
              </ol>
            </article>

            <article class="summary-card practice-length-card">
              <div class="section-kicker">Start Charlotte’s session</div>
              <h2>How long today?</h2>
              <p class="panel-description">Her first answer sets the score. Fixing a mistake still counts as learning.</p>
              <div class="session-grid">
                ${sessionButtonMarkup(10, "10 questions", "Quick focus")}
                ${sessionButtonMarkup(20, "20 questions", "Full practice")}
                ${sessionButtonMarkup(50, "50 questions", "Power session")}
                ${sessionButtonMarkup("free", "Free mode", "Keep going")}
              </div>
              <button class="soft-button button-wide" type="button" data-action="back-to-parent" style="margin-top: 12px;">Change photos</button>
            </article>
          </aside>
        </section>
      </main>
    </div>
  `;
}

function conceptToggleMarkup(concept) {
  const selected = state.selectedConcepts.has(concept.id);
  return `
    <button class="concept-toggle ${selected ? "selected" : ""}" type="button" data-action="toggle-concept" data-concept-id="${escapeHtml(concept.id)}" aria-pressed="${selected}">
      <span class="concept-toggle-icon" aria-hidden="true">${escapeHtml(concept.icon || "⭐")}</span>
      <span>
        <strong>${escapeHtml(concept.childFriendlyName || concept.name)}</strong>
        <span>${escapeHtml(concept.description)}</span>
      </span>
      <span class="concept-check" aria-hidden="true">✓</span>
    </button>
  `;
}

function renderLoading() {
  const message = state.analyzing
    ? "Finding the main skills"
    : state.session?.questions?.length
      ? "Preparing the next part of the quest"
      : "Building Charlotte's practice quest";
  const detail = state.analyzing
    ? "Reading the worksheet and Charlotte's work."
    : "Making fresh Grade 3 questions with simple help.";

  return `
    <div class="app-shell">
      ${topbarMarkup({ subtitle: "Getting ready", showProgress: false, showParent: false, showHome: false })}
      <main class="loading-page">
        <section class="loading-card">
          <div class="loading-creature" aria-hidden="true">✦</div>
          <h1>${escapeHtml(message)}</h1>
          <p>${escapeHtml(detail)}</p>
          <div class="loading-dots" aria-hidden="true"><span></span><span></span><span></span></div>
        </section>
      </main>
    </div>
  `;
}

function renderPractice() {
  const session = state.session;
  if (!session) return renderHome();
  const question = session.questions[session.currentIndex];
  if (!question) return renderLoading();

  const response = currentResponse();
  const totalLabel = session.target === null ? `Free question ${session.currentIndex + 1}` : `Question ${session.currentIndex + 1} of ${session.target}`;
  const progressPercent = session.target === null
    ? Math.min(100, ((session.currentIndex % 10) + 1) * 10)
    : clamp(((session.currentIndex + (response?.completed ? 1 : 0)) / session.target) * 100, 2, 100);
  const firstCorrectCount = session.responses.filter((item) => item.firstCorrect).length;

  return `
    <div class="practice-shell">
      <header class="practice-topbar">
        <div class="practice-topbar-inner">
          <button class="practice-close" type="button" data-action="exit-session" aria-label="Leave practice">×</button>
          <div class="practice-progress-wrap">
            <div class="practice-progress-label">
              <strong>${escapeHtml(session.pack.shortTitle || session.pack.title)}</strong>
              <span>${escapeHtml(totalLabel)}</span>
            </div>
            <div class="progress-track" aria-label="Practice progress"><div class="progress-fill" style="width: ${progressPercent}%"></div></div>
          </div>
          <div class="star-counter" aria-label="${firstCorrectCount} correct on first try"><span aria-hidden="true">⭐</span>${firstCorrectCount}</div>
        </div>
      </header>

      <main class="practice-main">
        <article class="question-card">
          <div class="question-concept"><span aria-hidden="true">${escapeHtml(conceptIcon(question.conceptId))}</span>${escapeHtml(question.conceptName)}</div>
          <h1 class="question-prompt">${escapeHtml(question.prompt)}</h1>
          <p class="question-directions">${escapeHtml(question.directions)}</p>
          ${renderQuestionVisual(question.visual)}
          ${renderAnswerArea(question, response)}
          ${renderFeedback(question, response)}
        </article>
        <p class="question-source-note">${session.lastSource === "gemini" ? "Fresh practice shaped by Gemini 3.6 Flash" : "Reliable built-in Grade 3 practice"}</p>
      </main>
    </div>
  `;
}

function renderQuestionVisual(visual) {
  if (!visual || visual.kind === "none") return "";
  if (visual.kind === "groups") {
    const groups = Math.max(0, Math.min(10, Number(visual.groups) || 0));
    const itemsPerGroup = Math.max(0, Math.min(10, Number(visual.itemsPerGroup) || 0));
    const emoji = escapeHtml(visual.itemEmoji || "⭐");
    return `
      <div class="visual-card">
        <div class="groups-visual" aria-label="${groups} groups with ${itemsPerGroup} in each group">
          ${Array.from({ length: groups }, (_, groupIndex) => `
            <div class="group-bubble" aria-label="Group ${groupIndex + 1}">
              ${Array.from({ length: itemsPerGroup }, () => `<span class="group-item" aria-hidden="true">${emoji}</span>`).join("")}
            </div>
          `).join("")}
        </div>
        ${visual.caption ? `<p class="visual-caption">${escapeHtml(visual.caption)}</p>` : ""}
      </div>
    `;
  }

  const rows = Math.max(1, Math.min(12, Number(visual.rows) || 1));
  const columns = Math.max(1, Math.min(12, Number(visual.columns) || 1));
  const emoji = escapeHtml(visual.itemEmoji || "⭐");
  const cells = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const highlightClass =
        visual.highlight === "rows" && row === 0
          ? "array-row-highlight"
          : visual.highlight === "columns" && column === 0
            ? "array-column-highlight"
            : "";
      cells.push(`<span class="array-cell ${highlightClass}" aria-hidden="true">${emoji}</span>`);
    }
  }
  const maxWidth = Math.min(680, columns * 54);
  return `
    <div class="visual-card">
      <div class="array-visual highlight-${escapeHtml(visual.highlight || "none")}" style="grid-template-columns: repeat(${columns}, minmax(0, 1fr)); width: min(100%, ${maxWidth}px);" aria-label="Array with ${rows} rows and ${columns} columns">
        ${cells.join("")}
      </div>
      ${visual.caption ? `<p class="visual-caption">${escapeHtml(visual.caption)}</p>` : ""}
    </div>
  `;
}

function renderAnswerArea(question, response) {
  const completed = Boolean(response?.completed);
  const selected = state.session.currentSelection;
  const lastSubmitted = response?.lastSubmitted || "";

  let controls = "";
  if (question.answer.kind === "choice") {
    controls = `
      <div class="choice-grid" role="radiogroup" aria-label="Answer choices">
        ${(question.choices || []).map((choice, index) => {
          const isSelected = selected === choice.id;
          const isLastWrong = !completed && response && !response.firstCorrect && lastSubmitted === choice.id;
          const isCorrectChoice = completed && choice.id === question.answer.value;
          return `
            <button class="answer-choice ${isSelected ? "selected" : ""} ${isLastWrong ? "wrong-choice" : ""} ${isCorrectChoice ? "correct-choice" : ""}" type="button" data-action="choose-answer" data-answer-value="${escapeHtml(choice.id)}" role="radio" aria-checked="${isSelected}" ${completed ? "disabled" : ""}>
              <span class="choice-marker" aria-hidden="true">${String.fromCharCode(65 + index)}</span>
              <span class="choice-label">${escapeHtml(choice.label)}</span>
            </button>
          `;
        }).join("")}
      </div>
    `;
  } else {
    controls = `
      <div class="number-answer-wrap">
        <label class="sr-only" for="number-answer">Type your answer</label>
        <input id="number-answer" class="number-answer" data-number-answer inputmode="numeric" pattern="[0-9]*" autocomplete="off" enterkeyhint="done" value="${escapeHtml(state.session.currentInput || "")}" ${completed ? "disabled" : ""} aria-label="Type your answer" />
      </div>
    `;
  }

  const hasValue = question.answer.kind === "choice" ? Boolean(selected) : Boolean(String(state.session.currentInput || "").trim());
  const buttonLabel = completed
    ? sessionHasAnotherQuestion() ? "Continue" : "See my results"
    : response && !response.firstCorrect
      ? "Try this answer"
      : "Check answer";
  const buttonAction = completed ? "next-question" : "submit-answer";

  return `
    <div class="answer-area">
      ${controls}
      <div class="practice-action-row">
        ${state.session.target === null ? `<button class="skip-link" type="button" data-action="finish-free">Finish free practice</button>` : `<span></span>`}
        <button class="answer-check-button" type="button" data-action="${buttonAction}" ${!completed && !hasValue ? "disabled" : ""}>
          ${escapeHtml(buttonLabel)} <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  `;
}

function renderFeedback(question, response) {
  if (!response) return "";

  if (response.completed) {
    const recovered = !response.firstCorrect && response.correctedAfterHelp;
    const revealed = response.revealed;
    const heading = response.firstCorrect
      ? "You got it!"
      : recovered
        ? "You fixed it!"
        : "Now you know how it works";
    const message = response.firstCorrect
      ? `The answer is ${question.answerSentence}.`
      : recovered
        ? `Your first score stays the same, and you corrected the idea after using the steps.`
        : `The answer is ${question.answerSentence}. Use the steps again on the next problem.`;
    return `
      <section class="feedback-panel correct" aria-label="Answer feedback">
        <div class="feedback-heading">
          <div class="feedback-icon" aria-hidden="true">${revealed ? "↗" : "✓"}</div>
          <div><h3>${escapeHtml(heading)}</h3><p>${escapeHtml(message)}</p></div>
        </div>
        ${!response.firstCorrect ? `<div class="transfer-tip"><span aria-hidden="true">💡</span><div><strong>Remember:</strong> ${escapeHtml(question.strategy.transferTip)}</div></div>` : ""}
      </section>
    `;
  }

  const attempts = response.attempts || 1;
  return `
    <section class="feedback-panel incorrect" aria-label="Help for this question">
      <div class="feedback-heading">
        <div class="feedback-icon" aria-hidden="true">↻</div>
        <div>
          <h3>${attempts > 1 ? "Let’s try one more step" : "Not yet — let’s work it out"}</h3>
          <p>Your first answer is saved. Now let’s fix it.</p>
        </div>
      </div>
      <div class="explanation-steps">
        ${(question.strategy.steps || []).map((step, index) => `
          <div class="explanation-step">
            <span class="explanation-step-number">${index + 1}</span>
            <div><strong>${escapeHtml(step.title)}</strong><span>${escapeHtml(step.text)}</span></div>
          </div>
        `).join("")}
      </div>
      ${response.deepShown || attempts > 1 ? `
        <div class="deep-explanation"><strong>Why:</strong> ${escapeHtml(question.strategy.deeperExplanation)}</div>
        <div class="transfer-tip"><span aria-hidden="true">💡</span><div><strong>Remember:</strong> ${escapeHtml(question.strategy.transferTip)}</div></div>
      ` : ""}
      <div class="feedback-actions">
        ${!response.deepShown && attempts <= 1 ? `<button class="soft-button button-small" type="button" data-action="show-more-help">Show me more</button>` : ""}
        ${attempts >= 2 ? `<button class="secondary-button button-small" type="button" data-action="reveal-answer">Show the answer</button>` : ""}
      </div>
    </section>
  `;
}

function renderResults() {
  const session = state.session;
  if (!session) return renderHome();
  const completed = session.responses.filter((response) => response.completed || response.firstCorrect !== undefined);
  const total = completed.length;
  const firstCorrect = completed.filter((response) => response.firstCorrect).length;
  const recovered = completed.filter((response) => response.correctedAfterHelp).length;
  const byConcept = summarizeByConcept(completed);
  const strongest = [...byConcept].sort((a, b) => b.accuracy - a.accuracy)[0];
  const practiceNext = [...byConcept].sort((a, b) => a.accuracy - b.accuracy)[0];

  return `
    <div class="app-shell">
      ${topbarMarkup({ subtitle: "Quest complete", showProgress: false, showParent: false, showHome: false })}
      <main class="results-page">
        <section class="results-hero">
          <div class="result-badge" aria-hidden="true">★</div>
          <div class="eyebrow">Quest complete</div>
          <h1>Nice work, Charlotte!</h1>
          <p>You finished the practice and used the explanations to keep learning.</p>
          <div class="score-display" aria-label="${firstCorrect} out of ${total} correct on the first try">
            <span class="score-main">${firstCorrect}</span>
            <span class="score-out-of">/ ${total} first try</span>
          </div>
          <div class="recovery-message"><span aria-hidden="true">🌱</span>${recovered ? `You fixed ${recovered} mistake${recovered === 1 ? "" : "s"} after learning how.` : "Every answered question counted toward your learning."}</div>
        </section>

        <section class="result-grid">
          <article class="result-card">
            <h2>Skill report</h2>
            ${byConcept.length ? byConcept.map((item) => `
              <div class="result-skill-row">
                <span class="result-skill-name">${escapeHtml(item.conceptName)}</span>
                <span class="result-skill-score">${item.correct} / ${item.total}</span>
              </div>
            `).join("") : `<p class="panel-description">Complete more questions to see a skill report.</p>`}
          </article>

          <article class="result-card">
            <h2>What to do next</h2>
            <ul class="result-list">
              ${strongest ? `
                <li class="insight-item">
                  <span class="insight-bullet" aria-hidden="true">✓</span>
                  <div><strong>Strong today</strong><span>${escapeHtml(strongest.conceptName)} — ${strongest.correct} of ${strongest.total} on the first try.</span></div>
                </li>
              ` : ""}
              ${practiceNext ? `
                <li class="insight-item">
                  <span class="insight-bullet" aria-hidden="true">→</span>
                  <div><strong>Practice again</strong><span>${escapeHtml(practiceNext.conceptName)}. Use the same practical steps on a different-looking question.</span></div>
                </li>
              ` : ""}
              <li class="insight-item">
                <span class="insight-bullet" aria-hidden="true">★</span>
                <div><strong>Best learning habit</strong><span>Pause and say what each number means before choosing multiply or divide.</span></div>
              </li>
            </ul>
          </article>
        </section>

        <div class="result-actions">
          <button class="soft-button" type="button" data-action="go-home">Done for now</button>
          <button class="secondary-button" type="button" data-action="repeat-session">Practice this again</button>
          <button class="primary-button" type="button" data-action="start-session" data-length="10">New 10-question quest</button>
        </div>
      </main>
    </div>
  `;
}

function renderProgress() {
  const history = loadHistory();
  const totalSessions = history.length;
  const totalQuestions = history.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalCorrect = history.reduce((sum, item) => sum + (item.firstCorrect || 0), 0);
  const average = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return `
    <div class="app-shell">
      ${topbarMarkup({ subtitle: "Charlotte's local progress", showProgress: false, showParent: true, showHome: false })}
      <main class="page page-narrow">
        <div class="page-heading">
          <div>
            <div class="eyebrow">Parent view</div>
            <h1>Practice progress</h1>
            <p>This stays in this browser. It separates first-try accuracy from questions Charlotte corrected after using the explanation.</p>
          </div>
        </div>

        <section class="progress-summary-grid">
          <article class="stat-card"><span>Sessions</span><strong>${totalSessions}</strong></article>
          <article class="stat-card"><span>Questions answered</span><strong>${totalQuestions}</strong></article>
          <article class="stat-card"><span>First-try accuracy</span><strong>${average}%</strong></article>
        </section>

        <section class="panel-card">
          <div class="card-heading">
            <div class="card-heading-icon" aria-hidden="true">📈</div>
            <div><div class="section-kicker">Recent work</div><h2>Session history</h2></div>
          </div>
          ${history.length ? `
            <div class="history-list">
              ${history.slice(0, 20).map((entry) => `
                <article class="history-card">
                  <div class="history-icon" aria-hidden="true">${escapeHtml(entry.icon || "⭐")}</div>
                  <div>
                    <strong>${escapeHtml(entry.title || "Practice session")}</strong>
                    <span>${escapeHtml(formatDate(entry.completedAt))} · ${entry.recovered || 0} corrected after help</span>
                  </div>
                  <div class="history-score">${entry.firstCorrect || 0}/${entry.total || 0}</div>
                </article>
              `).join("")}
            </div>
          ` : `
            <div class="empty-state">
              <div class="empty-state-icon" aria-hidden="true">🌱</div>
              <h2>No completed sessions yet</h2>
              <p>Charlotte's first completed quest will appear here.</p>
              <button class="primary-button" type="button" data-action="start-session" data-length="10">Start 10 questions</button>
            </div>
          `}
          ${history.length ? `<div class="panel-footer"><button class="danger-button button-small" type="button" data-action="clear-progress">Clear local progress</button></div>` : ""}
        </section>
      </main>
    </div>
  `;
}

function renderModal() {
  if (!state.modal) return "";
  if (state.modal.type === "exit-session") {
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="exit-title">
          <h2 id="exit-title">Leave this practice?</h2>
          <p>Your unfinished session will not be added to progress. Charlotte can start a fresh session from the home screen.</p>
          <div class="modal-actions">
            <button class="soft-button button-small" type="button" data-action="close-modal">Keep practicing</button>
            <button class="danger-button button-small" type="button" data-action="confirm-exit-session">Leave session</button>
          </div>
        </section>
      </div>
    `;
  }

  if (state.modal.type === "clear-progress") {
    return `
      <div class="modal-backdrop" role="presentation">
        <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="clear-title">
          <h2 id="clear-title">Clear Charlotte's local progress?</h2>
          <p>This removes saved session history and returns the learning set to Charlotte's current concept mission.</p>
          <div class="modal-actions">
            <button class="soft-button button-small" type="button" data-action="close-modal">Cancel</button>
            <button class="danger-button button-small" type="button" data-action="confirm-clear-progress">Clear data</button>
          </div>
        </section>
      </div>
    `;
  }

  return "";
}

async function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  switch (action) {
    case "go-home":
      state.modal = null;
      state.screen = "home";
      if (state.session?.completed) state.session = null;
      render();
      break;

    case "show-progress":
      state.screen = "progress";
      render();
      break;

    case "open-parent":
      state.screen = "parent";
      state.modal = null;
      render();
      break;

    case "back-to-parent":
      state.screen = "parent";
      render();
      break;

    case "use-sample-pack":
      state.pack = cloneSamplePack();
      saveLearningPack(state.pack);
      resetSelectedConcepts();
      state.screen = "review";
      showToast("Charlotte's multiply and divide mission is ready.", "success");
      render();
      break;

    case "remove-image":
      state.uploadImages = state.uploadImages.filter((image) => image.id !== target.dataset.imageId);
      render();
      break;

    case "analyze-images":
      await analyzeSelectedImages();
      break;

    case "toggle-concept":
      toggleConcept(target.dataset.conceptId);
      break;

    case "start-session":
      await startSession(target.dataset.length);
      break;

    case "choose-answer":
      chooseAnswer(target.dataset.answerValue);
      break;

    case "submit-answer":
      submitCurrentAnswer();
      break;

    case "next-question":
      await goToNextQuestion();
      break;

    case "show-more-help":
      showMoreHelp();
      break;

    case "reveal-answer":
      revealCurrentAnswer();
      break;

    case "finish-free":
      finishSession();
      break;

    case "exit-session":
      state.modal = { type: "exit-session" };
      render();
      break;

    case "close-modal":
      state.modal = null;
      render();
      break;

    case "confirm-exit-session":
      state.modal = null;
      state.session = null;
      state.screen = "home";
      render();
      break;

    case "clear-progress":
      state.modal = { type: "clear-progress" };
      render();
      break;

    case "confirm-clear-progress":
      clearAllLocalData();
      state.pack = cloneSamplePack();
      state.settings = loadSettings();
      state.session = null;
      resetSelectedConcepts();
      state.modal = null;
      state.screen = "progress";
      showToast("Local progress was cleared.");
      render();
      break;

    case "repeat-session":
      await startSession(state.session?.mode || "10");
      break;

    default:
      break;
  }
}

function handleChange(event) {
  const input = event.target;
  if (input.matches("#camera-input, #library-input") && input.files?.length) {
    handleSelectedFiles(input.files);
    input.value = "";
  }
}

function handleInput(event) {
  if (event.target.matches("[data-number-answer]") && state.session) {
    state.session.currentInput = event.target.value.replace(/[^0-9-]/g, "").slice(0, 5);
    const button = document.querySelector('[data-action="submit-answer"]');
    if (button) button.disabled = !state.session.currentInput.trim();
  }
}

function handleKeydown(event) {
  if (state.screen !== "practice" || event.key !== "Enter") return;
  if (state.modal) return;
  const response = currentResponse();
  if (response?.completed) {
    event.preventDefault();
    goToNextQuestion();
    return;
  }
  const question = currentQuestion();
  const hasAnswer = question?.answer?.kind === "choice"
    ? Boolean(state.session?.currentSelection)
    : Boolean(state.session?.currentInput?.trim());
  if (hasAnswer) {
    event.preventDefault();
    submitCurrentAnswer();
  }
}

async function handleSelectedFiles(fileList) {
  if (state.processingImages) return;
  const remaining = Math.max(0, 8 - state.uploadImages.length);
  if (!remaining) {
    showToast("You can analyze up to 8 pages at a time.", "error");
    return;
  }

  state.processingImages = true;
  render();
  try {
    const selected = [...fileList].slice(0, remaining);
    const prepared = await prepareImageFiles(selected, ({ current, total }) => {
      showToast(`Preparing page ${current} of ${total}…`, "default", 1200);
    });
    state.uploadImages.push(...prepared);
    showToast(`${prepared.length} photo${prepared.length === 1 ? "" : "s"} ready.`, "success");
  } catch (error) {
    showToast(error?.message || "A photo could not be prepared.", "error");
  } finally {
    state.processingImages = false;
    render();
  }
}

async function analyzeSelectedImages() {
  if (!state.uploadImages.length || state.analyzing) return;
  state.analyzing = true;
  state.screen = "loading";
  render();
  try {
    const result = await analyzeHomework(state.uploadImages);
    state.pack = result.pack;
    saveLearningPack(state.pack);
    resetSelectedConcepts();
    state.uploadImages = [];
    state.screen = "review";
    showToast("The learning concepts are ready to review.", "success");
  } catch (error) {
    state.screen = "parent";
    const message = error?.code === "MISSING_API_KEY"
      ? "Add your Gemini API key to .env.local, then restart the app."
      : error?.message || "The pages could not be analyzed yet.";
    showToast(message, "error", 5200);
  } finally {
    state.analyzing = false;
    render();
  }
}

function toggleConcept(conceptId) {
  if (!conceptId) return;
  if (state.selectedConcepts.has(conceptId)) {
    if (state.selectedConcepts.size === 1) {
      showToast("Keep at least one concept selected.");
      return;
    }
    state.selectedConcepts.delete(conceptId);
  } else {
    state.selectedConcepts.add(conceptId);
  }
  render();
}

async function startSession(lengthValue) {
  const mode = String(lengthValue || "10");
  const target = mode === "free" ? null : clamp(Number.parseInt(mode, 10) || 10, 1, 50);
  const conceptIds = [...state.selectedConcepts];
  if (!conceptIds.length) {
    resetSelectedConcepts();
  }

  state.session = {
    id: crypto.randomUUID?.() || `session-${Date.now()}`,
    mode,
    target,
    pack: JSON.parse(JSON.stringify(state.pack || CHARLOTTE_SAMPLE_PACK)),
    conceptIds: [...state.selectedConcepts],
    questions: [],
    responses: [],
    currentIndex: 0,
    currentSelection: "",
    currentInput: "",
    generating: false,
    fetchPromise: null,
    lastSource: "gemini",
    sourceWarnings: [],
    startedAt: new Date().toISOString(),
    completed: false,
    historySaved: false
  };

  state.screen = "loading";
  render();

  try {
    await fetchNextBatch();
    if (!state.session?.questions?.length) throw new Error("No practice questions were created.");
    state.screen = "practice";
    render();
    prefetchIfNeeded();
  } catch (error) {
    showToast(error?.message || "The practice session could not start.", "error");
    state.session = null;
    state.screen = "home";
    render();
  }
}

async function fetchNextBatch() {
  const session = state.session;
  if (!session) return [];
  if (session.generating && session.fetchPromise) return session.fetchPromise;

  const remaining = session.target === null
    ? 10
    : Math.max(0, session.target - session.questions.length);
  if (remaining <= 0) return [];
  const count = Math.min(10, remaining);
  const startingIndex = session.questions.length;
  const avoidFingerprints = session.questions.map((question) => question.fingerprint);

  session.generating = true;
  session.fetchPromise = (async () => {
    try {
      const result = await generateQuestionBatch({
        pack: session.pack,
        selectedConcepts: session.conceptIds,
        count,
        startingIndex,
        avoidFingerprints,
        performanceSummary: buildPerformanceSummary(session.responses)
      });
      const existing = new Set(avoidFingerprints);
      const fresh = (result.questions || []).filter((question) => !existing.has(question.fingerprint));
      session.questions.push(...fresh.slice(0, count));
      session.lastSource = result.source || "gemini";
      if (result.warning) session.sourceWarnings.push(result.warning);
      return fresh;
    } catch (error) {
      session.lastSource = "gemini-error";
      session.sourceWarnings.push(
        error?.message || "Gemini could not create practice questions."
      );
      return [];
    } finally {
      if (state.session === session) {
        session.generating = false;
        session.fetchPromise = null;
      }
    }
  })();

  return session.fetchPromise;
}

function chooseAnswer(value) {
  const response = currentResponse();
  if (!state.session || response?.completed) return;
  state.session.currentSelection = String(value || "");
  render();
}

function submitCurrentAnswer() {
  const session = state.session;
  const question = currentQuestion();
  if (!session || !question) return;

  const submittedValue = question.answer.kind === "choice"
    ? session.currentSelection
    : session.currentInput;
  if (!String(submittedValue || "").trim()) return;

  let response = currentResponse();
  if (!response) {
    response = {
      questionId: question.id,
      conceptId: question.conceptId,
      conceptName: question.conceptName,
      firstCorrect: undefined,
      firstAnswer: "",
      lastSubmitted: "",
      attempts: 0,
      correctedAfterHelp: false,
      completed: false,
      revealed: false,
      deepShown: false
    };
    session.responses.push(response);
  }

  if (response.completed) return;
  const correct = isAnswerCorrect(question, submittedValue);
  response.attempts += 1;
  response.lastSubmitted = String(submittedValue);

  if (response.firstCorrect === undefined) {
    response.firstCorrect = correct;
    response.firstAnswer = String(submittedValue);
  }

  if (correct) {
    response.completed = true;
    response.correctedAfterHelp = response.firstCorrect === false;
    playSuccessTone(state.settings.soundEnabled);
    if (response.firstCorrect) burstConfetti(14);
  } else {
    response.deepShown = response.deepShown || response.attempts >= 2;
    session.currentSelection = "";
    session.currentInput = "";
  }

  render();
  if (!response.completed) focusAnswerControl();
  prefetchIfNeeded();
}

function showMoreHelp() {
  const response = currentResponse();
  if (!response || response.completed) return;
  response.deepShown = true;
  render();
}

function revealCurrentAnswer() {
  const session = state.session;
  const question = currentQuestion();
  const response = currentResponse();
  if (!session || !question || !response || response.completed) return;
  response.completed = true;
  response.revealed = true;
  response.correctedAfterHelp = false;
  response.deepShown = true;
  if (question.answer.kind === "choice") session.currentSelection = question.answer.value;
  else session.currentInput = question.answer.value;
  render();
}

async function goToNextQuestion() {
  const session = state.session;
  const response = currentResponse();
  if (!session || !response?.completed) return;

  const isFinalFixedQuestion = session.target !== null && session.currentIndex >= session.target - 1;
  if (isFinalFixedQuestion) {
    finishSession();
    return;
  }

  session.currentIndex += 1;
  resetCurrentAnswerState();

  if (!session.questions[session.currentIndex]) {
    state.screen = "loading";
    render();
    await fetchNextBatch();
    state.screen = "practice";
  }

  if (!session.questions[session.currentIndex]) {
    showToast("The next question could not be prepared. Your completed work is saved in this result.", "error");
    finishSession();
    return;
  }

  render();
  prefetchIfNeeded();
}

function prefetchIfNeeded() {
  const session = state.session;
  if (!session || session.generating) return;
  const bufferedAhead = session.questions.length - session.currentIndex - 1;
  const hasMore = session.target === null || session.questions.length < session.target;
  if (hasMore && bufferedAhead <= 3) {
    fetchNextBatch().then(() => {
      if (state.screen === "loading" && state.session?.questions[state.session.currentIndex]) {
        state.screen = "practice";
        render();
      }
    });
  }
}

function finishSession() {
  const session = state.session;
  if (!session) return;
  const answered = session.responses.filter((response) => response.firstCorrect !== undefined);
  if (!answered.length) {
    state.session = null;
    state.screen = "home";
    render();
    return;
  }

  session.completed = true;
  session.completedAt = new Date().toISOString();
  if (!session.historySaved) {
    const firstCorrect = answered.filter((response) => response.firstCorrect).length;
    const recovered = answered.filter((response) => response.correctedAfterHelp).length;
    addHistoryEntry({
      id: session.id,
      completedAt: session.completedAt,
      title: session.pack.shortTitle || session.pack.title,
      icon: session.pack.concepts?.[0]?.icon || "⭐",
      total: answered.length,
      firstCorrect,
      recovered,
      mode: session.mode,
      byConcept: summarizeByConcept(answered)
    });
    session.historySaved = true;
  }
  state.screen = "results";
  burstConfetti(60);
  render();
}

function resetCurrentAnswerState() {
  if (!state.session) return;
  state.session.currentSelection = "";
  state.session.currentInput = "";
}

function focusAnswerControl() {
  window.setTimeout(() => {
    const numberInput = document.querySelector("[data-number-answer]");
    if (numberInput) {
      numberInput.focus();
      return;
    }
    const choice = document.querySelector(".answer-choice:not([disabled])");
    choice?.focus();
  }, 80);
}

function currentQuestion() {
  return state.session?.questions?.[state.session.currentIndex] || null;
}

function currentResponse() {
  const question = currentQuestion();
  if (!question) return null;
  return state.session?.responses?.find((response) => response.questionId === question.id) || null;
}

function sessionHasAnotherQuestion() {
  const session = state.session;
  if (!session) return false;
  return session.target === null || session.currentIndex < session.target - 1;
}

function resetSelectedConcepts() {
  state.selectedConcepts = new Set(
    (state.pack?.concepts || [])
      .filter((concept) => concept.selectedByDefault !== false)
      .map((concept) => concept.id)
  );
  if (!state.selectedConcepts.size && state.pack?.concepts?.[0]?.id) {
    state.selectedConcepts.add(state.pack.concepts[0].id);
  }
}

function summarizeByConcept(responses) {
  const map = new Map();
  for (const response of responses || []) {
    const id = response.conceptId || "practice";
    const current = map.get(id) || {
      conceptId: id,
      conceptName: response.conceptName || "Practice skill",
      total: 0,
      correct: 0,
      recovered: 0,
      accuracy: 0
    };
    current.total += 1;
    if (response.firstCorrect) current.correct += 1;
    if (response.correctedAfterHelp) current.recovered += 1;
    current.accuracy = current.total ? current.correct / current.total : 0;
    map.set(id, current);
  }
  return [...map.values()].sort((a, b) => b.total - a.total || a.conceptName.localeCompare(b.conceptName));
}

function buildPerformanceSummary(responses) {
  const byConcept = summarizeByConcept(responses);
  if (!byConcept.length) return { answered: 0, note: "No answered questions yet." };
  return {
    answered: responses.length,
    firstCorrect: responses.filter((response) => response.firstCorrect).length,
    correctedAfterHelp: responses.filter((response) => response.correctedAfterHelp).length,
    byConcept: byConcept.map((item) => ({
      conceptId: item.conceptId,
      conceptName: item.conceptName,
      firstTryCorrect: item.correct,
      attempted: item.total,
      firstTryAccuracy: Math.round(item.accuracy * 100)
    }))
  };
}

function conceptIcon(conceptId) {
  return state.session?.pack?.concepts?.find((concept) => concept.id === conceptId)?.icon ||
    state.pack?.concepts?.find((concept) => concept.id === conceptId)?.icon ||
    "⭐";
}

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  try {
    await navigator.serviceWorker.register("/sw.js");
  } catch {
    // The app still works normally without installation support.
  }
}
