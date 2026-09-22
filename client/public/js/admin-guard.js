(() => {
  const start = async () => {
    const profile = await SantosAPI.requireAdmin();
    if (!profile) {
      const returnTo = `${window.location.pathname}${window.location.search}`;
      window.location.replace(`/admin/login?returnTo=${encodeURIComponent(returnTo)}`);
      return;
    }
    document.documentElement.classList.add("admin-authorized");
    window.dispatchEvent(new CustomEvent("santos-admin-ready", { detail: profile }));
  };
  start();
})();
