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
        const result = await SantosAPI.api("/trials", { method: "POST", body: JSON.stringify(payload) });
        if (!result?.success) throw new Error("Submission failed");
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


// Fixtures & Matchday — public data is served from the database and managed by admins.
const initializeFixtures = async () => {
  const home = document.querySelector("[data-fixtures-home]");
  const fullPage = document.querySelector("[data-fixtures-page]");
  if (!home && !fullPage) return;

  const filterGroup = document.querySelector("[data-fixture-filters]");
  let fixtures;
  try {
    fixtures = await SantosAPI.api("/fixtures");
  } catch {
    document.querySelectorAll("[data-upcoming-fixtures], [data-past-fixtures]").forEach((body) => {
      body.innerHTML = '<tr><td colspan="7">Fixtures are temporarily unavailable.</td></tr>';
    });
    return;
  }

  fixtures = Array.isArray(fixtures) ? fixtures.map((fixture) => ({
    ...fixture,
    date: fixture.date || fixture.fixtureDate,
    time: fixture.time || fixture.fixtureTime,
  })) : [];
  const upcoming = fixtures.filter((fixture) => fixture.status === "Upcoming");
  const past = fixtures.filter((fixture) => fixture.status !== "Upcoming");
  const category = (team, competition) => {
    if (competition === "Regional League") return "county";
    const age = Number(String(team).replace(/[^0-9]/g, ""));
    if (team === "Senior" || age >= 17) return "u17-senior";
    if (age >= 13) return "u13-u16";
    return "u6-u12";
  };
  const formatDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  const statusClass = (status) => status === "FT" ? "status-ft" : status === "Postponed" ? "status-postponed" : "status-upcoming";
  const renderRow = (fixture) => `<tr data-fixture-category="${category(fixture.team, fixture.competition)}"><td>${formatDate(fixture.date)}</td><td>${fixture.time}</td><td><strong>${fixture.team}</strong></td><td>${fixture.opponent}</td><td>${fixture.venue}</td><td>${fixture.competition}</td><td><span class="status-badge ${statusClass(fixture.status)}">${fixture.status}${fixture.score ? ` · ${fixture.score}` : ""}</span></td></tr>`;

  const upcomingBodies = document.querySelectorAll("[data-upcoming-fixtures]");
  upcomingBodies.forEach((body) => { body.innerHTML = upcoming.map(renderRow).join("") || '<tr><td colspan="7">No upcoming fixtures in this category.</td></tr>'; });
  document.querySelectorAll("[data-past-fixtures]").forEach((body) => { body.innerHTML = past.map(renderRow).join("") || '<tr><td colspan="7">No past results yet.</td></tr>'; });

  const applyFilter = (filter) => {
    document.querySelectorAll("[data-fixture-category]").forEach((row) => { row.hidden = filter !== "all" && row.dataset.fixtureCategory !== filter; });
    document.querySelectorAll("[data-fixture-filter]").forEach((button) => button.classList.toggle("active", button.dataset.fixtureFilter === filter));
  };
  filterGroup?.querySelectorAll("[data-fixture-filter]").forEach((button) => button.addEventListener("click", () => applyFilter(button.dataset.fixtureFilter)));

  const next = upcoming[0];
  if (!next) return;
  const setText = (selector, value) => document.querySelectorAll(selector).forEach((element) => { element.textContent = value; });
  setText("[data-matchday-competition]", `${formatDate(next.date)} · ${next.time} · ${next.competition}`);
  setText("[data-matchday-team]", next.team);
  setText("[data-matchday-opponent]", next.opponent);
  setText("[data-matchday-venue]", next.venue);
  setText("[data-matchday-score]", next.score || "vs");
  setText("[data-matchday-scorers]", next.scorers?.length ? next.scorers.join(" · ") : "No goals recorded yet.");
  const card = document.querySelector("[data-matchday-card]");
  if (card && next.status !== "Upcoming") card.querySelector(".status-badge").textContent = next.status === "FT" ? "FULL TIME" : next.status.toUpperCase();

  const countdown = document.querySelector("[data-countdown]");
  if (countdown) {
    const target = new Date(`${next.date}T${next.time}:00+03:00`).getTime();
    const tick = () => {
      const remaining = Math.max(0, target - Date.now());
      const values = [Math.floor(remaining / 86400000), Math.floor(remaining / 3600000) % 24, Math.floor(remaining / 60000) % 60, Math.floor(remaining / 1000) % 60];
      countdown.querySelectorAll("strong").forEach((element, index) => { element.textContent = String(values[index]).padStart(2, "0"); });
    };
    tick();
    window.setInterval(tick, 1000);
  }
};

initializeFixtures();
