import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  // Lee el token de cookie (local) O del header Authorization (producción con Vercel)
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

  if (!token) {
    if (req.path.startsWith("/api") || req.xhr) {
      return res.status(401).json({ ok: false, msg: "No autenticado" });
    }
    return res.redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    next();
  } catch (err) {
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