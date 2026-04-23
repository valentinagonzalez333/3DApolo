async function cerrarSesion() {
  try {
    await fetch("/api/logout", {
      method: "POST",
      credentials: "include"
    });
  } catch (e) {}
  finally {
    sessionStorage.clear();
    window.location.replace("/login");
  }
}

// ── Protección ────────────────────────────────────────────────
async function verificarSesion() {
  const token = sessionStorage.getItem("token");

  if (!token) {
    window.location.replace("/login");
    return;
  }

  try {
    const res = await fetch("/api/me", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      sessionStorage.clear();
      window.location.replace("/login");
    }
  } catch {
    window.location.replace("/login");
  }
}

verificarSesion();