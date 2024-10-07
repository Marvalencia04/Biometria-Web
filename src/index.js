import express from "express";
import { createPool } from "mysql2/promise";
import { config } from "dotenv";
import cors from "cors";

// Cargar las variables de entorno desde el archivo .env
config();

/**
 * @brief Crea y configura una aplicación Express.
 *
 * Esta función crea una instancia de una aplicación Express,
 * configurando el pool de conexiones a la base de datos y las rutas necesarias.
 *
 * @param customPool Objeto de tipo Pool, que permite personalizar el pool de conexiones.
 *                   Si no se proporciona, se crea un pool utilizando las variables de entorno.
 * @returns {express.Application} La aplicación Express configurada.
 */
const createApp = (customPool) => {
  // Crear un pool de conexiones a la base de datos
  const pool = customPool || createPool({
    host: process.env.MYSQLDB_HOST,
    user: "root",
    password: process.env.MYSQLDB_ROOT_PASSWORD,
    port: process.env.MYSQLDB_PORT,
    database: process.env.MYSQLDB_DATABASE,
  });

  const app = express(); // Crear una nueva aplicación Express
  const PORT = process.env.NODE_DOCKER_PORT || 3000; // Establecer el puerto, con valor por defecto

  // Middleware para habilitar CORS
  app.use(cors());
  app.use(express.static("public")); // Middleware para servir archivos estáticos como HTML
  app.use(express.json()); // Middleware para parsear el cuerpo de las solicitudes JSON

  /**
   * @brief Ruta para obtener datos de gases desde la base de datos.
   *
   * Esta ruta maneja las solicitudes GET a "/api/gases",
   * ejecutando una consulta a la base de datos para obtener
   * la lista de gases y enviándola como respuesta.
   *
   * @returns {void}
   * @throws {Error} Si hay un problema con la consulta a la base de datos.
   */
  app.get("/api/gases", async (req, res) => {
    try {
      const [rows] = await pool.query("SELECT * FROM Gases"); // Ejecutar la consulta
      res.json(rows); // Enviar la respuesta con los datos obtenidos
    } catch (error) {
      console.error('Error en la consulta de gases:', error);
      res.status(500).send("Error retrieving data"); // Enviar error si la consulta falla
    }
  });

  /**
   * @brief Ruta para insertar un nuevo gas en la base de datos.
   *
   * Esta ruta maneja las solicitudes POST a "/api/gases",
   * extrayendo los parámetros del cuerpo de la solicitud e
   * insertando un nuevo registro en la base de datos.
   *
   * @param {Object} req Cuerpo de la solicitud que contiene los parámetros para el gas.
   * @param {string} req.body.gas El nombre del gas.
   * @param {number} req.body.valor El valor asociado al gas.
   * @param {string} req.body.hora La hora en que se mide el gas.
   * @param {string} req.body.lugar El lugar donde se mide el gas.
   * @param {Response} res Objeto de respuesta de Express para enviar la respuesta al cliente.
   * @returns {void}
   * @throws {Error} Si hay un problema al insertar el gas en la base de datos.
   */
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
        id: result.insertId, // Incluir el ID del nuevo gas insertado
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
        details: error.message, // Incluir detalles del error en la respuesta
      });
    }
  });

  // Iniciar el servidor en el puerto especificado
  app.listen(PORT, () => {
    console.log("Server is running on port", PORT);
  });

  return app; // Asegúrate de devolver la app
};

export default createApp; // Exportar la función que crea la app
