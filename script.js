/* =========================
   只需要改这里的名字和日期
   ========================= */
const SITE_CONFIG = {
  coupleName: "黄健航 & 邱幸儿",
  weddingDate: "2026.11.08 · Sunday"
};

document.querySelectorAll("[data-couple]").forEach(el => el.textContent = SITE_CONFIG.coupleName);
document.querySelectorAll("[data-date]").forEach(el => el.textContent = SITE_CONFIG.weddingDate);

const scenes = [...document.querySelectorAll(".scene")];
let currentScene = "scene-hero";

function showScene(id) {
  const next = document.getElementById(id);
  if (!next) return;

  if (currentScene === "scene-mystery" && id !== currentScene) stopMystery();
  // 离开场景时取消延迟操作，避免上一轮动画影响当前页面。
  if (currentScene === "scene-letter-intro" || id === "scene-letter-intro") resetEnvelope();
  if (currentScene === "scene-gift") {
    clearTimeout(giftTimer);
    giftTimer = null;
    if (revealedCards === 0 && tree.hidden) { giftBox.classList.remove("is-open"); giftBox.disabled = false; }
  }
  if (storyObserver) storyObserver.disconnect();
  cancelAnimationFrame(storyFrame);
  scenes.forEach(scene => {
    scene.classList.remove("is-active");
    scene.inert = scene !== next;
  });
  next.classList.add("is-active");
  currentScene = id;
  window.weddingMusic?.setScene(id);
  window.weddingCosmos?.setActive(id === "scene-universe");
  next.scrollTop = 0;

  document.body.style.overflow = id === "scene-universe" ? "hidden" : "hidden";

  if (id === "scene-universe") {
    storyFrame = requestAnimationFrame(() => {
      if (currentScene === "scene-universe") setupStoryObserver();
    });
  }
}

document.querySelectorAll("[data-next]").forEach(btn => {
  btn.addEventListener("click", () => showScene(btn.dataset.next));
});

/* 信封 */
const envelope = document.getElementById("openEnvelope");
let envelopeTimer = null;
let envelopeOpening = false;
function resetEnvelope() {
  clearTimeout(envelopeTimer);
  envelopeTimer = null;
  envelopeOpening = false;
  envelope.classList.remove("is-open");
  envelope.disabled = false;
  envelope.setAttribute("aria-busy", "false");
}
envelope.addEventListener("click", () => {
  if (currentScene !== "scene-letter-intro" || envelopeOpening) return;
  envelopeOpening = true;
  envelope.disabled = true;
  envelope.setAttribute("aria-busy", "true");
  envelope.classList.add("is-open");
  envelopeTimer = setTimeout(() => {
    envelopeTimer = null;
    if (currentScene === "scene-letter-intro") showScene("scene-letter");
  }, 1100);
});

/* 祝福树：每份礼物独立打开，可重复阅读。 */
const giftBox = document.getElementById("giftBox");
const giftHint = document.getElementById("giftHint");
const cards = [...document.querySelectorAll(".blessing-card")];
const tree = document.getElementById("blessingTree");
const treeGifts = [...document.querySelectorAll("[data-blessing]")];
const openedGifts = new Set();
const blessingDialog = document.getElementById("blessingDialog");
const enterUniverse = document.getElementById("enterUniverse");
let revealedCards = 0;
let giftTimer = null;
let lastGift = null;
function resetTree() {
  clearTimeout(giftTimer); giftTimer = null;
  if (blessingDialog.open) blessingDialog.close();
  openedGifts.clear(); revealedCards = 0;
  tree.hidden = true; giftBox.hidden = false; giftBox.disabled = false;
  giftBox.classList.remove("is-open");
  giftHint.hidden = false; giftHint.textContent = "点击打开礼物盒";
  enterUniverse.hidden = true;
  document.getElementById("treeProgress").textContent = "已打开 0 / 5 份祝福";
  treeGifts.forEach((button, i) => {
    button.classList.remove("is-read");
    button.querySelector(".tree-gift__status").textContent = "未打开";
    button.setAttribute("aria-label", `打开第${i + 1}份祝福：${button.querySelector(".tree-gift__label").textContent}`);
  });
  cards.forEach(card => card.classList.remove("is-revealed"));
  document.getElementById("scene-gift").classList.remove("has-tree");
}
giftBox.addEventListener("click", () => {
  if (currentScene !== "scene-gift" || giftTimer !== null || !tree.hidden) return;
  giftBox.disabled = true; giftBox.classList.add("is-open");
  giftHint.textContent = "把祝福种下，让温柔生长……";
  giftTimer = setTimeout(() => {
    giftTimer = null;
    if (currentScene !== "scene-gift") return;
    tree.hidden = false; giftBox.hidden = true; giftHint.hidden = true;
    document.getElementById("scene-gift").classList.add("has-tree");
    treeGifts[0].focus({ preventScroll: true });
  }, 700);
});
treeGifts.forEach((button, i) => button.addEventListener("click", () => {
  if (currentScene !== "scene-gift" || tree.hidden) return;
  lastGift = button; openedGifts.add(i); revealedCards = openedGifts.size;
  cards.forEach((card, index) => card.classList.toggle("is-revealed", index === i));
  button.classList.add("is-read");
  button.querySelector(".tree-gift__status").textContent = "已收好 ✓";
  button.setAttribute("aria-label", `重读第${i + 1}份祝福：${button.querySelector(".tree-gift__label").textContent}`);
  document.getElementById("treeProgress").textContent = `已打开 ${revealedCards} / ${cards.length} 份祝福`;

  blessingDialog.showModal();
}));
function closeBlessing() { blessingDialog.close(); }
document.getElementById("closeBlessing").addEventListener("click", closeBlessing);
document.getElementById("backToTree").addEventListener("click", closeBlessing);
blessingDialog.addEventListener("close", () => {
  if (currentScene === "scene-gift" && !tree.hidden) {
    if (openedGifts.size === cards.length && !mysteryStarted) startMystery();
    else lastGift?.focus({ preventScroll: true });
  }
});
blessingDialog.addEventListener("cancel", e => { e.preventDefault(); closeBlessing(); });
blessingDialog.addEventListener("keydown", e => { if (e.key === "Escape") e.stopPropagation(); });
enterUniverse.addEventListener("click", () => {
  if (currentScene === "scene-mystery" && mysteryReady) showScene("scene-universe");
});

/* 宇宙故事：内部滚动 + 淡入 */
const universeScene = document.getElementById("scene-universe");
universeScene.addEventListener("scroll", () => {
  window.weddingCosmos?.setProgress(universeScene.scrollTop / Math.max(1, universeScene.scrollHeight - universeScene.clientHeight));
}, { passive: true });
const universeScrollHint = document.getElementById("universeScrollHint");
universeScrollHint.addEventListener("click", () => {
  const nextBeat = universeScene.querySelectorAll(".story-beat")[1];
  nextBeat.scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
    block: "center"
  });
});
let storyObserver;
let storyFrame = null;
function setupStoryObserver() {
  const universe = document.getElementById("scene-universe");
  universe.scrollTop = 0;
  window.weddingCosmos?.setProgress(0);

  if (storyObserver) storyObserver.disconnect();
  storyObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { root: universe, threshold: .48 });

  document.querySelectorAll(".story-beat").forEach(beat => storyObserver.observe(beat));
}

document.getElementById("showFinale").addEventListener("click", () => showScene("scene-finale"));

/* 彩蛋 */
document.getElementById("easterStar").addEventListener("click", () => {
  document.getElementById("easterMessage").classList.toggle("is-visible");
});

/* 重看 */
function restartJourney() {
  resetEnvelope();
  resetMystery();
  resetTree();
  document.getElementById("dollMessage").textContent = "点点我们 ♡";
  clearTimeout(giftTimer);
  giftTimer = null;
  if (storyObserver) storyObserver.disconnect();
  cancelAnimationFrame(storyFrame);
  document.querySelectorAll(".story-beat").forEach((beat, index) => {
    beat.classList.toggle("is-visible", index === 0);
  });
  scenes.forEach(scene => { scene.scrollTop = 0; });
  cards.forEach(card => card.classList.remove("is-revealed"));
  revealedCards = 0;
  giftBox.classList.remove("is-open");
  giftHint.textContent = "点击打开礼物盒";
  document.getElementById("easterMessage").classList.remove("is-visible");
  showScene("scene-hero");
}
document.getElementById("restartBtn").addEventListener("click", restartJourney);
scenes.forEach(scene => { scene.inert = scene.id !== currentScene; });

/* 星空 Canvas */
const canvas = document.getElementById("starCanvas");
const ctx = canvas.getContext("2d");
let stars = [];
let dpr = Math.min(window.devicePixelRatio || 1, 2);

function resizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.min(220, Math.floor((innerWidth * innerHeight) / 7000));
  stars = Array.from({ length: count }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    r: Math.random() * 1.4 + .25,
    a: Math.random() * .6 + .18,
    speed: Math.random() * .007 + .002,
    phase: Math.random() * Math.PI * 2
  }));
}

function drawStars(t = 0) {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  const isPaper = currentScene === "scene-letter";
  canvas.style.opacity = isPaper ? ".08" : ".78";

  for (const s of stars) {
    const pulse = (Math.sin(t * s.speed + s.phase) + 1) / 2;
    ctx.beginPath();
    ctx.fillStyle = `rgba(236,226,255,${s.a * (.55 + pulse * .45)})`;
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fill();
  }
  requestAnimationFrame(drawStars);
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
requestAnimationFrame(drawStars);

/* 键盘可用性：Esc 回开场 */
window.addEventListener("keydown", e => {
  if (e.key === "Escape") restartJourney();
});

/* 新人人偶：点击挥手 / 轻跳，名字不代表真人外貌。 */
let dollClicks = 0;
document.querySelectorAll("[data-doll]").forEach(button => {
  button.addEventListener("click", () => {
    button.classList.remove("is-greeting"); void button.offsetWidth; button.classList.add("is-greeting");
    const messages = button.dataset.doll === "groom" ? ["健航向你挥挥手 ♡", "今天，我们结婚啦！"] : ["幸儿送你一颗心 ♡", "谢谢你来见证我们的幸福！"];
    document.getElementById("dollMessage").textContent = messages[dollClicks++ % messages.length];
  });
  button.addEventListener("animationend", () => button.classList.remove("is-greeting"));
});

/* 神秘礼物：最后一封读完并关闭后，才开始倒数。 */
let mysteryStarted = false, mysteryReady = false, mysteryTimer = null;
const mysteryScene = document.getElementById("scene-mystery");
function stopMystery() { clearInterval(mysteryTimer); mysteryTimer = null; }
function resetMystery() {
  stopMystery(); mysteryStarted = false; mysteryReady = false;
  mysteryScene.classList.remove("has-meteor", "has-night");
  ["mysteryCountdown", "mysteryWait", "mysteryTitle"].forEach(id => document.getElementById(id).hidden = false);
  ["mysteryQuestion", "mysteryPunchline", "enterUniverse"].forEach(id => document.getElementById(id).hidden = true);
  document.getElementById("mysteryCountdown").textContent = "8";
}
function startMystery() {
  resetMystery(); mysteryStarted = true; showScene("scene-mystery");
  const began = performance.now();
  const countdown = document.getElementById("mysteryCountdown");
  const update = () => {
    if (currentScene !== "scene-mystery") { stopMystery(); return; }
    const elapsed = performance.now() - began;
    const seconds = Math.max(0, Math.ceil(8 - elapsed / 1000));
    countdown.textContent = seconds; countdown.setAttribute("aria-label", `倒数${seconds}秒`);
    if (elapsed >= 8000) {
      countdown.hidden = true; document.getElementById("mysteryWait").hidden = true;
      document.getElementById("mysteryTitle").hidden = true;
      mysteryScene.classList.add("has-meteor", "has-night");
    }
    if (elapsed >= 9600) document.getElementById("mysteryQuestion").hidden = false;
    if (elapsed >= 11600) document.getElementById("mysteryPunchline").hidden = false;
    if (elapsed >= 13600) { enterUniverse.hidden = false; mysteryReady = true; stopMystery(); }
  };
  update(); mysteryTimer = setInterval(update, 100);
}
