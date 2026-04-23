import bcrypt from "bcryptjs";
import { getConnection } from "./db_conectar.js";

const migrar = async () => {
  try {
    const conn = await getConnection();

    const [users] = await conn.query("SELECT id_usuario, contrasena FROM usuarios");

    for (const user of users) {

    
      if (user.contrasena.startsWith("$2")) {
        console.log(`Usuario ${user.id_usuario} ya está en hash`);
        continue;
      }

      const hash = await bcrypt.hash(user.contrasena, 10);

      await conn.query(
        "UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?",
        [hash, user.id_usuario]
      );

      console.log(`Usuario ${user.id_usuario} migrado ✔️`);
    }

    console.log("Mr- completa");

    process.exit();

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

migrar();