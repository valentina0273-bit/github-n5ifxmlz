const { leerDB, verificarClave } = require('./store');

const PODERES = {
  BIBLIOTECARIO: [
    'Crear, editar y eliminar libros',
    'Registrar préstamos de cualquier estudiante',
    'Ver préstamos activos de un libro',
    'Registrar devoluciones'
  ],
  ESTUDIANTE: [
    'Ver el catálogo',
    'Solicitar un préstamo',
    'Ver y devolver sus préstamos'
  ]
};

function publico(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    poderes: PODERES[usuario.rol] || []
  };
}

function buscarPorId(id) {
  const db = leerDB();
  return db.usuarios.find((u) => u.id === Number(id)) || null;
}

function entrar(correo, clave) {
  const db = leerDB();
  const usuario = db.usuarios.find((u) => u.correo.toLowerCase() === String(correo).trim().toLowerCase());
  if (!usuario || !verificarClave(clave, usuario.claveHash)) return null;
  return publico(usuario);
}

function listarEstudiantes() {
  return leerDB().usuarios
    .filter((u) => u.rol === 'ESTUDIANTE')
    .map((u) => ({ id: u.id, nombre: u.nombre, correo: u.correo }));
}

module.exports = { publico, buscarPorId, entrar, listarEstudiantes };
