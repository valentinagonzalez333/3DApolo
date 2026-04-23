import express from "express";
import { getConnection } from "./db_conectar.js";
import { obtenerGastosExpandidos } from "./gastos.js";

const router = express.Router();

// GET /api/reportes/movimientos?anio=2024&mes=4
router.get("/movimientos", async (req, res) => {
  try {
    const conn  = await getConnection();
    const ahora = new Date();

    const anio = parseInt(req.query.anio) || ahora.getFullYear();
    // parseInt puede devolver NaN si no viene — usar ?? después de parseInt
    const mes  = req.query.mes !== undefined ? parseInt(req.query.mes) : ahora.getMonth();

    // ── Ventas del mes ─────────────────────────────────────────────────────────
    const [ventas] = await conn.query(`
      SELECT
        id_ventas  AS id,
        'VENTA'    AS tipo,
        total      AS monto,
        fecha,
        'COMPLETADO' AS estado,
        CONCAT('Venta #', id_ventas) AS descripcion
      FROM ventas
      WHERE YEAR(fecha) = ? AND MONTH(fecha) = ?
      ORDER BY fecha DESC
    `, [anio, mes + 1]);

    // ── Compras únicas del mes ─────────────────────────────────────────────────
    const [compras] = await conn.query(`
      SELECT
        id_gastos  AS id,
        'COMPRA'   AS tipo,
        monto,
        fecha,
        'PAGADO'   AS estado,
        descripcion,
        frecuencia
      FROM gastos
      WHERE tipo = 'Compra'
        AND frecuencia = 'unica'
        AND YEAR(fecha) = ?
        AND MONTH(fecha) = ?
      ORDER BY fecha DESC
    `, [anio, mes + 1]);

    // ── Gastos recurrentes expandidos ──────────────────────────────────────────
    const gastosExpandidos = await obtenerGastosExpandidos(anio, mes);

    // Excluir compras únicas (ya están en el array anterior)
    const gastosDelMes = gastosExpandidos
      .filter(g => !(g.tipo === "Compra" && g.frecuencia === "unica"))
      .map(g => ({
        id:          g.id_gastos,
        tipo:        g.tipo === "Compra" ? "COMPRA" : "GASTO",
        monto:       g.monto_periodo,
        fecha:       g.fecha || g.fecha_inicio,
        estado:      "APLICADO",
        descripcion: g.descripcion + (g.veces > 1 ? ` (×${g.veces})` : ""),
        frecuencia:  g.frecuencia
      }));

    // ── Unión ordenada por fecha ───────────────────────────────────────────────
    const movimientos = [
      ...ventas,
      ...compras,
      ...gastosDelMes
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    // ── Resumen ────────────────────────────────────────────────────────────────
    const totalVentas  = ventas.reduce((s, v) => s + Number(v.monto), 0);
    const totalCompras = compras.reduce((s, c) => s + Number(c.monto), 0);
    const totalComprasRecurrentes = gastosDelMes
      .filter(g => g.tipo === "COMPRA")
      .reduce((s, g) => s + Number(g.monto), 0);
    const totalGastos  = gastosDelMes
      .filter(g => g.tipo === "GASTO")
      .reduce((s, g) => s + Number(g.monto), 0);

    const ganancia = totalVentas - totalCompras - totalComprasRecurrentes - totalGastos;

    res.json({
      periodo:     { anio, mes },
      movimientos,
      resumen: {
        totalVentas,
        totalCompras: totalCompras + totalComprasRecurrentes,
        totalGastos,
        ganancia
      }
    });

  } catch (error) {
    console.error("Error reportes:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

export default router;