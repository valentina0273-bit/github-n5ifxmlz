const { leerDB, guardarDB } = require('./store');

function obtenerTodos() {
  return leerDB().prestamos;
}

function siguienteId(lista) {
  return lista.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function crear(datos) {
  const db = leerDB();
  const libro = db.libros.find((l) => l.id === Number(datos.libroId));
  if (!libro) throw Object.assign(new Error('El libro no existe'), { codigo: 404 });
  if (libro.ejemplaresDisponibles <= 0) {
    throw Object.assign(new Error('No hay ejemplares disponibles'), { codigo: 400 });
  }
  const nuevo = {
    id: siguienteId(db.prestamos),
    libroId: libro.id,
    usuarioId: Number(datos.usuarioId),
    nombreEstudiante: datos.nombreEstudiante,
    fechaPrestamo: new Date().toISOString(),
    fechaDevolucion: null,
    estado: 'ACTIVO'
  };
  db.prestamos.push(nuevo);
  libro.ejemplaresDisponibles -= 1;
  guardarDB(db);
  return { ...nuevo, titulo: libro.titulo };
}

function devolver(id, usuario) {
  const db = leerDB();
  const prestamo = db.prestamos.find((p) => p.id === Number(id));
  if (!prestamo) throw Object.assign(new Error('El préstamo no existe'), { codigo: 404 });
  if (prestamo.estado !== 'ACTIVO') {
    throw Object.assign(new Error('Este préstamo ya fue devuelto'), { codigo: 400 });
  }
  if (usuario.rol === 'ESTUDIANTE' && prestamo.usuarioId !== usuario.id) {
    throw Object.assign(new Error('Solo puedes devolver tus préstamos'), { codigo: 403 });
  }
  const libro = db.libros.find((l) => l.id === prestamo.libroId);
  prestamo.estado = 'DEVUELTO';
  prestamo.fechaDevolucion = new Date().toISOString();
  if (libro) libro.ejemplaresDisponibles += 1;
  guardarDB(db);
  return { ...prestamo, titulo: libro ? libro.titulo : null };
}

function listarActivosDeLibro(libroId) {
  const db = leerDB();
  const libro = db.libros.find((l) => l.id === Number(libroId));
  if (!libro) throw Object.assign(new Error('El libro no existe'), { codigo: 404 });
  return db.prestamos
    .filter((p) => p.libroId === libro.id && p.estado === 'ACTIVO')
    .map((p) => ({ ...p, titulo: libro.titulo }));
}

function listarDeUsuario(usuarioId) {
  const db = leerDB();
  return db.prestamos
    .filter((p) => p.usuarioId === Number(usuarioId))
    .map((p) => {
      const libro = db.libros.find((l) => l.id === p.libroId);
      return { ...p, titulo: libro ? libro.titulo : null };
    });
}

module.exports = { obtenerTodos, crear, devolver, listarActivosDeLibro, listarDeUsuario };
