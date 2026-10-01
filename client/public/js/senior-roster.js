(() => {
  const page = document.querySelector("[data-roster-page]");
  if (!page) return;

  const isAdmin = page.dataset.rosterPage === "admin";
  const seasonSelect = document.querySelector("#season");
  const roster = document.querySelector(isAdmin ? "#admin-roster" : "#roster");
  const empty = document.querySelector("#roster-empty");
  const status = document.querySelector(isAdmin ? "#admin-status" : "#roster-status");
  const adminLogin = document.querySelector("#admin-login");
  const adminContent = document.querySelector("#admin-content");
  const sourceNote = document.querySelector("#roster-source-note");

  const setStatus = (message, kind = "") => {
    if (!status) return;
    status.textContent = message;
    status.className = `form-msg show ${kind}`.trim();
  };

  const toPlayer = (player) => ({ ...player, playerName: player.player_name, imageUrl: player.image_url, displayOrder: player.display_order, isPublished: player.is_published, profile: player.profile || "", appearances: player.appearances || 0, goals: player.goals || 0, assists: player.assists || 0, yellowCards: player.yellow_cards || 0, redCards: player.red_cards || 0, cleanSheets: player.clean_sheets || 0 });
  const rpcQuery = async (procedure, input) => {
    const path = procedure === "seniorPlayers.adminList" ? "/admin/senior-players" : "/senior-players";
    const rows = await SantosAPI.api(`${path}?season=${encodeURIComponent(input?.season || "2026/27")}`);
    return rows.map(toPlayer);
  };
  const rpcMutation = async (procedure, input) => {
    if (procedure === "seniorPlayers.remove") return SantosAPI.api(`/admin/senior-players/${input.id}`, { method: "DELETE" });
    if (procedure === "seniorPlayers.create") return SantosAPI.api("/admin/senior-players", { method: "POST", body: JSON.stringify(input) });
    if (procedure === "seniorPlayers.update") return SantosAPI.api(`/admin/senior-players/${input.id}`, { method: "PATCH", body: JSON.stringify(input) });
    throw new Error("Unsupported roster operation");
  };

  const renderRoster = (players) => {
    if (!roster) return;
    roster.innerHTML = "";
    if (sourceNote) sourceNote.hidden = !players.some((player) => String(player.playerName).trim().toLowerCase() === "wall kong");
    if (!players.length) {
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    players.forEach((player) => {
      const card = document.createElement("article");
      card.className = "roster-card";
      const stats = [
        ["Appearances", player.appearances], ["Goals", player.goals], ["Assists", player.assists],
        ["Yellow", player.yellowCards], ["Red", player.redCards],
        ...(String(player.position).toLowerCase() === "goalkeeper" ? [["Clean sheets", player.cleanSheets]] : []),
      ];
      card.innerHTML = `
        <img src="${player.imageUrl}" alt="${escapeHtml(player.playerName)} — ${escapeHtml(player.position)}" loading="lazy" />
        <div class="roster-card-body">
          <span class="chip">${escapeHtml(player.position)}</span>
          <h3>${escapeHtml(player.playerName)}</h3>
          <p>${escapeHtml(player.season)}</p>
          ${player.profile ? `<p class="roster-profile">${escapeHtml(player.profile)}</p>` : ""}
          <div class="roster-stats">${stats.map(([label, value]) => `<span><strong>${Number(value) || 0}</strong>${label}</span>`).join("")}</div>
          ${isAdmin ? `<div class="roster-actions"><button class="roster-edit" type="button" data-id="${player.id}">Edit player</button><button class="roster-delete" type="button" data-id="${player.id}">Remove player</button></div>` : ""}
        </div>`;
      roster.appendChild(card);
    });
    if (isAdmin) {
      roster.querySelectorAll(".roster-edit").forEach((button) => {
        button.addEventListener("click", () => populateForm(players.find((player) => Number(player.id) === Number(button.dataset.id))));
      });
      roster.querySelectorAll(".roster-delete").forEach((button) => {
        button.addEventListener("click", async () => {
          if (!window.confirm("Remove this player from the register?")) return;
          button.disabled = true;
          try {
            await rpcMutation("seniorPlayers.remove", { id: Number(button.dataset.id) });
            await loadRoster();
            setStatus("Player removed from the register.", "success");
          } catch (error) {
            button.disabled = false;
            setStatus(error.message, "error");
          }
        });
      });
    }
  };

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);

  const loadRoster = async () => {
    const season = seasonSelect?.value || "2026/27";
    const procedure = isAdmin ? "seniorPlayers.adminList" : "seniorPlayers.list";
    try {
      if (isAdmin && !(await SantosAPI.requireAdmin())) {
        window.location.replace(`/admin/login?returnTo=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      const players = await rpcQuery(procedure, { season });
      renderRoster(players);
      const heading = document.querySelector("#season-heading");
      if (heading) heading.textContent = `${season} squad`;
      if (isAdmin) {
        adminLogin.hidden = true;
        adminContent.hidden = false;
      }
      setStatus("");
    } catch (error) {
      if (isAdmin) {
        adminLogin.hidden = false;
        adminContent.hidden = true;
        setStatus("Administrator access is required to manage this register.", "error");
      } else {
        setStatus(error.message, "error");
      }
    }
  };

  seasonSelect?.addEventListener("change", loadRoster);
  document.querySelector("#player-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const file = form.image.files?.[0];
    const imageUrl = form.imageUrl.value.trim();
    const editingId = form.dataset.editingId;
    if (file && imageUrl) return setStatus("Use either an uploaded image or an image URL, not both.", "error");
    if (!editingId && !file && !imageUrl) return setStatus("Upload a player image or paste a public image URL.", "error");
    if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setStatus("Use a JPEG, PNG, or WebP image.", "error");
    if (file && file.size > 5 * 1024 * 1024) return setStatus("Player images must be 5 MB or smaller.", "error");
    if (imageUrl) {
      try {
        const parsed = new URL(imageUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      } catch {
        return setStatus("Paste a complete public image URL beginning with https://.", "error");
      }
    }

    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    setStatus(file ? "Uploading player image and saving the register entry…" : "Saving the image URL and register entry…");
    try {
      const input = {
        ...(editingId ? { id: Number(editingId) } : {}),
        season: form.season.value,
        playerName: form.playerName.value,
        position: form.position.value,
        displayOrder: Number(form.displayOrder.value || 0),
        profile: form.profile.value.trim(),
        appearances: nonNegative(form.appearances.value),
        goals: nonNegative(form.goals.value),
        assists: nonNegative(form.assists.value),
        yellowCards: nonNegative(form.yellowCards.value),
        redCards: nonNegative(form.redCards.value),
        cleanSheets: nonNegative(form.cleanSheets.value),
        ...(file ? { imageData: await readFile(file) } : imageUrl ? { imageUrl } : {}),
      };
      await rpcMutation(editingId ? "seniorPlayers.update" : "seniorPlayers.create", input);
      form.reset();
      form.season.value = "2026/27";
      form.displayOrder.value = "0";
      delete form.dataset.editingId;
      submit.textContent = "Add player to register →";
      setStatus(editingId ? "Player profile updated." : "Player added to the senior register.", "success");
      await loadRoster();
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      submit.disabled = false;
    }
  });

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Could not read the selected image."));
      reader.readAsDataURL(file);
    });
  }

  const nonNegative = (value) => Math.max(0, Math.min(999, Number.parseInt(value, 10) || 0));
  function populateForm(player) {
    if (!player) return;
    const form = document.querySelector("#player-form");
    form.dataset.editingId = player.id;
    for (const [field, value] of Object.entries({ playerName: player.playerName, season: player.season, position: player.position, displayOrder: player.displayOrder, profile: player.profile, appearances: player.appearances, goals: player.goals, assists: player.assists, yellowCards: player.yellowCards, redCards: player.redCards, cleanSheets: player.cleanSheets })) {
      if (form[field]) form[field].value = value ?? "";
    }
    form.image.value = "";
    form.imageUrl.value = "";
    form.querySelector("#player-submit").textContent = "Save player changes →";
    setStatus(`Editing ${player.playerName}. Add a new image only if you want to replace the current one.`);
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  loadRoster();
})();
