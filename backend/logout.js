
async function cerrarSesion() {
  try {
    await fetch("/logout", {
      method: "POST",
      credentials: "include"
    });
  } catch (e) {
    
  } finally {
  
    sessionStorage.clear();
    
  
    window.location.replace("/login");
  }
}

//validación - protección
async function verificarSesion() {
  try {
    const res = await fetch("/api/me", { credentials: "include" });
    if (!res.ok) {
      sessionStorage.clear();
      window.location.replace("/login");
    }
  } catch {
    window.location.replace("/login");
  }
}


verificarSesion();