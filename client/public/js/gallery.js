(() => {
  const gallery = document.querySelector("#gallery");
  if (!gallery) return;
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));

  const modal = document.createElement("div");
  modal.className = "gallery-lightbox";
  modal.hidden = true;
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Expanded gallery image");
  modal.innerHTML = `<div class="gallery-lightbox-backdrop" data-lightbox-close></div><div class="gallery-lightbox-dialog"><button class="gallery-lightbox-close" type="button" aria-label="Close expanded image" data-lightbox-close>×</button><img class="gallery-lightbox-image" alt="" /><p class="gallery-lightbox-caption"></p></div>`;
  document.body.appendChild(modal);
  const modalImage = modal.querySelector(".gallery-lightbox-image");
  const modalCaption = modal.querySelector(".gallery-lightbox-caption");
  let lastFocused;

  const close = () => {
    modal.hidden = true;
    document.body.classList.remove("lightbox-open");
    lastFocused?.focus?.();
  };
  const open = (figure) => {
    const image = figure.querySelector("img");
    if (!image) return;
    lastFocused = document.activeElement;
    modalImage.src = image.currentSrc || image.src;
    modalImage.alt = image.alt || "Expanded Santos Soka Academy gallery image";
    modalCaption.textContent = figure.querySelector("figcaption")?.textContent?.trim() || image.alt || "";
    modal.hidden = false;
    document.body.classList.add("lightbox-open");
    modal.querySelector(".gallery-lightbox-close").focus();
  };

  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-lightbox-close]")) close();
  });
  document.addEventListener("keydown", (event) => {
    if (!modal.hidden && event.key === "Escape") close();
  });
  gallery.addEventListener("click", (event) => {
    if (event.target.closest("a")) return;
    const figure = event.target.closest("figure");
    if (figure) open(figure);
  });

  const load = async () => {
    if (!window.SantosAPI) return;
    try {
      const items = await SantosAPI.api("/gallery");
      if (!Array.isArray(items)) return;
      const fragment = document.createDocumentFragment();
      items.forEach((item) => {
        const figure = document.createElement("figure");
        figure.dataset.tag = item.category;
        figure.className = "gallery-managed-item";
        figure.innerHTML = `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.alt_text)}" loading="lazy" /><figcaption>${escapeHtml(item.title)}</figcaption>`;
        fragment.appendChild(figure);
      });
      gallery.prepend(fragment);
    } catch (error) {
      console.warn("[Gallery] Could not load managed gallery items", error);
    }
  };
  load();
})();
