const body = document.body;
const nav = document.querySelector(".site-nav");
const smoothShell = document.querySelector("#smooth-shell");
const smoothContent = document.querySelector("#smooth-content");
const hero = document.querySelector(".hero");
let starCanvas = document.querySelector("#star-canvas") || (hero ? hero.querySelector("canvas") : null);
if (!starCanvas && hero) {
  starCanvas = document.createElement("canvas");
  hero.appendChild(starCanvas);
}
if (hero) {
  hero.style.position = "relative";
  hero.style.overflow = "hidden";
}
if (starCanvas) {
  starCanvas.id = "star-canvas";
  Object.assign(starCanvas.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    zIndex: "0",
    pointerEvents: "none",
  });
}
const starContext = starCanvas ? starCanvas.getContext("2d") : null;
const revealElements = document.querySelectorAll(".reveal");
const loadInElements = document.querySelectorAll(".load-in, .load-sequence");
const rail = document.querySelector("#video-rail");
const arrowButtons = document.querySelectorAll(".rail-arrow");
const railDots = document.querySelectorAll(".rail-dot");
const videoCards = document.querySelectorAll(".video-card");
const form = document.querySelector(".application-form");
const formSuccess = document.querySelector(".form-success");
const cursor = document.querySelector(".custom-cursor");
const clickableElements = document.querySelectorAll("a, button, input, textarea, select");
const magneticButtons = document.querySelectorAll(".magnetic");
const scrambleElements = document.querySelectorAll(".scramble-text");
const wordSplitElements = document.querySelectorAll(".word-split");
const anchorLinks = document.querySelectorAll('a[href^="#"]');

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
const coarsePointerQuery = window.matchMedia("(pointer: coarse)");

const smoothState = {
  enabled: false,
  currentY: window.scrollY,
  targetY: window.scrollY,
  maxY: 0,
  ticking: false,
};

const starScene = {
  animationFrame: 0,
  stars: [],
  mouseX: 0,
  mouseY: 0,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const isTouchDevice = () =>
  coarsePointerQuery.matches || navigator.maxTouchPoints > 0 || "ontouchstart" in window;

const isMobileViewport = () => window.innerWidth < 768;

const shouldUseSmoothScroll = () => false;

const getWordOptions = (element) => {
  const mobile = isMobileViewport();
  return {
    stagger: mobile ? 0.05 : Number.parseFloat(element.dataset.stagger || "0.08"),
    duration: Number.parseFloat(element.dataset.duration || "0.6"),
    start: `${mobile ? 60 : Number.parseFloat(element.dataset.wordStart || "100")}%`,
    scale: element.dataset.wordScale || "1",
    delay: Number.parseFloat(element.dataset.wordDelay || "0"),
  };
};

const splitIntoWords = (element) => {
  if (!element || element.dataset.wordsReady === "true") {
    return;
  }

  const originalText = (element.textContent || "").trim().replace(/\s+/g, " ");
  if (!originalText) {
    return;
  }

  element.dataset.wordsReady = "true";
  element.dataset.originalText = originalText;
  element.setAttribute("aria-label", originalText);

  const words = originalText.split(" ");
  const fragment = document.createDocumentFragment();

  words.forEach((wordText) => {
    const wrapper = document.createElement("span");
    wrapper.className = "word-wrapper";
    wrapper.setAttribute("aria-hidden", "true");

    const word = document.createElement("span");
    word.className = "word";
    word.textContent = wordText;

    wrapper.appendChild(word);
    fragment.appendChild(wrapper);
  });

  element.textContent = "";
  element.appendChild(fragment);
};

const finalizeAnimatedWord = (word, duration) => {
  window.setTimeout(() => {
    word.style.willChange = "";
  }, duration * 1000 + 80);
};

const animateWords = (element) => {
  if (!element || element.dataset.wordsAnimated === "true") {
    return;
  }

  element.dataset.wordsAnimated = "true";
  const options = getWordOptions(element);
  const words = element.querySelectorAll(".word");

  if (prefersReducedMotion.matches) {
    words.forEach((word) => {
      word.style.opacity = "1";
      word.style.transform = "translateY(0) scale(1)";
    });
    return;
  }

  words.forEach((word, index) => {
    word.style.setProperty("--word-duration", `${options.duration}s`);
    word.style.setProperty("--word-start", options.start);
    word.style.setProperty("--word-scale", options.scale);
    word.style.willChange = "transform, opacity";

    window.setTimeout(() => {
      word.classList.add("is-visible");
      finalizeAnimatedWord(word, options.duration);
    }, index * options.stagger * 1000);
  });
};

wordSplitElements.forEach(splitIntoWords);

window.addEventListener("load", () => {
  body.classList.add("is-loaded");
  updateDocumentHeight();
  syncStarField();
});

loadInElements.forEach((element) => {
  requestAnimationFrame(() => {
    element.classList.add("is-ready");
  });
});

const scrambleText = (element) => {
  const finalText = element.dataset.text || element.textContent || "";
  const chars = "/ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-, ";
  let frame = 0;
  const totalFrames = finalText.length + 8;

  const update = () => {
    const nextText = finalText
      .split("")
      .map((character, index) => {
        if (character === " ") {
          return " ";
        }

        if (index < frame) {
          return finalText[index];
        }

        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join("");

    element.textContent = nextText;
    frame += 1 / 2.2;

    if (frame <= totalFrames) {
      window.requestAnimationFrame(update);
      return;
    }

    element.textContent = finalText;
  };

  window.requestAnimationFrame(update);
};

scrambleElements.forEach((element) => {
  const delayInSeconds = Number.parseFloat(
    getComputedStyle(element).getPropertyValue("--load-delay") || "0"
  );

  window.setTimeout(() => {
    scrambleText(element);
  }, Math.max(0, delayInSeconds * 1000));
});

const syncNav = () => {
  const scrollPosition = smoothState.enabled ? smoothState.currentY : window.scrollY;
  nav?.classList.toggle("is-scrolled", scrollPosition > 24);
};

const triggerHeroWordAnimations = () => {
  document.querySelectorAll(".word-hero").forEach((element) => {
    const delay = getWordOptions(element).delay;
    window.setTimeout(() => {
      animateWords(element);
    }, delay * 1000);
  });
};

triggerHeroWordAnimations();

revealElements.forEach((element) => {
  const delay = Number(element.dataset.delay || 0);
  element.style.setProperty("--delay", `${delay}ms`);
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");

      if (entry.target.classList.contains("word-scroll")) {
        animateWords(entry.target);
      }

      revealObserver.unobserve(entry.target);
    });
  },
  {
    threshold: 0.12,
    rootMargin: "0px 0px -10% 0px",
  }
);

revealElements.forEach((element) => revealObserver.observe(element));

const updateDocumentHeight = () => {
  if (!smoothContent) {
    return;
  }

  if (smoothState.enabled) {
    const totalHeight = smoothContent.scrollHeight;
    body.style.height = `${totalHeight}px`;
    smoothState.maxY = Math.max(0, totalHeight - window.innerHeight);
    smoothState.targetY = clamp(smoothState.targetY, 0, smoothState.maxY);
    smoothState.currentY = clamp(smoothState.currentY, 0, smoothState.maxY);
    window.scrollTo(0, smoothState.targetY);
    smoothContent.style.transform = `translate3d(0, ${-smoothState.currentY}px, 0)`;
    return;
  }

  body.style.height = "";
  smoothContent.style.transform = "";
};

const handleWindowScroll = () => {
  if (smoothState.enabled) {
    smoothState.targetY = clamp(window.scrollY, 0, smoothState.maxY);
  }

  syncNav();
};

const handleWheel = (event) => {
  if (!smoothState.enabled) {
    return;
  }

  if (event.ctrlKey) {
    return;
  }

  event.preventDefault();
  smoothState.targetY = clamp(smoothState.targetY + event.deltaY, 0, smoothState.maxY);
  window.scrollTo(0, smoothState.targetY);
};

const smoothLoop = () => {
  if (smoothState.enabled && smoothContent) {
    smoothState.currentY += (smoothState.targetY - smoothState.currentY) * 0.08;

    if (Math.abs(smoothState.targetY - smoothState.currentY) < 0.1) {
      smoothState.currentY = smoothState.targetY;
    }

    smoothContent.style.transform = `translate3d(0, ${-smoothState.currentY}px, 0)`;
    syncNav();
  }

  window.requestAnimationFrame(smoothLoop);
};

const enableSmoothScroll = () => {
  if (smoothState.enabled || !smoothShell || !smoothContent) {
    return;
  }

  smoothState.enabled = true;
  smoothState.currentY = window.scrollY;
  smoothState.targetY = window.scrollY;
  body.classList.add("smooth-active");
  updateDocumentHeight();
};

const disableSmoothScroll = () => {
  if (!smoothState.enabled || !smoothContent) {
    return;
  }

  smoothState.enabled = false;
  body.classList.remove("smooth-active");
  smoothContent.style.transform = "";
  body.style.height = "";
};

const syncSmoothMode = () => {
  if (shouldUseSmoothScroll()) {
    enableSmoothScroll();
  } else {
    disableSmoothScroll();
  }

  updateDocumentHeight();
};

syncSmoothMode();
smoothLoop();
syncNav();

window.addEventListener("scroll", handleWindowScroll, { passive: true });
window.addEventListener("wheel", handleWheel, { passive: false });
window.addEventListener("resize", () => {
  syncSmoothMode();
  updateDocumentHeight();
  updateRailDots();
});

anchorLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    if (!targetId || targetId === "#") {
      return;
    }

    const target = document.querySelector(targetId);
    if (!target) {
      return;
    }

    if (!smoothState.enabled) {
      return;
    }

    event.preventDefault();
    const targetTop = target.getBoundingClientRect().top + smoothState.currentY;
    smoothState.targetY = clamp(targetTop, 0, smoothState.maxY);
    window.scrollTo(0, smoothState.targetY);
  });
});

const updateRailDots = () => {
  if (!rail || !videoCards.length || !railDots.length) {
    return;
  }

  const gap = 16;
  const firstCardWidth = videoCards[0].offsetWidth + gap;
  const activeIndex = Math.max(
    0,
    Math.min(videoCards.length - 1, Math.round(rail.scrollLeft / firstCardWidth))
  );

  railDots.forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activeIndex);
  });
};

arrowButtons.forEach((button) => {
  button.addEventListener("click", () => {
    if (!rail || !videoCards.length) {
      return;
    }

    const distance = videoCards[0].offsetWidth + 16;
    const direction = button.dataset.direction === "right" ? 1 : -1;
    rail.scrollBy({
      left: direction * distance,
      behavior: "smooth",
    });
  });
});

railDots.forEach((dot) => {
  dot.addEventListener("click", () => {
    if (!rail) {
      return;
    }

    const index = Number(dot.dataset.index || 0);
    const card = videoCards[index];
    if (!card) {
      return;
    }

    rail.scrollTo({
      left: card.offsetLeft,
      behavior: "smooth",
    });
  });
});

rail?.addEventListener("scroll", updateRailDots, { passive: true });
updateRailDots();

if (form && formSuccess) {
  const showSuccess = () => {
    form.classList.add("is-hidden");
    formSuccess.classList.add("is-visible");
    updateDocumentHeight();
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const action = form.getAttribute("action") || "";

    if (action.includes("/placeholder")) {
      showSuccess();
      return;
    }

    const formData = new FormData(form);

    try {
      const response = await fetch(action, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Submission failed");
      }

      showSuccess();
    } catch (error) {
      window.alert("Form submission could not be completed. Please try again.");
    }
  });
}

if (cursor && finePointerQuery.matches) {
  const state = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    currentX: window.innerWidth / 2,
    currentY: window.innerHeight / 2,
  };

  const animateCursor = () => {
    state.currentX += (state.x - state.currentX) * 0.18;
    state.currentY += (state.y - state.currentY) * 0.18;
    cursor.style.transform = `translate(${state.currentX - cursor.offsetWidth / 2}px, ${state.currentY - cursor.offsetHeight / 2}px)`;
    window.requestAnimationFrame(animateCursor);
  };

  window.addEventListener("mousemove", (event) => {
    state.x = event.clientX;
    state.y = event.clientY;
  });

  clickableElements.forEach((element) => {
    element.addEventListener("mouseenter", () => cursor.classList.add("is-active"));
    element.addEventListener("mouseleave", () => cursor.classList.remove("is-active"));
  });

  animateCursor();
}

if (finePointerQuery.matches) {
  magneticButtons.forEach((button) => {
    const label = button.querySelector(".button-label");

    button.addEventListener("mousemove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;
      const moveX = x * 0.16;
      const moveY = y * 0.22;

      button.style.transform = `translate(${moveX}px, ${moveY}px)`;

      if (label) {
        label.style.transform = `translate(${moveX * 0.45}px, ${moveY * 0.45}px)`;
      }
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "";
      if (label) {
        label.style.transform = "";
      }
    });
  });
}

class Star {
  constructor(width, height) {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.z = Math.random();
    this.baseSize = this.z * 2.2 + 0.4;
    this.baseOpacity = this.z * 0.75 + 0.08;
    this.speed = this.z * 0.35 + 0.04;
    this.twinkleOffset = Math.random() * Math.PI * 2;
    this.twinkleSpeed = Math.random() * 0.02 + 0.008;
    this.isGreenTint = Math.random() < 0.08;
    this.color = this.isGreenTint ? "rgba(106, 172, 121," : "rgba(245, 245, 240,";
  }

  update(width, height) {
    this.twinkleOffset += this.twinkleSpeed;
    this.y -= this.speed;
    this.x -= (starScene.mouseX - width / 2) * this.z * 0.004;
    this.y -= (starScene.mouseY - height / 2) * this.z * 0.004;

    if (this.y < -2) {
      this.y = height + 2;
      this.x = Math.random() * width;
    }
  }

  draw(context) {
    let currentOpacity = this.baseOpacity + Math.sin(this.twinkleOffset) * 0.12;
    currentOpacity = Math.max(0.05, Math.min(0.95, currentOpacity));
    const currentSize = this.baseSize + Math.sin(this.twinkleOffset) * 0.3;

    if (this.z > 0.65) {
      context.beginPath();
      context.arc(this.x, this.y, currentSize * 3.5, 0, Math.PI * 2);
      context.fillStyle = `${this.color}0.04)`;
      context.fill();
    }

    context.beginPath();
    context.arc(this.x, this.y, currentSize, 0, Math.PI * 2);
    context.fillStyle = `${this.color}${currentOpacity.toFixed(3)})`;
    context.fill();
  }
}

const initStars = () => {
  if (!starCanvas) {
    return;
  }

  starScene.stars.length = 0;
  for (let index = 0; index < 180; index += 1) {
    starScene.stars.push(new Star(starCanvas.width, starCanvas.height));
  }

  if (window.innerWidth < 768) {
    starScene.stars.splice(100);
  }

  starScene.mouseX = starCanvas.width / 2;
  starScene.mouseY = starCanvas.height / 2;
};

const drawVignette = () => {
  if (!starContext || !starCanvas) {
    return;
  }

  const gradient = starContext.createRadialGradient(
    starCanvas.width / 2,
    starCanvas.height / 2,
    starCanvas.width * 0.4,
    starCanvas.width / 2,
    starCanvas.height / 2,
    starCanvas.width * 0.85
  );
  gradient.addColorStop(0, "rgba(10, 10, 10, 0)");
  gradient.addColorStop(1, "rgba(10, 10, 10, 0.55)");

  starContext.fillStyle = gradient;
  starContext.fillRect(0, 0, starCanvas.width, starCanvas.height);
};

const animateStars = () => {
  if (!starCanvas || !starContext || prefersReducedMotion.matches) {
    return;
  }

  starContext.fillStyle = "#0a0a0a";
  starContext.fillRect(0, 0, starCanvas.width, starCanvas.height);

  starScene.stars.forEach((star) => {
    star.update(starCanvas.width, starCanvas.height);
    star.draw(starContext);
  });

  drawVignette();
  starScene.animationFrame = window.requestAnimationFrame(animateStars);
};

const resizeCanvas = () => {
  if (!starCanvas || !hero) {
    return;
  }

  starCanvas.width = hero.offsetWidth;
  starCanvas.height = hero.offsetHeight;
  initStars();
};

let resizeTimeoutId = 0;
const handleCanvasResize = () => {
  window.clearTimeout(resizeTimeoutId);
  resizeTimeoutId = window.setTimeout(() => {
    resizeCanvas();
  }, 150);
};

const syncStarField = () => {
  if (!starCanvas || !hero || prefersReducedMotion.matches) {
    if (starContext && starCanvas) {
      window.cancelAnimationFrame(starScene.animationFrame);
      starContext.clearRect(0, 0, starCanvas.width, starCanvas.height);
    }
    return;
  }

  resizeCanvas();
  window.cancelAnimationFrame(starScene.animationFrame);
  animateStars();
};

resizeCanvas();
window.addEventListener("resize", handleCanvasResize);

if (hero && !isMobileViewport()) {
  hero.addEventListener("mousemove", (event) => {
    const rect = hero.getBoundingClientRect();
    starScene.mouseX = event.clientX - rect.left;
    starScene.mouseY = event.clientY - rect.top;
  });
}

syncStarField();

prefersReducedMotion.addEventListener("change", () => {
  syncSmoothMode();
  syncStarField();
});
