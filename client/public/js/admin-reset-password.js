(() => {
  const form = document.querySelector("#admin-reset-form");
  const status = document.querySelector("#admin-reset-status");
  if (!form) return;
  const setStatus = (message, kind = "") => {
    status.textContent = message;
    status.className = `form-msg show ${kind}`.trim();
  };
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.querySelector("#new-password").value;
    const confirmation = document.querySelector("#confirm-password").value;
    if (password.length < 8) return setStatus("Use at least 8 characters.", "error");
    if (password !== confirmation) return setStatus("The passwords do not match.", "error");
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    setStatus("Saving your new password…");
    try {
      const { data: { session } } = await SantosAPI.client.auth.getSession();
      if (!session) throw new Error("This reset link has expired. Request a new one from the admin login page.");
      const { error } = await SantosAPI.client.auth.updateUser({ password });
      if (error) throw error;
      await SantosAPI.client.auth.signOut();
      setStatus("Password saved. Redirecting to administrator login…", "success");
      window.setTimeout(() => window.location.replace("/admin/login"), 900);
    } catch (error) {
      setStatus(error.message || "The password could not be updated.", "error");
      button.disabled = false;
    }
  });
})();
