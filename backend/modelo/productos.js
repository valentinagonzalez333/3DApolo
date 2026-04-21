
import { getConnection } from "./db_conectar.js";

export const obtenerProductos = async () => {
  const conexion = await getConnection();

  const [rows] = await conexion.execute(`
    SELECT 
      p.id_producto,
      p.nombre,
      c.nombre AS categoria,
      pr.nombre AS proveedor,
      p.precio_compra,
      p.precio_venta,
      p.stock,
      p.stock_minimo,
      p.descripcion,
      p.estado,
      p.url,
      p.iva,
      p.descuenti
    FROM productos p
    LEFT JOIN categorias c 
      ON p.categoria_id = c.id_categoria
    LEFT JOIN proveedor pr
      ON p.proveedor_id = pr.id_proveedor
  `);

  return rows;
};


export const insertarProducto = async (data) => {
  const conexion = await getConnection();

  await conexion.execute(`
    INSERT INTO productos
    (nombre, categoria_id, proveedor_id, precio_compra, precio_venta,
     stock, stock_minimo, iva, descuenti, descripcion, estado, url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, data);
};


export const actualizarProducto = async (id, data) => {
  const conexion = await getConnection();

  await conexion.execute(`
    UPDATE productos SET
      nombre = ?,
      categoria_id = ?,
      proveedor_id = ?,
      precio_compra = ?,
      precio_venta = ?,
      stock = ?,
      stock_minimo = ?,
      iva = ?,
      descuenti = ?,
      descripcion = ?,
      estado = ?,
      url = ?
    WHERE id_producto = ?
  `, [...data, id]);
};