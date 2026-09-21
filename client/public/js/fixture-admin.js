(() => {
  const form = document.querySelector("#fixture-form");
  const list = document.querySelector("#admin-fixtures");
  const status = document.querySelector("#fixture-admin-status");
  if (!form || !list) return;

  const setStatus = (message, kind = "") => {
    if (!status) return;
    status.textContent = message;
    status.className = `form-msg show ${kind}`.trim();
  };
  const rpcQuery = async (procedure) => SantosAPI.api(procedure === "fixtures.list" ? "/admin/fixtures" : "/fixtures");
  const rpcMutation = async (procedure, input) => {
    const isRemove = procedure === "fixtures.remove";
    return SantosAPI.api(isRemove ? `/admin/fixtures/${input.id}` : "/admin/fixtures", { method: isRemove ? "DELETE" : "POST", body: isRemove ? undefined : JSON.stringify(input) });
  };
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
  const formatDate = (date) => new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const renderFixtures = (fixtures) => {
    list.innerHTML = fixtures.length ? fixtures.map((fixture) => `<article class="admin-fixture-row"><div><strong>${escapeHtml(formatDate(fixture.fixtureDate))} · ${escapeHtml(fixture.fixtureTime)}</strong><span>${escapeHtml(fixture.team)} vs ${escapeHtml(fixture.opponent)}</span><small>${escapeHtml(fixture.venue)} · ${escapeHtml(fixture.competition)} · ${escapeHtml(fixture.status)}${fixture.score ? ` · ${escapeHtml(fixture.score)}` : ""}</small></div><button class="roster-delete" type="button" data-fixture-id="${fixture.id}">Remove</button></article>`).join("") : '<p class="empty-state">No fixtures have been added yet.</p>';
    list.querySelectorAll("[data-fixture-id]").forEach((button) => button.addEventListener("click", async () => {
      if (!window.confirm("Remove this fixture from the schedule?")) return;
      button.disabled = true;
      try {
        await rpcMutation("fixtures.remove", { id: Number(button.dataset.fixtureId) });
        setStatus("Fixture removed from the schedule.", "success");
        await loadFixtures();
      } catch (error) {
        button.disabled = false;
        setStatus(error.message, "error");
      }
    }));
  };
  const loadFixtures = async () => {
    try {
      renderFixtures(await rpcQuery("fixtures.list"));
    } catch (error) {
      setStatus(error.message, "error");
    }
  };
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    const data = new FormData(form);
    submit.disabled = true;
    setStatus("Saving fixture…");
    try {
      await rpcMutation("fixtures.create", {
        fixtureDate: data.get("fixtureDate"),
        fixtureTime: data.get("fixtureTime"),
        team: data.get("team"),
        opponent: data.get("opponent"),
        venue: data.get("venue"),
        competition: data.get("competition"),
        status: data.get("status"),
        score: data.get("score"),
        scorers: String(data.get("scorers") || "").split(",").map((name) => name.trim()).filter(Boolean),
      });
      form.reset();
      form.fixtureStatus.value = "Upcoming";
      form.fixtureVenue.value = "NCC Ground";
      setStatus("Fixture added to the schedule.", "success");
      await loadFixtures();
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      submit.disabled = false;
    }
  });
  loadFixtures();
})();
