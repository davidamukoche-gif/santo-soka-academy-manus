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

  const toPlayer = (player) => ({ ...player, playerName: player.player_name, imageUrl: player.image_url, displayOrder: player.display_order, isPublished: player.is_published });
  const rpcQuery = async (procedure, input) => {
    const path = procedure === "seniorPlayers.adminList" ? "/admin/senior-players" : "/senior-players";
    const rows = await SantosAPI.api(`${path}?season=${encodeURIComponent(input?.season || "2026/27")}`);
    return rows.map(toPlayer);
  };
  const rpcMutation = async (procedure, input) => {
    if (procedure === "seniorPlayers.remove") return SantosAPI.api(`/admin/senior-players/${input.id}`, { method: "DELETE" });
    if (procedure === "seniorPlayers.create") return SantosAPI.api("/admin/senior-players", { method: "POST", body: JSON.stringify(input) });
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
      card.innerHTML = `
        <img src="${player.imageUrl}" alt="${escapeHtml(player.playerName)} — ${escapeHtml(player.position)}" loading="lazy" />
        <div class="roster-card-body">
          <span class="chip">${escapeHtml(player.position)}</span>
          <h3>${escapeHtml(player.playerName)}</h3>
          <p>${escapeHtml(player.season)}</p>
          ${isAdmin ? `<button class="roster-delete" type="button" data-id="${player.id}">Remove player</button>` : ""}
        </div>`;
      roster.appendChild(card);
    });
    if (isAdmin) {
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
    if (!file) return setStatus("Choose a player image first.", "error");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setStatus("Use a JPEG, PNG, or WebP image.", "error");
    if (file.size > 5 * 1024 * 1024) return setStatus("Player images must be 5 MB or smaller.", "error");

    const submit = form.querySelector("button[type=submit]");
    submit.disabled = true;
    setStatus("Uploading player image and saving the register entry…");
    try {
      const imageData = await readFile(file);
      await rpcMutation("seniorPlayers.create", {
        season: form.season.value,
        playerName: form.playerName.value,
        position: form.position.value,
        displayOrder: Number(form.displayOrder.value || 0),
        imageData,
      });
      form.reset();
      form.season.value = "2026/27";
      form.displayOrder.value = "0";
      setStatus("Player added to the senior register.", "success");
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

  loadRoster();
})();
