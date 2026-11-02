const messageInput = document.querySelector("#message-input");
const charCount = document.querySelector("#char-count");
const analyzeButton = document.querySelector("#analyze-button");
const exampleButton = document.querySelector("#example-button");
const riskBadge = document.querySelector("#risk-badge");
const riskMeter = document.querySelector("#risk-meter");
const resultTitle = document.querySelector("#result-title");
const resultSummary = document.querySelector("#result-summary");
const warningFindings = document.querySelector("#warning-findings");
const findingCount = document.querySelector("#finding-count");
const nextStepsList = document.querySelector("#next-steps-list");
const loginDialog = document.querySelector("#login-dialog");
const imageUpload = document.querySelector("#image-upload");
const cameraUpload = document.querySelector("#camera-upload");
const extractImageTextButton = document.querySelector("#extract-image-text");
const imagePreviewWrap = document.querySelector("#image-preview-wrap");
const imagePreview = document.querySelector("#image-preview");
const imageFileName = document.querySelector("#image-file-name");
const imageMessage = document.querySelector("#image-message");
const imageCharCount = document.querySelector("#image-char-count");
const scanStatus = document.querySelector("#scan-status");
const quizQuestion = document.querySelector("#quiz-question");
const quizProgress = document.querySelector("#quiz-progress");
const quizOptions = document.querySelector("#quiz-options");
const quizFeedback = document.querySelector("#quiz-feedback");
const quizNext = document.querySelector("#quiz-next");

const dailyTips = [
  {
    title: "Check who really sent it.",
    copy: "Compare the sender's email and social account with contact details on the organization's official website. A familiar logo isn't proof.",
  },
  {
    title: "A real job shouldn't cost you.",
    copy: "Pause if an internship or job asks you to pay for training, equipment, or a place in line. Verify the offer with the employer independently.",
  },
  {
    title: "Give exciting offers a second look.",
    copy: "Unexpected scholarships and instant job offers can be designed to rush you. Look up the official application process before sharing details.",
  },
  {
    title: "Look closely at the web address.",
    copy: "Unexpected links can lead to look-alike login pages. Visit the organization's website by typing its address yourself.",
  },
  {
    title: "Never share a sign-in code.",
    copy: "A verification code is like a temporary key to your account. Don't share it with a recruiter, scholarship contact, or anyone who asks.",
  },
  {
    title: "Slow down when someone creates urgency.",
    copy: "Pressure to act immediately is a reason to pause. Talk to someone you trust and confirm the offer through an official channel.",
  },
  {
    title: "Keep personal documents private.",
    copy: "Don't send identity or banking details to an unverified contact. Confirm why information is needed and who will receive it.",
  },
];

const quizQuestions = [
  {
    question: "A recruiter says you got the internship but must pay a fee today. What should you do?",
    options: ["Pay quickly to hold your spot", "Verify with the company using its official contact details", "Send your bank details instead"],
    answer: 1,
    feedback: "Correct. Verify the offer independently, and be very cautious of upfront fees for a job.",
  },
  {
    question: "You receive an unexpected scholarship link asking you to sign in. What's safest?",
    options: ["Open it and enter your password", "Forward it to friends to ask if it's real", "Find the scholarship on the official organization website"],
    answer: 2,
    feedback: "Correct. Visit the official site yourself rather than trusting an unexpected link.",
  },
  {
    question: "Someone claiming to be a recruiter asks for your verification code. Should you share it?",
    options: ["No. Keep verification codes private", "Yes, if they have a company logo", "Only if they say the offer expires soon"],
    answer: 0,
    feedback: "Correct. Never share a verification code. A legitimate recruiter doesn't need it.",
  },
];

let quizIndex = 0;
let quizScore = 0;
let imageObjectUrl = null;
let selectedImage = null;
let ocrLibraryPromise = null;

const progressStorageKey = "scam-shield-learning-progress";
const reportsStorageKey = "scam-shield-saved-reports";

function getProgress() {
  const savedProgress = localStorage.getItem(progressStorageKey);
  return savedProgress
    ? JSON.parse(savedProgress)
    : { checks: 0, quizCompletions: 0, bestQuiz: 0, latestQuiz: 0, completedLessons: [], checklist: {} };
}

function saveProgress(progress) {
  localStorage.setItem(progressStorageKey, JSON.stringify(progress));
  renderProfile();
}

function getSavedReports() {
  const savedReports = localStorage.getItem(reportsStorageKey);
  return savedReports ? JSON.parse(savedReports) : [];
}

function updateGreeting() {
  const hour = new Date().getHours();
  document.querySelector("#greeting-text").textContent =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function updateStudentName(name) {
  const cleanName = name.trim().slice(0, 30) || "Student";
  document.querySelector("#student-name").textContent = cleanName;
  localStorage.setItem("scam-shield-student-name", cleanName);
  document.querySelector("#profile-name-input").value = cleanName === "Student" ? "" : cleanName;
}

function showDailyTip() {
  const today = new Date();
  const dayNumber = Math.floor(
    Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 86400000,
  );
  const tip = dailyTips[((dayNumber % dailyTips.length) + dailyTips.length) % dailyTips.length];

  document.querySelector("#tip-title").textContent = tip.title;
  document.querySelector("#tip-copy").textContent = tip.copy;
  document.querySelector("#tip-date").textContent = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(today);
  document.querySelector("#tips-daily-title").textContent = tip.title;
  document.querySelector("#tips-daily-copy").textContent = tip.copy;
  document.querySelector("#tips-daily-date").textContent = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(today);
}

function renderQuizQuestion() {
  const question = quizQuestions[quizIndex];
  quizProgress.textContent = `QUESTION ${quizIndex + 1} OF ${quizQuestions.length}`;
  const savedProgress = getProgress();
  document.querySelector("#quiz-score-note").textContent = savedProgress.quizCompletions
    ? `Best score so far: ${savedProgress.bestQuiz} of ${quizQuestions.length}.`
    : "Your progress is saved on this device.";
  quizQuestion.textContent = question.question;
  quizOptions.replaceChildren();
  quizFeedback.textContent = "";
  quizNext.hidden = true;
  quizNext.textContent = quizIndex === quizQuestions.length - 1 ? "See your score" : "Next question";

  question.options.forEach((option, optionIndex) => {
    const button = document.createElement("button");
    button.className = "quiz-option";
    button.type = "button";
    button.textContent = option;
    button.addEventListener("click", () => {
      const isCorrect = optionIndex === question.answer;
      if (isCorrect) quizScore += 1;
      quizOptions.querySelectorAll("button").forEach((answerButton, answerIndex) => {
        answerButton.disabled = true;
        if (answerIndex === question.answer) answerButton.classList.add("correct");
      });
      if (!isCorrect) button.classList.add("incorrect");
      quizFeedback.textContent = isCorrect
        ? question.feedback
        : `Not quite. ${question.feedback}`;
      quizNext.hidden = false;
    });
    quizOptions.append(button);
  });
}

function showQuizResult() {
  quizProgress.textContent = "QUIZ COMPLETE";
  quizQuestion.textContent = `You got ${quizScore} out of ${quizQuestions.length} right!`;
  quizOptions.replaceChildren();
  quizFeedback.textContent =
    quizScore === quizQuestions.length
      ? "Excellent work—you know how to pause and check."
      : "Keep practicing. Reviewing the scam tips can help you spot warning signs.";
  quizNext.textContent = "Try again";
  quizNext.hidden = false;
  const progress = getProgress();
  progress.quizCompletions += 1;
  progress.latestQuiz = quizScore;
  progress.bestQuiz = Math.max(progress.bestQuiz, quizScore);
  saveProgress(progress);
}

function releaseImagePreview() {
  if (imageObjectUrl) {
    URL.revokeObjectURL(imageObjectUrl);
    imageObjectUrl = null;
  }
  selectedImage = null;
}

const screenElements = {
  welcome: document.querySelector("#welcome"),
  dashboard: document.querySelector("#dashboard-view"),
  learn: document.querySelector("#learn"),
  check: document.querySelector("#check-view"),
  analysis: document.querySelector("#analysis-view"),
  scan: document.querySelector("#scan-view"),
  quiz: document.querySelector("#quiz-view"),
  tips: document.querySelector("#tips-view"),
  report: document.querySelector("#report-view"),
  profile: document.querySelector("#profile-view"),
};

function showScreen(screenName) {
  const activeScreen = screenElements[screenName];
  if (!activeScreen) throw new Error(`Unknown screen: ${screenName}`);
  for (const [name, element] of Object.entries(screenElements)) {
    element.hidden = name !== screenName;
  }
  document.body.classList.toggle("dashboard-active", screenName !== "welcome");
  if (screenName === "profile") renderProfile();
  if (screenName === "tips") renderLessonsAndChecklist();
  if (screenName === "report") renderSavedReports();
  window.scrollTo(0, 0);
}

const warningChecks = [
  {
    label: "Asks for an upfront fee, deposit, or payment to access an opportunity.",
    explanation: "Legitimate employers and scholarship providers generally do not require payment to secure an offer or award. A fee request can be a way to take your money.",
    nextStep: "Do not pay. Verify the fee policy directly with the organization using contact details from its official website.",
    pattern: /\b(upfront fee|registration fee|processing fee|application fee|pay (?:a |the )?(?:fee|deposit)|send (?:money|payment)|wire transfer|gift card|crypto(?:currency)?)\b/i,
    weight: 3,
  },
  {
    label: "Uses pressure or a deadline to rush your decision.",
    explanation: "Scammers may use urgency to stop you from checking the details or asking for advice.",
    nextStep: "Pause before replying. Confirm the deadline through an official channel and ask someone you trust to review the offer.",
    pattern: /\b(act now|urgent(?:ly)?|immediately|limited time|today only|within \d+ hours?|last chance|don't miss out|expires? today)\b/i,
    weight: 2,
  },
  {
    label: "Promises unusually high pay or a guaranteed reward.",
    explanation: "Exceptional earnings or guaranteed rewards without a clear selection process can be used to make an offer seem irresistible.",
    nextStep: "Research the role or award independently. Be cautious if the details, employer, or selection process cannot be verified.",
    pattern: /\b(guaranteed (?:job|income|scholarship|return)|earn \$?[\d,]+ (?:a |per )?(?:day|week|month)|no experience (?:needed|required)|easy money|risk.free)\b/i,
    weight: 2,
  },
  {
    label: "Requests sensitive information, login details, or a verification code.",
    explanation: "Passwords, one-time codes, and financial details can let someone access your accounts or misuse your identity.",
    nextStep: "Do not share the information or code. If you already did, change your password and contact the relevant account provider or bank.",
    pattern: /\b(password|passcode|verification code|one.time code|social security|bank account|credit card|login credentials|2fa code)\b/i,
    weight: 3,
  },
  {
    label: "The message includes an unexpected link or asks you to open an attachment.",
    explanation: "Unexpected links and files can lead to fake sign-in pages or unsafe downloads. The link alone does not prove a scam, but it deserves checking.",
    nextStep: "Avoid opening it. Visit the organization’s official website by typing its address yourself to confirm the request.",
    pattern: /(?:https?:\/\/|www\.|bit\.ly\/|tinyurl\.com\/|open (?:the )?attachment|download (?:the )?file)/i,
    weight: 1,
  },
  {
    label: "Asks you to keep the offer secret or avoid talking to someone you trust.",
    explanation: "Pressure to keep an offer secret can isolate you from people who could help verify it.",
    nextStep: "Pause and discuss the message with a trusted person before taking any action.",
    pattern: /\b(keep (?:this|it) (?:a )?secret|don't tell anyone|do not tell anyone|keep (?:this|it) confidential|act alone)\b/i,
    weight: 2,
  },
  {
    label: "Has wording commonly used for unsolicited job or scholarship offers.",
    explanation: "Unexpected claims that you were selected or won something may be intended to get you to respond before checking whether you applied.",
    nextStep: "Check whether you actually applied and confirm the result with the school, employer, or awarding organization directly.",
    pattern: /\b(you (?:have been|are) selected|congratulations.{0,30}(?:winner|scholarship|job)|dear (?:applicant|student|candidate)|claim your (?:prize|scholarship|reward))\b/i,
    weight: 1,
  },
];

function updateCharacterCount() {
  charCount.textContent = `${messageInput.value.length} / 3000`;
}

function showResult(message) {
  const foundSignals = warningChecks.filter((check) => check.pattern.test(message));
  const score = foundSignals.reduce((total, signal) => total + signal.weight * 16, 0);
  const risk = score >= 65 ? "high" : score >= 30 ? "medium" : "low";

  const titles = {
    high: "Several warning signs need attention",
    medium: "Take a closer look before replying",
    low: "No common warning signs detected",
  };
  const summaries = {
    high: "This message contains several patterns commonly associated with scams. Do not reply, pay, or share information until you verify it independently.",
    medium: "Some details match common scam tactics. Pause and verify the sender and offer through official contact details before taking action.",
    low: "This quick scan found few common warning signs. That does not prove the message is genuine—verify the sender before taking action.",
  };

  riskBadge.className = `risk-badge ${risk}`;
  riskBadge.textContent = risk === "high" ? "HIGHER RISK" : risk === "medium" ? "MODERATE RISK" : "LOWER RISK";
  riskMeter.className = `risk-meter ${risk}`;
  riskMeter.setAttribute("aria-label", `${risk} risk indicator based on common text patterns`);
  resultTitle.textContent = titles[risk];
  resultSummary.textContent = summaries[risk];
  findingCount.textContent = `${foundSignals.length} found`;
  warningFindings.replaceChildren();

  if (foundSignals.length) {
    for (const signal of foundSignals) {
      const item = document.createElement("article");
      item.className = "warning-finding";
      const title = document.createElement("h3");
      title.textContent = signal.label;
      const explanation = document.createElement("p");
      explanation.textContent = signal.explanation;
      item.append(title, explanation);
      warningFindings.append(item);
    }
  } else {
    const item = document.createElement("article");
    item.className = "warning-finding no-findings";
    const title = document.createElement("h3");
    title.textContent = "No common text patterns matched";
    const explanation = document.createElement("p");
    explanation.textContent = "Automated checks can miss scams, especially new or carefully written ones. A message without these signs is not necessarily safe.";
    item.append(title, explanation);
    warningFindings.append(item);
  }

  const nextSteps = foundSignals.length
    ? [...foundSignals.map((signal) => signal.nextStep), "Verify the sender using contact details you find independently."]
    : [
        "Check the sender’s email address or profile carefully.",
        "Visit the organization’s official website yourself to confirm the offer.",
        "Never share passwords, verification codes, or payment details with an unverified contact.",
      ];
  nextStepsList.replaceChildren();
  for (const step of [...new Set(nextSteps)].slice(0, 4)) {
    const item = document.createElement("li");
    item.textContent = step;
    nextStepsList.append(item);
  }

  const progress = getProgress();
  progress.checks += 1;
  saveProgress(progress);
}

function renderLessonsAndChecklist() {
  const progress = getProgress();
  for (const button of document.querySelectorAll("[data-lesson-button]")) {
    const completed = progress.completedLessons.includes(button.dataset.lessonButton);
    button.classList.toggle("completed", completed);
    button.textContent = completed ? "Lesson completed ✓" : "Mark lesson complete";
  }
  for (const checkbox of document.querySelectorAll("[data-checklist]")) {
    checkbox.checked = Boolean(progress.checklist[checkbox.dataset.checklist]);
  }
}

function renderProfile() {
  const progress = getProgress();
  const completedLessons = progress.completedLessons.length;
  const completedChecks = Object.values(progress.checklist).filter(Boolean).length;
  const reports = getSavedReports();
  const quizComplete = progress.quizCompletions > 0;

  document.querySelector("#profile-name-input").value =
    localStorage.getItem("scam-shield-student-name") || "";
  document.querySelector("#profile-check-count").textContent = progress.checks;
  document.querySelector("#profile-quiz-score").textContent =
    quizComplete ? `${progress.bestQuiz}/${quizQuestions.length}` : "—";
  document.querySelector("#profile-lessons-count").textContent =
    `${completedLessons} / ${lessonIds.length}`;
  document.querySelector("#profile-reports-count").textContent = reports.length;
  document.querySelector("#profile-quiz-progress").value =
    quizComplete ? progress.bestQuiz : 0;
  document.querySelector("#profile-quiz-progress-text").textContent = quizComplete
    ? `Best score: ${progress.bestQuiz} of ${quizQuestions.length}`
    : "No quiz completed yet";
  document.querySelector("#profile-lessons-progress").value = completedLessons;
  document.querySelector("#profile-lessons-progress-text").textContent =
    `${completedLessons} of ${lessonIds.length} lessons complete`;
  document.querySelector("#profile-checklist-progress").value = completedChecks;
  document.querySelector("#profile-checklist-progress-text").textContent =
    `${completedChecks} of ${checklistIds.length} checked`;
}

function renderSavedReports() {
  const reportList = document.querySelector("#saved-reports-list");
  reportList.replaceChildren();
  const reports = getSavedReports();

  if (!reports.length) {
    const emptyMessage = document.createElement("div");
    emptyMessage.className = "empty-reports";
    emptyMessage.textContent = "No reports saved on this device yet.";
    reportList.append(emptyMessage);
    return;
  }

  for (const report of reports) {
    const card = document.createElement("article");
    card.className = "saved-report-card";
    const content = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = `${report.category} · ${report.channel}`;
    const date = document.createElement("p");
    date.className = "saved-report-meta";
    date.textContent = new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(report.createdAt));
    const details = document.createElement("p");
    details.textContent = report.details;
    content.append(title, date, details);

    const removeButton = document.createElement("button");
    removeButton.className = "delete-report-button";
    removeButton.type = "button";
    removeButton.textContent = "Delete";
    removeButton.addEventListener("click", () => {
      const updatedReports = getSavedReports().filter((savedReport) => savedReport.id !== report.id);
      localStorage.setItem(reportsStorageKey, JSON.stringify(updatedReports));
      renderSavedReports();
      renderProfile();
    });

    card.append(content, removeButton);
    reportList.append(card);
  }
}

function updateImageCharacterCount() {
  imageCharCount.textContent = `${imageMessage.value.length} / 3000`;
}

function loadOcrLibrary() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (ocrLibraryPromise) return ocrLibraryPromise;

  ocrLibraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.onload = () => {
      if (window.Tesseract) resolve(window.Tesseract);
      else {
        ocrLibraryPromise = null;
        reject(new Error("OCR library loaded without exposing Tesseract."));
      }
    };
    script.onerror = () => {
      ocrLibraryPromise = null;
      script.remove();
      reject(new Error("Could not load the OCR library. Check your internet connection and try again."));
    };
    document.head.append(script);
  });
  return ocrLibraryPromise;
}

function handleImageSelection(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    releaseImagePreview();
    imagePreview.removeAttribute("src");
    imagePreviewWrap.hidden = true;
    extractImageTextButton.disabled = true;
    imageUpload.value = "";
    cameraUpload.value = "";
    scanStatus.textContent = "Choose a valid image file.";
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    releaseImagePreview();
    imagePreview.removeAttribute("src");
    imagePreviewWrap.hidden = true;
    extractImageTextButton.disabled = true;
    imageUpload.value = "";
    cameraUpload.value = "";
    scanStatus.textContent = "Choose an image smaller than 10 MB.";
    return;
  }

  releaseImagePreview();
  selectedImage = file;
  imageObjectUrl = URL.createObjectURL(file);
  imagePreview.src = imageObjectUrl;
  imageFileName.textContent = file.name || "Photo captured";
  imagePreviewWrap.hidden = false;
  extractImageTextButton.disabled = false;
  imageMessage.value = "";
  updateImageCharacterCount();
  scanStatus.textContent = "Image ready. Extract the text or type it in the box.";
}

async function extractTextFromImage() {
  if (!selectedImage) {
    scanStatus.textContent = "Upload an image or take a photo first.";
    return;
  }

  const imageToRecognize = selectedImage;
  extractImageTextButton.disabled = true;
  imageUpload.disabled = true;
  cameraUpload.disabled = true;
  scanStatus.textContent = "Loading OCR tools. The image stays in this browser.";
  let worker;
  try {
    const tesseract = await loadOcrLibrary();
    worker = await tesseract.createWorker("eng", 1, {
      logger: (status) => {
        if (status.status === "recognizing text") {
          scanStatus.textContent = `Reading text in your browser: ${Math.round(status.progress * 100)}%`;
        } else if (status.status === "loading language traineddata") {
          scanStatus.textContent = "Downloading English text-recognition data. Your image is not uploaded.";
        }
      },
      langPath: "https://tessdata.projectnaptha.com/4.0.0",
    });
    const { data } = await worker.recognize(imageToRecognize);
    imageMessage.value = data.text.trim();
    updateImageCharacterCount();
    scanStatus.textContent = imageMessage.value
      ? "Text extracted. Review it for accuracy, then analyze it for warning signs."
      : "No readable text was found. Try a clearer image or type the text into the box.";
    imageMessage.focus();
  } catch (error) {
    console.error("Image text extraction failed:", error);
    scanStatus.textContent = `${error.message} You can still type or paste the image text below.`;
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (error) {
        console.error("Could not stop the image text recognition worker:", error);
        scanStatus.textContent = "Text recognition finished, but its worker could not be stopped cleanly. You can continue using the app.";
      }
    }
    extractImageTextButton.disabled = false;
    imageUpload.disabled = false;
    cameraUpload.disabled = false;
  }
}

const lessonIds = ["verify", "payment", "accounts"];
const checklistIds = ["sender", "website", "pressure", "details", "advice"];

analyzeButton.addEventListener("click", () => {
  const message = messageInput.value.trim();
  if (!message) {
    messageInput.focus();
    messageInput.setAttribute("aria-invalid", "true");
    messageInput.placeholder = "Paste a message here first, then try again.";
    return;
  }
  messageInput.removeAttribute("aria-invalid");
  showResult(message);
  showScreen("analysis");
});

messageInput.addEventListener("input", () => {
  updateCharacterCount();
  messageInput.removeAttribute("aria-invalid");
});

exampleButton.addEventListener("click", () => {
  messageInput.value = "Congratulations! You have been selected for a remote student internship. Earn $900 a day with no experience needed. Pay a $45 processing fee today to secure your spot: http://example.com/apply";
  updateCharacterCount();
  messageInput.removeAttribute("aria-invalid");
  showResult(messageInput.value);
  showScreen("analysis");
});

document.querySelector("#clear-button").addEventListener("click", () => {
  messageInput.value = "";
  messageInput.placeholder = "Paste suspicious text, an email, a job offer, or a link here...";
  messageInput.removeAttribute("aria-invalid");
  updateCharacterCount();
  messageInput.focus();
});

document.querySelector("#check-another-button").addEventListener("click", () => {
  messageInput.value = "";
  messageInput.placeholder = "Paste suspicious text, an email, a job offer, or a link here...";
  messageInput.removeAttribute("aria-invalid");
  updateCharacterCount();
  showScreen("check");
  messageInput.focus();
});

updateGreeting();
showDailyTip();
const savedName = localStorage.getItem("scam-shield-student-name");
if (savedName) {
  document.querySelector("#student-name").textContent = savedName;
  document.querySelector("#profile-name-input").value = savedName;
}
renderQuizQuestion();
renderLessonsAndChecklist();
renderSavedReports();
renderProfile();

document.querySelector("#get-started").addEventListener("click", () => showScreen("dashboard"));
document.querySelectorAll(".brand-home").forEach((brand) => {
  brand.addEventListener("click", (event) => {
    event.preventDefault();
    showScreen("welcome");
  });
});

document.querySelectorAll("[data-screen]").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showScreen(link.dataset.screen);
    if (link.closest(".nav-more")) link.closest(".nav-more").open = false;
  });
});

document.querySelector("#personalize-button").addEventListener("click", () => {
  const currentName = document.querySelector("#student-name").textContent;
  const name = window.prompt("What should we call you?", currentName);
  if (name !== null && name.trim()) updateStudentName(name);
});

document.querySelectorAll(".login-trigger").forEach((button) => {
  button.addEventListener("click", () => loginDialog.showModal());
});

document.querySelector("#close-login").addEventListener("click", () => loginDialog.close());
document.querySelector("#continue-as-guest").addEventListener("click", () => {
  loginDialog.close();
  showScreen("dashboard");
});

imageUpload.addEventListener("change", () => {
  handleImageSelection(imageUpload.files[0]);
  cameraUpload.value = "";
});
cameraUpload.addEventListener("change", () => {
  handleImageSelection(cameraUpload.files[0]);
  imageUpload.value = "";
});

extractImageTextButton.addEventListener("click", extractTextFromImage);
imageMessage.addEventListener("input", updateImageCharacterCount);

document.querySelector("#check-image-text").addEventListener("click", () => {
  const message = imageMessage.value.trim();
  if (!message) {
    scanStatus.textContent = "Extract text from an image or type/paste text here before analyzing.";
    imageMessage.focus();
    return;
  }

  messageInput.value = message;
  updateCharacterCount();
  messageInput.removeAttribute("aria-invalid");
  showResult(message);
  showScreen("analysis");
});

document.querySelector("#report-scam-button").addEventListener("click", () => showScreen("report"));
document.querySelector("#report-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const reportFormError = document.querySelector("#report-form-error");
  reportFormError.classList.remove("success");
  if (!form.reportValidity()) return;

  const reports = getSavedReports();
  reports.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    category: document.querySelector("#report-category").value,
    channel: document.querySelector("#report-channel").value,
    details: document.querySelector("#report-details").value.trim(),
    createdAt: new Date().toISOString(),
  });
  reports.splice(50);

  try {
    localStorage.setItem(reportsStorageKey, JSON.stringify(reports));
  } catch (error) {
    console.error("Could not save report in browser storage:", error);
    reportFormError.classList.remove("success");
    reportFormError.textContent = "Could not save this report on your device. Check available browser storage and try again.";
    return;
  }

  form.reset();
  reportFormError.classList.add("success");
  reportFormError.textContent = "Report saved on this device only. It has not been sent to an authority or platform.";
  renderSavedReports();
  renderProfile();
});

document.querySelector("#profile-name-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const nameInput = document.querySelector("#profile-name-input");
  if (!nameInput.value.trim()) {
    document.querySelector("#profile-save-status").textContent = "Enter a name before saving.";
    nameInput.focus();
    return;
  }
  updateStudentName(nameInput.value);
  document.querySelector("#profile-save-status").textContent = "Your name has been saved in this browser.";
});

for (const button of document.querySelectorAll("[data-lesson-button]")) {
  button.addEventListener("click", () => {
    const progress = getProgress();
    const lesson = button.dataset.lessonButton;
    if (progress.completedLessons.includes(lesson)) {
      progress.completedLessons = progress.completedLessons.filter((completedLesson) => completedLesson !== lesson);
    } else {
      progress.completedLessons.push(lesson);
    }
    saveProgress(progress);
    renderLessonsAndChecklist();
  });
}

for (const checkbox of document.querySelectorAll("[data-checklist]")) {
  checkbox.addEventListener("change", () => {
    const progress = getProgress();
    progress.checklist[checkbox.dataset.checklist] = checkbox.checked;
    saveProgress(progress);
  });
}

for (const button of document.querySelectorAll("[data-example]")) {
  button.addEventListener("click", () => {
    const examples = {
      job: "You’re hired! Pay a refundable fee today to receive your work laptop.",
      scholarship: "You have won a scholarship. Sign in here and pay a processing charge to claim it.",
      phishing: "Your account will close in 10 minutes. Reply with your login code to stop it.",
    };
    messageInput.value = examples[button.dataset.example];
    updateCharacterCount();
    messageInput.removeAttribute("aria-invalid");
    showScreen("check");
    messageInput.focus();
  });
}

quizNext.addEventListener("click", () => {
  if (quizIndex === quizQuestions.length) {
    quizIndex = 0;
    quizScore = 0;
    renderQuizQuestion();
    return;
  }
  quizIndex += 1;
  if (quizIndex === quizQuestions.length) showQuizResult();
  else renderQuizQuestion();
});
