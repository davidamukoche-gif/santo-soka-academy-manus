// Santos Soka Academy — small interactions

// Mobile nav toggle
document.addEventListener("DOMContentLoaded", () => {
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
});
