1. Entidades libro y préstamo
2. Administrador / bibliotecario: gestiona el inventario de libros y prestamos
   Estudiante: solicita prestamos y hace las devoluciones de libros.
3. Libroprestamos 1-n
   Un libro puede tener muchos préstamos, pero cada préstamo pertenece a un único libro.
4. El sistema debe permitir un CRUD completo de los libros
   El sistema debe permitir registrar un préstamo de un libro a un estudiante, comprobando que existan ejemplares disponibles y restando en uno el campo ejemplaresDisponibles
   El sistema debe permitir registrar la devolución de un préstamo, suma uno a los disponibles y marca el préstamo como devuelto en ejemplaresDisponibles del libro prestado.
   El sistema debe permitir listar todos los préstamos activos de un libro específico.
   El sistema no debe dejar prestar un libro si no quedan ejemplares disponibles.

5. Las operaciones de préstamo y devolución tienen que ser atómicas (para que no se descuadren los números)
   Tiene que validar que las fechas tengan sentido
   Si hay interfaz, tiene que actualizarse sola sin recargar toda la página
   Los datos deben persistir, aunque se reinicie el servidor
