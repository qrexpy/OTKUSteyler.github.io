import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Import the functions you need from the SDKs you nee
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAE7SJVhS-FLBueWNAQxYA6Gi838YN55wU",
  authDomain: "gustebook-aba1d.firebaseapp.com",
  projectId: "gustebook-aba1d",
  storageBucket: "gustebook-aba1d.firebasestorage.app",
  messagingSenderId: "282519660063",
  appId: "1:282519660063:web:d0ebdb62917160d4f6d72a",
  measurementId: "G-15H56JYDZ0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
  

setInterval(() => {
  const cursors = document.querySelectorAll('[style*="color: #0f0;"]');
  cursors.forEach((cursor) => {
    cursor.style.visibility =
      cursor.style.visibility === "hidden" ? "visible" : "hidden";
  });
}, 500);

function createGlitch() {
  if (Math.random() < 0.01) {
    const glitch = document.createElement("div");
    glitch.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #fff;
            opacity: 0.1;
            pointer-events: none;
            z-index: 1001;
            transform: translateY(${Math.random() * 10}px);
        `;
    document.body.appendChild(glitch);

    setTimeout(() => {
      glitch.remove();
    }, 50);
  }
}

setInterval(createGlitch, 100);

const canvas = document.getElementById("starfield");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const stars = new Array(400).fill().map(() => ({
  x: Math.random() * canvas.width - canvas.width / 2,
  y: Math.random() * canvas.height - canvas.height / 2,
  z: Math.random() * 1500,
  speed: 1 + Math.random() * 2,
}));

function drawStars() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";

  stars.forEach((star) => {
    star.z -= star.speed;

    if (star.z <= 0) {
      star.z = 1500;
      star.x = Math.random() * canvas.width - canvas.width / 2;
      star.y = Math.random() * canvas.height - canvas.height / 2;
    }

    const scale = 100 / star.z;
    const x = star.x * scale + canvas.width / 2;
    const y = star.y * scale + canvas.height / 2;
    const size = scale * 2;

    if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  requestAnimationFrame(drawStars);
}

drawStars();

async function updateStatus() {
  try {
    const response = await fetch(
      "https://api.lanyard.rest/v1/users/554071670143451176"
    );
    const data = await response.json();

    if (data.success) {
      const avatarUrl = `https://cdn.discordapp.com/avatars/${data.data.discord_user.id}/${data.data.discord_user.avatar}`;
      const avatarElement = document.getElementById("userAvatar");
      avatarElement.src = avatarUrl;

      document.getElementById("username").textContent = data.data.discord_user
        .display_name
        ? data.data.discord_user.display_name
        : data.data.discord_user.username;

      const status = data.data.discord_status;
      document.getElementById("status").textContent = status.toUpperCase();

      const statusColors = {
        online: "lime",
        idle: "#ffac00",
        dnd: "red",
        offline: "#747f8d",
      };

      document.documentElement.style.setProperty(
        "--status-color",
        statusColors[status]
      );

      avatarElement.style.opacity = status === "offline" ? "0.5" : "1";

      const spotifyContainer = document.getElementById("spotifyContainer");
      if (data.data.listening_to_spotify) {
        spotifyContainer.style.display = "block";
        document.getElementById("spotifySong").textContent =
          data.data.spotify.song;
        document.getElementById("spotifyArtist").textContent =
          data.data.spotify.artist;
      } else {
        spotifyContainer.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Error fetching status:", error);
  }
}

updateStatus();
setInterval(updateStatus, 30000);

const PERFORMANCE_MODE_KEY = "performance-mode";

const updatePerformanceMode = () => {
  const crt = document.querySelector(".crt");
  if (crt) {
    crt.style.display = isPerformanceMode ? "none" : "block";
  }

  const scanline = document.querySelector(".retro-scanline");
  if (scanline) {
    scanline.style.display = isPerformanceMode ? "none" : "block";
  }

  const container = document.getElementById("container");
  if (container) {
    container.style.filter = isPerformanceMode
      ? "none"
      : "blur(0.5px) brightness(1.1)";
  }

  if (isPerformanceMode) {
    document.getElementById("container").style.animation = "none";
  } else {
    document.getElementById("container").style.animation =
      "chromaticMove 50ms infinite alternate";
  }

  const bloomContainer = document.querySelector(".bloom-container");
  if (bloomContainer) {
    bloomContainer.style.display = isPerformanceMode ? "none" : "block";
  }

  stars.length = isPerformanceMode ? Math.min(stars.length, 200) : 400;

  if (isPerformanceMode) {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = "#000";
  } else {
    ctx.globalAlpha = 1;
  }
};

const createPerformanceToggle = () => {
  const toggle = document.createElement("div");
  toggle.className = "performance-toggle";
  toggle.innerHTML = `
        <label class="switch">
            <input type="checkbox" ${isPerformanceMode ? "checked" : ""}>
            <span class="slider"></span>
        </label>
        <span class="toggle-label">Performance Mode</span>
    `;
  document.body.appendChild(toggle);

  const checkbox = toggle.querySelector("input");
  checkbox.addEventListener("change", (e) => {
    isPerformanceMode = e.target.checked;
    localStorage.setItem(PERFORMANCE_MODE_KEY, isPerformanceMode);
    updatePerformanceMode();
  });
};

const createInitialModal = () => {
  const modal = document.createElement("div");
  modal.className = "performance-modal";
  modal.innerHTML = `
        <div class="performance-modal-content">
            <h2>Performance Settings</h2>
            <p>This site includes visual effects that might affect performance on mobile devices.</p>
            <p>Would you like to enable performance mode?</p>
            <div class="performance-modal-buttons">
                <button onclick="setPerformanceMode(true)">Yes (Recommended for Mobile)</button>
                <button onclick="setPerformanceMode(false)">No (Full Effects)</button>
            </div>
        </div>
    `;
  document.body.appendChild(modal);

  document.getElementById("container").style.visibility = "hidden";
  document.getElementById("starfield").style.visibility = "hidden";
};

window.setPerformanceMode = (enabled) => {
  isPerformanceMode = enabled;
  localStorage.setItem(PERFORMANCE_MODE_KEY, enabled);

  const modal = document.querySelector(".performance-modal");
  if (modal) modal.remove();

  document.getElementById("container").style.visibility = "visible";
  document.getElementById("starfield").style.visibility = "visible";

  createPerformanceToggle();
  updatePerformanceMode();
};

let isPerformanceMode = localStorage.getItem(PERFORMANCE_MODE_KEY);

if (isPerformanceMode === null) {
  createInitialModal();
} else {
  isPerformanceMode = isPerformanceMode === "true";
  createPerformanceToggle();
  updatePerformanceMode();
}

// Comments system implementation
class CommentsUI {
  constructor() {
    this.form = document.getElementById("comment-form");
    this.nameInput = document.getElementById("comment-name");
    this.textInput = document.getElementById("comment-text");
    this.submitButton = document.getElementById("submit-comment");
    this.commentsList = document.getElementById("comments-list");
    this.visitorCounter = document.getElementById("visitor-count");
    this.isSubmitting = false;
    this.rateLimitTimer = null;

    this.init();
  }

  init() {
    this.form?.addEventListener("submit", this.handleSubmit.bind(this));
    this.fetchInitialData();
    this.setupRealtimeComments();
  }

  setupRealtimeComments() {
    // Poll for updates every 30 seconds
    setInterval(async () => {
      try {
        const response = await fetch("/api/comments");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch updates");
        }

        this.renderComments(data.comments);
        this.updateVisitorCount(data.visitorCount);

        // Update rate limit status if needed
        if (data.rateLimit?.isLimited) {
          this.setSubmitState(true);
          this.updateButtonText(data.rateLimit.remainingMinutes);
        } else {
          this.setSubmitState(false);
        }
      } catch (error) {
        console.error("Error fetching updates:", error);
      }
    }, 30000); // 30 seconds
  }

  async fetchInitialData() {
    try {
      const response = await fetch("/api/comments");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch data");
      }

      this.renderComments(data.comments);
      this.updateVisitorCount(data.visitorCount);

      if (data.rateLimit?.isLimited) {
        this.updateRateLimitState(
          data.rateLimit || { isLimited: false, remainingMinutes: 0 }
        );
      }
    } catch (error) {
      this.showError("Failed to load comments. Please try again later.");
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    if (this.isSubmitting) return;

    const name = this.nameInput?.value.trim();
    const text = this.textInput?.value.trim();

    if (!name || !text) {
      this.showError("Please fill in both name and message");
      return;
    }

    this.isSubmitting = true;
    this.setSubmitState(true, "> POSTING...");

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, text }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          this.updateButtonText(data.details.match(/\d+/)[0]);
          throw new Error(data.details);
        }
        throw new Error(data.error);
      }

      this.clearForm();
      this.updateRateLimitState(data.rateLimit);
    } catch (error) {
      this.showError(error.message);
      if (!error.message.includes("rate limit")) {
        this.setSubmitState(false);
      }
    } finally {
      this.isSubmitting = false;
      await this.fetchInitialData();
    }
  }

  setSubmitState(disabled, text = "> POST COMMENT") {
    if (this.submitButton) {
      this.submitButton.disabled = disabled;
      this.submitButton.textContent = text;
    }
  }

  updateButtonText(minutes) {
    if (!this.submitButton) return;
    this.submitButton.textContent =
      minutes === 1 ? "> WAIT 1 MINUTE" : `> WAIT ${minutes} MINUTES`;
  }

  updateRateLimitState({ isLimited, remainingMinutes }) {
    if (this.rateLimitTimer) {
      clearInterval(this.rateLimitTimer);
      this.rateLimitTimer = null;
    }

    if (isLimited) {
      this.setSubmitState(true);
      this.updateButtonText(remainingMinutes);

      // Update the remaining time every minute
      let minutes = remainingMinutes;
      this.rateLimitTimer = setInterval(() => {
        minutes--;
        if (minutes <= 0) {
          clearInterval(this.rateLimitTimer);
          this.rateLimitTimer = null;
          this.setSubmitState(false);
        } else {
          this.updateButtonText(minutes);
        }
      }, 60000);
    } else {
      this.setSubmitState(false);
    }
  }

  updateVisitorCount(count) {
    if (this.visitorCounter) {
      this.visitorCounter.textContent = `Visitors: ${count || "..."}`;
    }
  }

  clearForm() {
    if (this.nameInput) this.nameInput.value = "";
    if (this.textInput) this.textInput.value = "";
    this.clearError();
  }

  clearError() {
    const error = document.querySelector(".error-message");
    if (error) error.remove();
  }

  showError(message, autoHide = true) {
    this.clearError();
    if (!this.form) return;

    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.style.cssText = `
            color: #ff0000;
            margin-top: 10px;
            padding: 5px;
            border: 1px solid #ff0000;
        `;
    errorDiv.textContent = message;

    this.form.appendChild(errorDiv);

    if (autoHide) {
      setTimeout(() => this.clearError(), 5000);
    }
  }

  renderComments(comments) {
    if (!this.commentsList) return;

    this.commentsList.innerHTML = comments.length
      ? ""
      : '<div class="comment-item">No comments yet...</div>';

    comments.reverse().forEach((comment) => {
      const div = document.createElement("div");
      div.className = "comment-item";
      div.innerHTML = `
                <div class="comment-header">
                    <span>> USER: </span>
                    <span class="comment-name">${this.escapeHtml(
                      comment.name
                    )}</span>
                </div>
                <pre class="comment-text">${this.escapeHtml(comment.text)}</pre>
                <div class="comment-timestamp">
                    ${new Date(comment.timestamp).toLocaleString()}
                </div>
            `;
      this.commentsList.appendChild(div);
    });

    this.commentsList.scrollTop = this.commentsList.scrollHeight;
  }

  escapeHtml(text) {
    if (!text) return "";
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => new CommentsUI());
} else {
  new CommentsUI();
}
