import { WORDS } from "./words.js";

const $ = (sel) => document.querySelector(sel);

const state = {
  pool: [],
  current: null,
  currentDirection: "en-de",
  answered: false,
  mustWriteCorrectly: false,
  correct: 0,
  total: 0,
  recentIds: [],
};

function getSelectedTypes() {
  return [...document.querySelectorAll('input[name="type"]:checked')].map(
    (el) => el.value
  );
}

function getDirectionSetting() {
  return document.querySelector('input[name="direction"]:checked')?.value ?? "en-de";
}

function wordKey(word) {
  return `${word.type}:${word.german}`;
}

function buildPool() {
  const types = new Set(getSelectedTypes());
  state.pool = WORDS.filter((w) => types.has(w.type));
  updatePoolCount();
}

const TYPE_LABELS = {
  verb: "verbs",
  noun: "nouns",
  adjective: "adjectives",
  conjunction: "conjunctions",
  number: "numbers",
  adverb: "adverbs",
  interjection: "interjections",
  preposition: "prepositions",
};

function updatePoolCount() {
  const types = getSelectedTypes();
  const counts = Object.fromEntries(
    Object.keys(TYPE_LABELS).map((type) => [type, 0])
  );
  for (const w of WORDS) {
    if (types.includes(w.type)) counts[w.type]++;
  }
  const parts = types
    .filter((type) => counts[type] > 0)
    .map((type) => `${counts[type]} ${TYPE_LABELS[type]}`);
  $("#pool-count").textContent =
    state.pool.length === 0
      ? "No words — enable a word type"
      : `${state.pool.length} words (${parts.join(", ")})`;
}

function pickDirection() {
  const setting = getDirectionSetting();
  if (setting === "mixed") {
    return Math.random() < 0.5 ? "en-de" : "de-en";
  }
  return setting;
}

function pickWord() {
  if (state.pool.length === 0) {
    state.current = null;
    return;
  }

  const recentSet = new Set(state.recentIds.slice(-8));
  let candidates = state.pool.filter((w) => !recentSet.has(wordKey(w)));
  if (candidates.length === 0) candidates = state.pool;

  const word = candidates[Math.floor(Math.random() * candidates.length)];
  state.recentIds.push(wordKey(word));
  state.current = word;
  state.currentDirection = pickDirection();
  state.answered = false;
  state.mustWriteCorrectly = false;
}

function germanDisplay(word) {
  if (word.type === "noun" && word.article) {
    return `${word.article} ${word.german}`;
  }
  return word.german;
}

function expectedGerman(word) {
  if (word.type === "noun" && word.article) {
    return `${word.article} ${word.german}`;
  }
  return word.german;
}

function normalizeGerman(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/ae/g, "ä")
    .replace(/oe/g, "ö")
    .replace(/ue/g, "ü")
    .replace(/ss\b/g, "ß");
}

function normalizeEnglish(text) {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function englishVariants(word) {
  return word.english.split(",").map((part) => {
    let v = normalizeEnglish(part);
    if (v.startsWith("to ")) {
      return [v, v.slice(3)];
    }
    return [v, "to " + v];
  });
}

function checkEnglishAnswer(input, word) {
  const normalized = normalizeEnglish(input);
  return englishVariants(word).some(([a, b]) => {
    return normalized === a || normalized === b;
  });
}

function checkGermanAnswer(input, word) {
  const normalized = normalizeGerman(input);
  const expected = normalizeGerman(expectedGerman(word));

  if (word.type === "noun") {
    return normalized === expected;
  }

  return normalized === normalizeGerman(word.german);
}

function isAnswerCorrect(input, word, dir) {
  return dir === "en-de"
    ? checkGermanAnswer(input, word)
    : checkEnglishAnswer(input, word);
}

function expectedAnswer(word, dir) {
  return dir === "en-de" ? expectedGerman(word) : word.english;
}

function retryPlaceholder(dir) {
  return dir === "en-de"
    ? "Type the correct German answer…"
    : "Type the correct English answer…";
}

function renderCard() {
  const word = state.current;
  const feedback = $("#feedback");
  feedback.classList.add("hidden");
  feedback.className = "feedback hidden";
  $("#answer-input").value = "";
  $("#answer-input").disabled = false;
  $("#check-btn").disabled = false;
  $("#check-btn").textContent = "Check";
  $("#reveal-btn").disabled = false;

  if (!word) {
    $("#prompt").textContent = "No words available";
    $("#prompt-label").textContent = "Adjust filters";
    $("#type-badge").textContent = "—";
    $("#direction-badge").textContent = "—";
    $("#answer-input").disabled = true;
    $("#check-btn").disabled = true;
    $("#reveal-btn").disabled = true;
    return;
  }

  const dir = state.currentDirection;
  $("#type-badge").textContent = word.type;
  $("#direction-badge").textContent = dir === "en-de" ? "EN → DE" : "DE → EN";

  const nounHint = $("#noun-hint");
  if (dir === "en-de" && word.type === "noun") {
    nounHint.classList.remove("hidden");
    $("#answer-input").placeholder = "e.g. der Mann";
  } else {
    nounHint.classList.add("hidden");
    $("#answer-input").placeholder =
      dir === "en-de" ? "Type in German…" : "Type in English…";
  }

  if (dir === "en-de") {
    $("#prompt-label").textContent = "Translate to German";
    $("#prompt").textContent = word.english;
  } else {
    $("#prompt-label").textContent = "Translate to English";
    $("#prompt").textContent = germanDisplay(word);
  }

  $("#answer-input").focus();
}

function showFeedback(type, html) {
  const feedback = $("#feedback");
  feedback.className = `feedback ${type}`;
  feedback.innerHTML = html;
  feedback.classList.remove("hidden");
}

function requireCorrectRewrite(feedbackType, messageHtml) {
  const dir = state.currentDirection;
  state.answered = true;
  state.mustWriteCorrectly = true;
  showFeedback(
    feedbackType,
    `${messageHtml}<br><span class="retry-hint">Type the correct answer below to continue.</span>`
  );
  $("#answer-input").value = "";
  $("#answer-input").disabled = false;
  $("#answer-input").placeholder = retryPlaceholder(dir);
  $("#check-btn").textContent = "Check";
  $("#reveal-btn").disabled = true;
  $("#answer-input").focus();
}

function checkAnswer() {
  if (!state.current || state.answered) return;

  const input = $("#answer-input").value;
  if (!input.trim()) return;

  const word = state.current;
  const dir = state.currentDirection;
  const isCorrect = isAnswerCorrect(input, word, dir);

  state.answered = true;
  state.total++;
  if (isCorrect) state.correct++;
  $("#score").textContent = `${state.correct} / ${state.total} correct`;

  if (isCorrect) {
    showFeedback("correct", "Correct!");
    $("#check-btn").textContent = "Next";
    $("#answer-input").disabled = true;
    $("#reveal-btn").disabled = true;
  } else {
    const answer = expectedAnswer(word, dir);
    requireCorrectRewrite(
      "incorrect",
      `Not quite. Correct answer: <strong>${escapeHtml(answer)}</strong>`
    );
  }
}

function checkRetryAnswer() {
  if (!state.current || !state.mustWriteCorrectly) return;

  const input = $("#answer-input").value;
  if (!input.trim()) return;

  const word = state.current;
  const dir = state.currentDirection;
  const isCorrect = isAnswerCorrect(input, word, dir);

  if (isCorrect) {
    state.mustWriteCorrectly = false;
    showFeedback("correct", "Correct! You can move on.");
    $("#check-btn").textContent = "Next";
    $("#answer-input").disabled = true;
  } else {
    const answer = expectedAnswer(word, dir);
    showFeedback(
      "incorrect",
      `Keep trying. Correct answer: <strong>${escapeHtml(answer)}</strong><br><span class="retry-hint">Type the correct answer below to continue.</span>`
    );
    $("#answer-input").focus();
  }
}

function revealAnswer() {
  if (!state.current || (state.answered && !state.mustWriteCorrectly)) return;

  const word = state.current;
  const dir = state.currentDirection;
  const answer = expectedAnswer(word, dir);

  if (!state.answered) {
    state.total++;
    $("#score").textContent = `${state.correct} / ${state.total} correct`;
  }

  requireCorrectRewrite(
    "revealed",
    `Answer: <strong>${escapeHtml(answer)}</strong>`
  );
}

function skipWord() {
  if (!state.current) return;
  if (!state.answered) {
    state.total++;
    $("#score").textContent = `${state.correct} / ${state.total} correct`;
  }
  nextWord();
}

function nextWord() {
  pickWord();
  renderCard();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function onSettingsChange() {
  buildPool();
  nextWord();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const base = import.meta.url.replace(/\/js\/app\.js.*$/, "/");
  navigator.serviceWorker.register(new URL("../sw.js", import.meta.url), {
    scope: base,
  }).catch(() => {});
}

let deferredInstallPrompt = null;

function registerInstallPrompt() {
  const installBtn = $("#install-btn");
  if (!installBtn) return;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  if (isStandalone) return;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installBtn.classList.remove("hidden");
  });

  installBtn.addEventListener("click", async () => {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.classList.add("hidden");
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    installBtn.classList.add("hidden");
  });
}

$("#answer-form").addEventListener("submit", (e) => {
  e.preventDefault();
  if (state.mustWriteCorrectly) {
    checkRetryAnswer();
  } else if (state.answered) {
    nextWord();
  } else {
    checkAnswer();
  }
});

$("#skip-btn").addEventListener("click", skipWord);
$("#reveal-btn").addEventListener("click", revealAnswer);

document.querySelectorAll('input[name="direction"]').forEach((el) => {
  el.addEventListener("change", onSettingsChange);
});

document.querySelectorAll('input[name="type"]').forEach((el) => {
  el.addEventListener("change", onSettingsChange);
});

buildPool();
pickWord();
renderCard();
registerServiceWorker();
registerInstallPrompt();
