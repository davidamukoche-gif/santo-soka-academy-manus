(() => {
  const form = document.querySelector("#admin-login-form");
  const status = document.querySelector("#admin-login-status");
  if (!form) return;

  const setStatus = (message, kind = "") => {
    status.textContent = message;
    status.className = `form-msg show ${kind}`.trim();
  };
  const returnTo = new URLSearchParams(window.location.search).get("returnTo");
  const safeDestination = returnTo && (returnTo.startsWith("/admin/") || returnTo === "/manage-senior-players.html")
    ? returnTo
    : "/admin/dashboard";

  const boot = async () => {
    const profile = await SantosAPI.requireAdmin();
    if (profile) window.location.replace(safeDestination);
  };
  boot();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = form.querySelector("button[type=submit]");
    const email = form.email.value.trim();
    const password = form.password.value;
    if (!email || !password) {
      setStatus("Enter your administrator email and password.", "error");
      return;
    }
    button.disabled = true;
    setStatus("Checking administrator access…");
    try {
      await SantosAPI.signInWithPassword(email, password);
      const profile = await SantosAPI.requireAdmin();
      if (!profile) throw new Error("This account is not an academy administrator.");
      setStatus("Access approved. Opening the admin dashboard…", "success");
      window.location.replace(safeDestination);
    } catch (error) {
      await SantosAPI.signOut().catch(() => {});
      setStatus(error.message || "Login failed. Check your email and password.", "error");
      button.disabled = false;
    }
  });

  document.querySelector("#admin-reset-request")?.addEventListener("click", async () => {
    const email = form.email.value.trim();
    if (!email) {
      setStatus("Enter your administrator email first, then request a reset email.", "error");
      form.email.focus();
      return;
    }
    const resetButton = document.querySelector("#admin-reset-request");
    resetButton.disabled = true;
    setStatus("Sending a password reset email…");
    try {
      await SantosAPI.sendPasswordReset(email);
      setStatus("Check your email for a secure password reset link.", "success");
    } catch (error) {
      setStatus(error.message || "We could not send the reset email.", "error");
    } finally {
      resetButton.disabled = false;
    }
  });
})();
