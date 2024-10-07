import { expect } from 'chai';
import request from 'supertest';
import sinon from 'sinon';
import app from '../src/index.js'; // Asegúrate de importar la app correcta
import { createPool } from 'mysql2/promise'; // Para las consultas a la base de datos

// Crear un stub para el pool de conexión
const poolStub = {
  query: sinon.stub()
};

// Usa el stub en lugar del pool real
const pool = createPool({
  host: process.env.MYSQLDB_HOST,
  user: "root",
  password: process.env.MYSQLDB_ROOT_PASSWORD,
  port: process.env.MYSQLDB_PORT,
  database: process.env.MYSQLDB_DATABASE,
});

// Reemplaza la conexión de la base de datos en la aplicación
app.set('db', poolStub);

describe("Gases API", () => {
  describe("GET /api/gases", () => {
    it("Debería obtener la lista de gases", async () => {
      // Simula la respuesta de la base de datos
      poolStub.query.withArgs("SELECT * FROM Gases").returns(Promise.resolve([[/* tus datos simulados aquí */]]));

      const res = await request(app).get("/api/gases");
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
    });
  });

  describe("POST /api/gases", () => {
    let insertedId;

    it("Debería insertar un nuevo gas", async () => {
      const gasData = {
        gas: "CO2",
        valor: 300,
        hora: "2024-10-05T10:00:00Z",
        lugar: "CiudadX",
      };

      // Simula la inserción en la base de datos
      poolStub.query.withArgs("INSERT INTO Gases SET ?", gasData).returns(Promise.resolve([{ insertId: 1 }]));

      const res = await request(app)
        .post("/api/gases")
        .send(gasData);

      expect(res.status).to.equal(201);
      expect(res.body).to.include({
        gas: gasData.gas,
        valor: gasData.valor,
        lugar: gasData.lugar,
      });
      expect(res.body).to.have.property("id", 1); // Verifica que haya una id generada

      // Almacena el id insertado para eliminar después
      insertedId = res.body.id;
    });

    it("Debería manejar errores al insertar un gas", async () => {
      const gasData = {
        gas: null, // Enviando datos inválidos
        valor: 300,
        hora: "2024-10-05T10:00:00Z",
        lugar: "CiudadX",
      };

      // Simula el error en la base de datos
      poolStub.query.withArgs("INSERT INTO Gases SET ?", gasData).returns(Promise.reject(new Error("Error al insertar")));

      const res = await request(app)
        .post("/api/gases")
        .send(gasData);

      expect(res.status).to.equal(500);
      expect(res.body).to.have.property("error");
    });
  });
});
