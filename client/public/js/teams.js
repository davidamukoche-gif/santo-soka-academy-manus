(() => {
  const categoryNames = {
    "team-u6": "U6 media",
    "team-u8": "U8 media",
    "team-u10": "U10 media",
    "team-u12": "U12 media",
    "team-u13": "U13 media",
    "team-u14": "U14 media",
    "team-u16": "U16 media",
    "team-u18": "U18 media",
    "team-senior": "Senior media",
  };
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));

  const load = async () => {
    if (!window.SantosAPI) return;
    try {
      const items = await SantosAPI.api("/gallery");
      if (!Array.isArray(items)) return;
      items.filter((item) => categoryNames[item.category]).forEach((item) => {
        const id = item.category.replace("team-", "");
        const section = document.getElementById(id);
        const media = section?.querySelector(".team-media");
        if (!media) return;
        let list = media.querySelector("[data-team-media-list]");
        if (!list) {
          list = document.createElement("div");
          list.className = "team-media-uploaded";
          list.dataset.teamMediaList = id;
          media.appendChild(list);
        }
        list.classList.add("has-items");
        if (!list.querySelector(`[data-media-id="${CSS.escape(String(item.id))}"]`)) {
          const link = document.createElement("a");
          link.href = item.image_url;
          link.target = "_blank";
          link.rel = "noopener";
          link.title = item.title;
          link.dataset.mediaId = item.id;
          link.innerHTML = `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.alt_text)}" loading="lazy" />`;
          list.appendChild(link);
        }
        if (!list.querySelector(".team-media-uploaded-label")) {
          const label = document.createElement("span");
          label.className = "team-media-uploaded-label";
          label.textContent = categoryNames[item.category];
          list.prepend(label);
        }
      });
    } catch (error) {
      console.warn("[Teams] Could not load team media", error);
    }
  };
  load();
})();
