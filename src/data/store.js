const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RUTA_DB = path.join(__dirname, 'db.json');

function hashClave(clave) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(clave, salt, 120000, 32, 'sha256').toString('hex');
  return salt + ':' + hash;
}

function verificarClave(clave, guardada) {
  const partes = String(guardada || '').split(':');
  if (partes.length !== 2) return false;
  const prueba = crypto.pbkdf2Sync(clave, partes[0], 120000, 32, 'sha256');
  const original = Buffer.from(partes[1], 'hex');
  if (prueba.length !== original.length) return false;
  return crypto.timingSafeEqual(prueba, original);
}

function baseInicial() {
  return {
    usuarios: [
      {
        id: 1,
        nombre: 'Harold Lozano',
        correo: 'haroldl@curso.edu',
        claveHash: hashClave('biblioteca123'),
        rol: 'BIBLIOTECARIO'
      },
      {
        id: 2,
        nombre: 'Maicol Giraldo',
        correo: 'maicol@curso.edu',
        claveHash: hashClave('estudiante123'),
        rol: 'ESTUDIANTE'
      },
      {
        id: 3,
        nombre: 'Alejandro Cardona',
        correo: 'alejandroc@curso.edu',
        claveHash: hashClave('estudiante123'),
        rol: 'ESTUDIANTE'
      },
      {
        id: 4,
        nombre: 'Ximena Giraldo',
        correo: 'ximena@curso.edu',
        claveHash: hashClave('estudiante123'),
        rol: 'ESTUDIANTE'
      },
      {
        id: 5,
        nombre: 'Valentina Aristizabal',
        correo: 'valentina@curso.edu',
        claveHash: hashClave('estudiante123'),
        rol: 'ESTUDIANTE'
      }
    ],
    libros: [
      {
        id: 1,
        titulo: 'Cien años de soledad',
        autor: 'Gabriel García Márquez',
        categoria: 'Novela',
        ejemplaresTotales: 2,
        ejemplaresDisponibles: 2
      },
      {
        id: 2,
        titulo: 'El principito',
        autor: 'Antoine de Saint-Exupéry',
        categoria: 'Cuento',
        ejemplaresTotales: 1,
        ejemplaresDisponibles: 1
      },
      {
        id: 3,
        titulo: 'La divina comedia',
        autor: 'Dante Alighieri',
        categoria: 'Literatura Medieval',
        ejemplaresTotales: 2,
        ejemplaresDisponibles: 2
      }
    ],
    prestamos: []
  };
}

function leerDB() {
  if (!fs.existsSync(RUTA_DB)) {
    fs.writeFileSync(RUTA_DB, JSON.stringify(baseInicial(), null, 2));
  }
  return JSON.parse(fs.readFileSync(RUTA_DB, 'utf-8'));
}

function guardarDB(db) {
  const temporal = RUTA_DB + '.tmp';
  fs.writeFileSync(temporal, JSON.stringify(db, null, 2));
  fs.renameSync(temporal, RUTA_DB);
}

module.exports = { leerDB, guardarDB, hashClave, verificarClave };
