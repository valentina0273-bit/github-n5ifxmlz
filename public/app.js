let sesion = null;
let libros = [];

const aviso = document.getElementById('aviso');
const avisoLogin = document.getElementById('avisoLogin');

function mostrarAviso(texto, esError, destino) {
  const nodo = destino || aviso;
  nodo.textContent = texto || '';
  nodo.classList.toggle('error', Boolean(esError));
}

async function api(ruta, opciones) {
  const res = await fetch(ruta, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    ...opciones
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'No se pudo completar la operación');
  return data;
}

function formatearFecha(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return valor;
  return fecha.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
}

function pintarSesion() {
  const logueado = Boolean(sesion);
  document.getElementById('vistaLogin').classList.toggle('oculto', logueado);
  document.getElementById('vistaApp').classList.toggle('oculto', !logueado);
  document.getElementById('cajaUsuario').classList.toggle('oculto', !logueado);
  if (!logueado) return;
  document.getElementById('nombreUsuario').textContent = sesion.nombre;
  document.getElementById('rolUsuario').textContent = sesion.rol;
  const poderes = document.getElementById('listaPoderes');
  poderes.innerHTML = '';
  sesion.poderes.forEach((poder) => {
    const li = document.createElement('li');
    li.textContent = poder;
    poderes.appendChild(li);
  });
  const esBibliotecario = sesion.rol === 'BIBLIOTECARIO';
  document.getElementById('formLibro').classList.toggle('oculto', !esBibliotecario);
  document.getElementById('cajaEstudiante').classList.toggle('oculto', !esBibliotecario);
  document.getElementById('tituloPrestamos').textContent = esBibliotecario
    ? 'Préstamos activos'
    : 'Mis préstamos';
}

function filaLibro(libro) {
  const tr = document.createElement('tr');
  const tdAccion = document.createElement('td');
  if (sesion.rol === 'BIBLIOTECARIO') {
    const ver = document.createElement('button');
    ver.type = 'button';
    ver.className = 'secundario';
    ver.textContent = 'Activos';
    ver.addEventListener('click', () => cargarActivos(libro.id, libro.titulo));
    const borrar = document.createElement('button');
    borrar.type = 'button';
    borrar.className = 'peligro';
    borrar.textContent = 'Eliminar';
    borrar.addEventListener('click', () => eliminarLibro(libro.id));
    tdAccion.append(ver, document.createTextNode(' '), borrar);
  } else {
    tdAccion.textContent = libro.ejemplaresDisponibles > 0 ? 'Disponible' : 'Sin stock';
  }
  tr.innerHTML = '<td>' + libro.id + '</td><td>' + libro.titulo + '<br><span class="rol">' + libro.autor + ' · ' + libro.categoria + '</span></td><td>' + libro.ejemplaresDisponibles + '/' + libro.ejemplaresTotales + '</td>';
  tr.appendChild(tdAccion);
  return tr;
}

function pintarLibros() {
  const cuerpo = document.getElementById('tablaLibros');
  const select = document.getElementById('libroPrestamo');
  cuerpo.innerHTML = '';
  select.innerHTML = '';
  libros.forEach((libro) => {
    cuerpo.appendChild(filaLibro(libro));
    const opcion = document.createElement('option');
    opcion.value = libro.id;
    opcion.textContent = libro.titulo + ' (' + libro.ejemplaresDisponibles + ' disponibles)';
    select.appendChild(opcion);
  });
}

async function cargarLibros() {
  libros = await api('/api/libros');
  pintarLibros();
}

async function cargarEstudiantes() {
  if (sesion.rol !== 'BIBLIOTECARIO') return;
  const estudiantes = await api('/api/estudiantes');
  const select = document.getElementById('estudiantePrestamo');
  select.innerHTML = '';
  estudiantes.forEach((est) => {
    const opcion = document.createElement('option');
    opcion.value = est.id;
    opcion.textContent = est.nombre;
    select.appendChild(opcion);
  });
}

function filaPrestamo(prestamo) {
  const tr = document.createElement('tr');
  tr.innerHTML =
    '<td>' + prestamo.id + '</td>' +
    '<td>' + (prestamo.titulo || prestamo.libroId) + '</td>' +
    '<td>' + prestamo.nombreEstudiante + '</td>' +
    '<td>' + formatearFecha(prestamo.fechaPrestamo) + '</td>' +
    '<td>' + formatearFecha(prestamo.fechaDevolucion) + '</td>' +
    '<td>' + prestamo.estado + '</td>';
  const td = document.createElement('td');
  if (prestamo.estado === 'ACTIVO') {
    const boton = document.createElement('button');
    boton.type = 'button';
    boton.textContent = 'Devolver';
    boton.addEventListener('click', () => devolver(prestamo.id));
    td.appendChild(boton);
  }
  tr.appendChild(td);
  return tr;
}

function pintarPrestamos(lista, titulo) {
  const cuerpo = document.getElementById('tablaPrestamos');
  cuerpo.innerHTML = '';
  if (titulo) document.getElementById('tituloPrestamos').textContent = titulo;
  if (!lista.length) {
    cuerpo.innerHTML = "<tr><td colspan='7'>No hay préstamos.</td></tr>";
    return;
  }
  lista.forEach((prestamo) => cuerpo.appendChild(filaPrestamo(prestamo)));
}

async function cargarMios() {
  pintarPrestamos(await api('/api/mis-prestamos'), 'Mis préstamos');
}

async function cargarTodosActivos() {
  pintarPrestamos(await api('/api/prestamos'), 'Préstamos activos');
}

async function cargarActivos(libroId, titulo) {
  pintarPrestamos(await api('/api/libros/' + libroId + '/prestamos'), 'Activos de «' + titulo + '»');
}

async function refrescar() {
  await cargarLibros();
  if (sesion.rol === 'ESTUDIANTE') await cargarMios();
  else {
    await cargarEstudiantes();
    await cargarTodosActivos();
  }
}

document.getElementById('formLogin').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  try {
    sesion = await api('/api/login', {
      method: 'POST',
      body: JSON.stringify({
        correo: document.getElementById('correo').value,
        clave: document.getElementById('clave').value
      })
    });
    mostrarAviso('', false, avisoLogin);
    pintarSesion();
    await refrescar();
  } catch (error) {
    mostrarAviso(error.message, true, avisoLogin);
  }
});

document.getElementById('btnSalir').addEventListener('click', async () => {
  await api('/api/logout', { method: 'POST', body: '{}' });
  sesion = null;
  pintarSesion();
});

document.getElementById('formLibro').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  try {
    await api('/api/libros', {
      method: 'POST',
      body: JSON.stringify({
        titulo: document.getElementById('titulo').value,
        autor: document.getElementById('autor').value,
        categoria: document.getElementById('categoria').value,
        ejemplaresTotales: Number(document.getElementById('totales').value)
      })
    });
    evento.target.reset();
    mostrarAviso('Libro guardado');
    await refrescar();
  } catch (error) {
    mostrarAviso(error.message, true);
  }
});

document.getElementById('formPrestamo').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  try {
    const cuerpo = { libroId: Number(document.getElementById('libroPrestamo').value) };
    if (sesion.rol === 'BIBLIOTECARIO') {
      cuerpo.usuarioId = Number(document.getElementById('estudiantePrestamo').value);
    }
    await api('/api/prestamos', { method: 'POST', body: JSON.stringify(cuerpo) });
    mostrarAviso('Préstamo registrado');
    await refrescar();
  } catch (error) {
    mostrarAviso(error.message, true);
  }
});

async function devolver(prestamoId) {
  try {
    await api('/api/prestamos/' + prestamoId + '/devolver', { method: 'PUT', body: '{}' });
    mostrarAviso('Devolución registrada');
    await refrescar();
  } catch (error) {
    mostrarAviso(error.message, true);
  }
}

async function eliminarLibro(libroId) {
  try {
    await api('/api/libros/' + libroId, { method: 'DELETE' });
    mostrarAviso('Libro eliminado');
    await refrescar();
  } catch (error) {
    mostrarAviso(error.message, true);
  }
}

api('/api/sesion').then(async (data) => {
  sesion = data.usuario;
  pintarSesion();
  if (sesion) await refrescar();
}).catch(() => pintarSesion());
