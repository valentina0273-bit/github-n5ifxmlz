const { leerDB, guardarDB } = require('./store');

function obtenerTodos() {
  return leerDB().libros;
}

function obtenerPorId(id) {
  return obtenerTodos().find((l) => l.id === Number(id)) || null;
}

function siguienteId(lista) {
  return lista.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function crear(datos) {
  const db = leerDB();
  const libro = {
    id: siguienteId(db.libros),
    titulo: datos.titulo,
    autor: datos.autor,
    categoria: datos.categoria,
    ejemplaresTotales: datos.ejemplaresTotales,
    ejemplaresDisponibles: datos.ejemplaresTotales
  };
  db.libros.push(libro);
  guardarDB(db);
  return libro;
}

function actualizar(id, datos) {
  const db = leerDB();
  const libro = db.libros.find((l) => l.id === Number(id));
  if (!libro) return null;
  Object.assign(libro, datos);
  guardarDB(db);
  return libro;
}

function eliminar(id) {
  const db = leerDB();
  db.libros = db.libros.filter((l) => l.id !== Number(id));
  guardarDB(db);
}

module.exports = { obtenerTodos, obtenerPorId, crear, actualizar, eliminar };
