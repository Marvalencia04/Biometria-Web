import express from "express";
import { createPool } from "mysql2/promise";
import { config } from "dotenv";
import cors from "cors"; // Importar CORS

config();

const pool = createPool({
  host: process.env.MYSQLDB_HOST,
  user: "root",
  password: process.env.MYSQLDB_ROOT_PASSWORD,
  port: process.env.MYSQLDB_PORT,
  database: process.env.MYSQLDB_DATABASE,
});

const app = express();
const PORT = process.env.NODE_DOCKER_PORT || 3000; // Añadir un valor por defecto

app.use(cors()); // Middleware para habilitar CORS
app.use(express.static("public")); // Para servir archivos estáticos como HTML
app.use(express.json()); // Middleware para parsear el cuerpo de las solicitudes JSON

// Ruta para obtener datos de la base de datos
app.get("/api/gases", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM Gases");
    res.json(rows);
  } catch (error) {
    console.error('Error en la consulta de gases:', error);
    res.status(500).send("Error retrieving data");
  }
});


app.post("/api/gases", async (req, res) => {
  // Extraer parámetros del cuerpo de la solicitud
  const { gas, valor, hora, lugar } = req.body;

  try {
    // Usar parámetros variables en la consulta SQL
    const [result] = await pool.query(
      "INSERT INTO Medidas.Gases (gas, valor, hora, lugar) VALUES (?, ?, ?, ?)", 
      [gas, valor, hora, lugar]  // Pasar los parámetros recibidos a la consulta
    );

    // Responder con la medida insertada
    res.status(201).json({
      id: result.insertId,
      gas, 
      valor, 
      hora, 
      lugar,
    });
  } catch (error) {
    console.error('Error al insertar medida:', error);

    // En caso de error, enviar un mensaje genérico
    res.status(500).json({
      error: 'Error al insertar medida',
      details: error.message,
    });
  }
});

//
app.listen(PORT, () => {
  console.log("Server is running on port", PORT);
});
export default app;