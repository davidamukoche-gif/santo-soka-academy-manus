(() => {
  const gallery = document.querySelector("#gallery");
  if (!gallery || !window.SantosAPI) return;

  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));

  const load = async () => {
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
