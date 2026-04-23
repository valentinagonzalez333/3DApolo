import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    // Si es una petición de API, responder con JSON
    if (req.path.startsWith("/api") || req.xhr) {
      return res.status(401).json({ ok: false, msg: "No autenticado" });
    }
    // Si es una página HTML, redirigir al login
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    // ── Headers anti-caché ────────────────────────────────────────────────────
    // Esto hace que el navegador NUNCA sirva esta página desde caché.
    // Al presionar "atrás", el navegador tendrá que pedirla al servidor de nuevo,
    // y si el token expiró o se hizo logout, redirigirá al login.
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    next();
  } catch (err) {
    // Token inválido o expirado
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/"
    });

    if (req.path.startsWith("/api") || req.xhr) {
      return res.status(401).json({ ok: false, msg: "Sesión expirada" });
    }
    return res.redirect("/login");
  }
};