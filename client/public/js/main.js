// Santos Soka Academy — small interactions

// Mobile nav toggle
const initializeSantosInteractions = () => {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  // Highlight current page link
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path) a.classList.add("active");
  });

  // WhatsApp chat shortcut for quick parent/player enquiries.
  if (!document.querySelector(".whatsapp-float")) {
    const whatsapp = document.createElement("a");
    whatsapp.className = "whatsapp-float";
    whatsapp.href = "https://wa.me/254724325653?text=Hello%20Santos%20Soka%20Academy%2C%20I%20would%20like%20to%20make%20an%20enquiry.";
    whatsapp.target = "_blank";
    whatsapp.rel = "noopener";
    whatsapp.setAttribute("aria-label", "Chat with Santos Soka Academy on WhatsApp");
    whatsapp.textContent = "WhatsApp us";
    document.body.appendChild(whatsapp);
  }

  // Account control: public pages show sign-in state, and only an authenticated
  // admin receives the roster-management action. Authorization remains enforced
  // server-side by adminProcedure; this is only a convenient navigation surface.
  const navLinks = document.querySelector(".nav-links");
  if (navLinks && !navLinks.querySelector(".account-nav")) {
    const AUTH_ORIGIN = "https://santosoka-dqvkmaei.manus.space";
    const accountItem = document.createElement("li");
    accountItem.className = "account-nav";
    const accountBox = document.createElement("span");
    accountBox.className = "account-box";
    accountBox.textContent = "Checking account…";
    accountItem.appendChild(accountBox);
    navLinks.insertBefore(accountItem, navLinks.lastElementChild);

    const authStartUrl = () => `${AUTH_ORIGIN}/api/oauth/start?returnTo=${encodeURIComponent(`${window.location.pathname}${window.location.search}${window.location.hash}`)}`;
    const rpcAuth = async (procedure, method = "GET") => {
      const response = await fetch(`/api/trpc/${procedure}${method === "GET" ? `?input=${encodeURIComponent(JSON.stringify({ json: null }))}` : "?batch=1"}`, {
        method,
        credentials: "same-origin",
        headers: method === "POST" ? { "content-type": "application/json" } : undefined,
        body: method === "POST" ? JSON.stringify({ 0: { json: null } }) : undefined,
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error("Authentication request failed");
      return body?.[0]?.result?.data?.json ?? body?.result?.data?.json ?? null;
    };

    const renderAccount = (user) => {
      accountBox.innerHTML = "";
      if (!user) {
        const signIn = document.createElement("a");
        signIn.className = "account-link";
        signIn.href = authStartUrl();
        signIn.textContent = "Sign in";
        accountBox.appendChild(signIn);
        return;
      }

      const label = document.createElement("span");
      label.className = "account-label";
      label.textContent = `Signed in: ${user.name || user.email || "Account"}`;
      accountBox.appendChild(label);

      if (user.role === "admin") {
        const adminLink = document.createElement("a");
        adminLink.className = "account-link account-admin";
        adminLink.href = "/manage-senior-players.html";
        adminLink.textContent = "Admin dashboard";
        accountBox.appendChild(adminLink);
      }

      const logout = document.createElement("button");
      logout.className = "account-logout";
      logout.type = "button";
      logout.textContent = "Sign out";
      logout.addEventListener("click", async () => {
        logout.disabled = true;
        try {
          await rpcAuth("auth.logout", "POST");
          window.location.reload();
        } catch {
          logout.disabled = false;
          logout.textContent = "Try again";
        }
      });
      accountBox.appendChild(logout);
    };

    rpcAuth("auth.me").then(renderAccount).catch(() => renderAccount(null));
  }

  // Secure trial registration submission.
  const form = document.querySelector("form.contact");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const button = form.querySelector("button[type=submit]");
      const msg = form.querySelector(".form-msg");
      const payload = Object.fromEntries(new FormData(form).entries());
      if (button) {
        button.disabled = true;
        button.setAttribute("aria-busy", "true");
      }
      if (msg) {
        msg.classList.add("show");
        msg.textContent = "Sending your registration…";
      }
      try {
        const response = await fetch("/api/trpc/trials.submit?batch=1", {
          method: "POST",
          credentials: "same-origin",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ 0: { json: payload } }),
        });
        const body = await response.json();
        const result = body?.[0]?.result?.data?.json;
        if (!response.ok || !result?.success) throw new Error("Submission failed");
        if (msg) msg.textContent = "Thanks! We received your registration and will be in touch soon.";
        form.reset();
      } catch (error) {
        console.error("[Trial registration]", error);
        if (msg) msg.textContent = "We could not send your registration. Please call or WhatsApp 0724325653.";
      } finally {
        if (button) {
          button.disabled = false;
          button.removeAttribute("aria-busy");
        }
      }
    });
  }

  // Gallery filters.
  const galleryItems = document.querySelectorAll("[data-tag]");
  const filterButtons = document.querySelectorAll("[data-f]");
  if (galleryItems.length && filterButtons.length) {
    filterButtons.forEach((filterButton) => {
      filterButton.addEventListener("click", () => {
        const filter = filterButton.getAttribute("data-f");
        filterButtons.forEach((button) => {
          const active = button === filterButton;
          button.classList.toggle("active", active);
          button.setAttribute("aria-pressed", String(active));
        });
        galleryItems.forEach((item) => {
          item.hidden = !(filter === "all" || item.getAttribute("data-tag") === filter);
        });
      });
    });
  }

  // Animated stat counters
  const stats = document.querySelectorAll(".stat strong[data-count]");
  if (stats.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = parseFloat(el.dataset.count);
          const suffix = el.dataset.suffix || "";
          const duration = 1400;
          const start = performance.now();
          const step = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            const val = target * eased;
            el.textContent =
              (target % 1 === 0 ? Math.floor(val) : val.toFixed(1)) + suffix;
            if (p < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
          io.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );
    stats.forEach((s) => io.observe(s));
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSantosInteractions, { once: true });
} else {
  initializeSantosInteractions();
}
