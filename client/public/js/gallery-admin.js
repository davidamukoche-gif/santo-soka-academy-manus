(() => {
  const form = document.querySelector("#gallery-form");
  const list = document.querySelector("#admin-gallery");
  const status = document.querySelector("#gallery-admin-status");
  if (!form || !list || !window.SantosAPI) return;

  const setStatus = (message, kind = "") => {
    status.textContent = message;
    status.className = `form-msg show ${kind}`.trim();
  };
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
  const readDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("The image could not be read."));
    reader.readAsDataURL(file);
  });

  const render = (items) => {
    if (!items.length) {
      list.innerHTML = '<p class="field-hint">No administrator-uploaded photos yet.</p>';
      return;
    }
    list.innerHTML = items.map((item) => `<article class="admin-gallery-card">
      <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.alt_text)}" loading="lazy" />
      <div class="admin-gallery-card-body"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.category)} · order ${item.display_order}</span><button class="roster-delete" type="button" data-gallery-delete="${escapeHtml(item.id)}">Delete photo</button></div>
    </article>`).join("");
  };

  const load = async () => {
    try {
      render(await SantosAPI.api("/admin/gallery"));
    } catch (error) {
      list.innerHTML = `<p class="form-msg show error">${escapeHtml(error.message)}</p>`;
    }
  };

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const file = form.image.files?.[0];
    if (!file) return setStatus("Choose a photo first.", "error");
    if (file.size > 8 * 1024 * 1024) return setStatus("Gallery images must be 8 MB or smaller.", "error");
    const button = form.querySelector("button[type=submit]");
    button.disabled = true;
    setStatus("Uploading photo…");
    try {
      const imageData = await readDataUrl(file);
      await SantosAPI.api("/admin/gallery", { method: "POST", body: JSON.stringify({ title: form.title.value, altText: form.altText.value, category: form.category.value, displayOrder: Number(form.displayOrder.value || 0), imageData }) });
      form.reset();
      form.category.value = "training";
      form.displayOrder.value = "0";
      setStatus("Photo uploaded to the public gallery.", "success");
      await load();
    } catch (error) {
      setStatus(error.message || "Photo upload failed.", "error");
    } finally {
      button.disabled = false;
    }
  });

  list.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-gallery-delete]");
    if (!button || !window.confirm("Delete this photo from the public gallery?")) return;
    button.disabled = true;
    try {
      await SantosAPI.api(`/admin/gallery/${button.dataset.galleryDelete}`, { method: "DELETE" });
      await load();
    } catch (error) {
      button.disabled = false;
      setStatus(error.message || "Photo deletion failed.", "error");
    }
  });

  load();
})();
