import { getConnection } from "./db_conectar.js";

export const obtenerUsuario = async (usuario) => {
  const connection = await getConnection();

  const [rows] = await connection.query(
    "SELECT usuario, rol FROM usuarios WHERE usuario = ?",
    [usuario]
  );

  return rows;
};