import express from 'express';
import { getConnection } from './db_conectar.js';
import { verifyToken } from "../middlewares.js";

const router = express.Router();


router.get('/', verifyToken, async (req, res) => {
  try {
    const conn = await getConnection();

    const [rows] = await conn.query(`
      SELECT id_ventas, fecha, total, metodo_pago
      FROM ventas
      ORDER BY fecha DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

router.post('/', verifyToken, async (req, res) => {
  const conn = await getConnection();

  try {
    const { productos, metodo_pago } = req.body;

    if (!productos || productos.length === 0) {
      return res.status(400).json({ ok: false, msg: " vacío" });
    }

    const usuario_id = req.user.id;

    let total = 0;

    
    await conn.beginTransaction();

    for (const item of productos) {

      
      if (item.cantidad <= 0) {
        await conn.rollback();
        return res.status(400).json({ msg: "Cantidad inválida" });
      }

     const [prod] = await conn.query(
  "SELECT precio_venta, stock, descuenti, iva FROM productos WHERE id_producto = ? FOR UPDATE",
  [item.id]
);

      if (!prod.length) {
        await conn.rollback();
        return res.status(404).json({ msg: "Producto no existe" });
      }

      const base = prod[0].precio_venta;
const descuento = prod[0].descuenti || 0;
const iva = prod[0].iva || 0;

// precio con descuento
const precioConDescuento = base - (base * descuento / 100);

//  precio final con IVA
const precioFinal = precioConDescuento + (precioConDescuento * iva / 100);
      
      if (prod[0].stock < item.cantidad) {
        await conn.rollback();
        return res.status(400).json({ msg: "Stock insuficiente" });
      }

     total += precioFinal * item.cantidad;
    }

    // crear venta
    const [venta] = await conn.query(`
      INSERT INTO ventas (fecha, total, metodo_pago, usuario_id)
      VALUES (NOW(), ?, ?, ?)
    `, [total, metodo_pago, usuario_id]);

    const ventaId = venta.insertId;

    // insertar detalle + actualizar stock
    for (const item of productos) {

     const [prod] = await conn.query(
  "SELECT precio_venta, descuenti, iva FROM productos WHERE id_producto = ?",
  [item.id]
);

const base = prod[0].precio_venta;
const descuento = prod[0].descuenti || 0;
const iva = prod[0].iva || 0;

const precioConDescuento = base - (base * descuento / 100);
const precio = precioConDescuento + (precioConDescuento * iva / 100);

      await conn.query(`
        INSERT INTO detalle_venta
        (venta_id, producto_id, cantidad, precio, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `, [
        ventaId,
        item.id,
        item.cantidad,
        precio,
        precio * item.cantidad
      ]);

      await conn.query(`
        UPDATE productos
        SET stock = stock - ?
        WHERE id_producto = ?
      `, [item.cantidad, item.id]);
    }

    
    await conn.commit();

    res.json({ ok: true });

  } catch (error) {
    await conn.rollback();
    console.error(error);
    res.status(500).json({ ok: false });
  }
});

router.get('/detalle', verifyToken, async (req, res) => {
  try {
    const conn = await getConnection();

    const anio = parseInt(req.query.anio) || new Date().getFullYear();
    const mes  = parseInt(req.query.mes)  ?? new Date().getMonth();

    const [ventas] = await conn.query(`
      SELECT 
        v.id_ventas,
        v.fecha,
        v.total,
        v.metodo_pago,
        v.tipo_entrega,
        dv.cantidad,
        dv.precio,
        dv.subtotal,
        p.nombre AS producto
      FROM ventas v
      JOIN detalle_venta dv ON dv.venta_id = v.id_ventas
      JOIN productos p ON p.id_producto = dv.producto_id
      WHERE YEAR(v.fecha) = ? AND MONTH(v.fecha) = ?
      ORDER BY v.fecha DESC
    `, [anio, mes + 1]);

    res.json(ventas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false });
  }
});
export default router;
