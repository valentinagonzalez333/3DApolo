
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import  {getConnection}  from './modelo/db_conectar.js';

//server
const app = express();
app.set('port',4000);
app.listen (app.get('port'));
console.log ("Servidor corriendo en puerto", app.get('port'));

//configuracion estatica para acceder a los archivos del frontend
app.use(express.static(path.join(__dirname, "../Frontend")));

//middleware 
app.use(cors({
    origin: 'http://localhost:4000',
}));
app.use(express.json());

//rutas

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/info.html"));
});
app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/login.html"));
});

//ruta para el login y consulta a la base de datos
app.post("/login", async (req, res) => {
  const { usuario, password } = req.body;

  try {
    const connection = await getConnection();

    const [resultados] = await connection.query(
      "SELECT usuario, rol FROM usuarios WHERE usuario = ? AND contrasena = ?",
      [usuario, password]
    );

    if (resultados.length > 0) {
      const user = resultados[0];

      res.json({ 
        ok: true,
        rol: user.rol,
        usuario: user.usuario
      });

    } else {
      res.json({ ok: false });
    }

  } catch (error) {
    console.log(error);
    res.status(500).json({ ok: false });
  }
});

app.get("/registro", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/registro.html"));
});


app.get("/inicio", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/admi/panel.html"));
});

app.get("/productos", async (req, res) => {
   const connection = await getConnection();
 const result =  await connection.query("SELECT * from productos");
res.json(result);

});



