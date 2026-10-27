const express = require('express');
const session = require('express-session');
const usuarios = require('./src/data/usuarios');
const libros = require('./src/data/libros');
const prestamos = require('./src/data/prestamos');

const app = express();
app.use(express.json());
app.use(express.static('public'));
app.use(session({
  secret: process.env.SECRET_KEY || 'dev-grupo1-biblioteca',
  resave: false,
  saveUninitialized: false
}));

function actual(req) {
  if (!req.session.usuarioId) return null;
  const usuario = usuarios.buscarPorId(req.session.usuarioId);
  return usuario ? usuarios.publico(usuario) : null;
}

function exigeSesion(req, res, next) {
  const usuario = actual(req);
  if (!usuario) return res.status(401).json({ error: 'Debes iniciar sesión' });
  req.usuario = usuario;
  next();
}

function exigeRol(...roles) {
  return (req, res, next) => {
    const usuario = actual(req);
    if (!usuario) return res.status(401).json({ error: 'Debes iniciar sesión' });
    if (!roles.includes(usuario.rol)) {
      return res.status(403).json({ error: 'Tu rol no puede hacer esta acción' });
    }
    req.usuario = usuario;
    next();
  };
}

function responderError(res, error) {
  res.status(error.codigo || 400).json({ error: error.message });
}

app.post('/api/login', (req, res) => {
  const correo = req.body && req.body.correo;
  const clave = req.body && req.body.clave;
  if (!correo || !clave) return res.status(400).json({ error: 'correo y clave son obligatorios' });
  const usuario = usuarios.entrar(correo, clave);
  if (!usuario) return res.status(401).json({ error: 'Correo o clave incorrectos' });
  req.session.usuarioId = usuario.id;
  res.json(usuario);
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ mensaje: 'Sesión cerrada' }));
});

app.get('/api/sesion', (req, res) => {
  res.json({ usuario: actual(req) });
});

app.get('/api/libros', exigeSesion, (req, res) => {
  res.json(libros.obtenerTodos());
});

app.post('/api/libros', exigeRol('BIBLIOTECARIO'), (req, res) => {
  const { titulo, autor, categoria, ejemplaresTotales } = req.body || {};
  if (!titulo || !autor || !ejemplaresTotales) {
    return res.status(400).json({ error: 'titulo, autor y ejemplaresTotales son obligatorios' });
  }
  const totales = Number(ejemplaresTotales);
  if (!Number.isInteger(totales) || totales <= 0) {
    return res.status(400).json({ error: 'ejemplaresTotales debe ser un entero mayor que cero' });
  }
  res.status(201).json(libros.crear({
    titulo: String(titulo).trim(),
    autor: String(autor).trim(),
    categoria: categoria ? String(categoria).trim() : 'General',
    ejemplaresTotales: totales
  }));
});

app.put('/api/libros/:id', exigeRol('BIBLIOTECARIO'), (req, res) => {
  const libro = libros.obtenerPorId(req.params.id);
  if (!libro) return res.status(404).json({ error: 'El libro no existe' });
  const { titulo, autor, categoria, ejemplaresTotales } = req.body || {};
  const totales = Number(ejemplaresTotales);
  if (!titulo || !autor || !Number.isInteger(totales) || totales <= 0) {
    return res.status(400).json({ error: 'titulo, autor y ejemplaresTotales son obligatorios' });
  }
  const activos = prestamos.obtenerTodos().filter((p) => p.libroId === libro.id && p.estado === 'ACTIVO').length;
  if (totales < activos) {
    return res.status(400).json({ error: 'No se puede dejar el total por debajo de los préstamos activos' });
  }
  const prestados = libro.ejemplaresTotales - libro.ejemplaresDisponibles;
  const disponibles = totales - prestados;
  if (disponibles < 0) return res.status(400).json({ error: 'Los disponibles no pueden quedar negativos' });
  res.json(libros.actualizar(libro.id, {
    titulo: String(titulo).trim(),
    autor: String(autor).trim(),
    categoria: categoria ? String(categoria).trim() : 'General',
    ejemplaresTotales: totales,
    ejemplaresDisponibles: disponibles
  }));
});

app.delete('/api/libros/:id', exigeRol('BIBLIOTECARIO'), (req, res) => {
  const libro = libros.obtenerPorId(req.params.id);
  if (!libro) return res.status(404).json({ error: 'El libro no existe' });
  const activos = prestamos.obtenerTodos().filter((p) => p.libroId === libro.id && p.estado === 'ACTIVO');
  if (activos.length) return res.status(400).json({ error: 'No se puede eliminar un libro con préstamos activos' });
  libros.eliminar(libro.id);
  res.json({ mensaje: 'Libro eliminado' });
});

app.get('/api/estudiantes', exigeRol('BIBLIOTECARIO'), (req, res) => {
  res.json(usuarios.listarEstudiantes());
});

app.post('/api/prestamos', exigeSesion, (req, res) => {
  try {
    const libroId = req.body && req.body.libroId;
    const usuarioId = req.usuario.rol === 'ESTUDIANTE' ? req.usuario.id : req.body && req.body.usuarioId;
    if (!usuarioId) return res.status(400).json({ error: 'El bibliotecario debe indicar el estudiante' });
    const estudiante = usuarios.buscarPorId(usuarioId);
    if (!estudiante || estudiante.rol !== 'ESTUDIANTE') {
      return res.status(404).json({ error: 'El estudiante indicado no existe' });
    }
    const nuevo = prestamos.crear({
      libroId,
      usuarioId: estudiante.id,
      nombreEstudiante: estudiante.nombre
    });
    res.status(201).json(nuevo);
  } catch (error) {
    responderError(res, error);
  }
});

app.put('/api/prestamos/:id/devolver', exigeSesion, (req, res) => {
  try {
    res.json(prestamos.devolver(req.params.id, req.usuario));
  } catch (error) {
    responderError(res, error);
  }
});

app.get('/api/libros/:id/prestamos', exigeRol('BIBLIOTECARIO'), (req, res) => {
  try {
    res.json(prestamos.listarActivosDeLibro(req.params.id));
  } catch (error) {
    responderError(res, error);
  }
});

app.get('/api/prestamos', exigeRol('BIBLIOTECARIO'), (req, res) => {
  const catalogo = libros.obtenerTodos();
  const activos = prestamos.obtenerTodos()
    .filter((p) => p.estado === 'ACTIVO')
    .map((p) => {
      const libro = catalogo.find((l) => l.id === p.libroId);
      return { ...p, titulo: libro ? libro.titulo : null };
    });
  res.json(activos);
});

app.get('/api/mis-prestamos', exigeRol('ESTUDIANTE'), (req, res) => {
  res.json(prestamos.listarDeUsuario(req.usuario.id));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor activo en el puerto ' + PORT));
