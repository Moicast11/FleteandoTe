require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./db');

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

// 🔵 Logging de todas las requests
app.use((req, res, next) => {
  console.log(`📍 [${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ ok: true, message: 'API y MySQL conectados' });
  } catch (error) {
    res.status(500).json({ ok: false, message: 'Error de conexion a MySQL', error: error.message });
  }
});

app.post('/api/register', async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ ok: false, message: 'nombre, email y password son obligatorios' });
  }

  try {
    const cleanNombre = String(nombre).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanRol = String(rol || 'user').trim();

    const [existingRows] = await pool.query('SELECT usuario_id FROM usuario WHERE email = ? LIMIT 1', [cleanEmail]);
    if (existingRows.length > 0) {
      return res.status(409).json({ ok: false, message: 'Ese email ya esta registrado' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);

    const [result] = await pool.query(
      `INSERT INTO usuario (nombre, email, contrasena_hash, rol, foto_url, creado_en)
       VALUES (?, ?, ?, ?, NULL, NOW())`,
      [cleanNombre, cleanEmail, hashedPassword, cleanRol]
    );

    return res.status(201).json({
      ok: true,
      message: 'Usuario registrado correctamente',
      data: { usuario_id: result.insertId, nombre: cleanNombre, email: cleanEmail, rol: cleanRol },
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al registrar usuario', error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: 'email y password son obligatorios' });
  }

  try {
    const cleanEmail = String(email).trim().toLowerCase();

    const [rows] = await pool.query(
      'SELECT usuario_id, nombre, email, contrasena_hash, rol FROM usuario WHERE email = ? LIMIT 1',
      [cleanEmail]
    );

    if (rows.length === 0) {
      return res.status(401).json({ ok: false, message: 'Credenciales invalidas' });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(String(password), user.contrasena_hash || '');

    if (!isValidPassword) {
      return res.status(401).json({ ok: false, message: 'Credenciales invalidas' });
    }

    return res.status(200).json({
      ok: true,
      message: 'Login correcto',
      data: {
        usuario_id: user.usuario_id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
      },
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al iniciar sesion', error: error.message });
  }
});

app.get('/api/pedidos/pendientes', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, u.nombre AS nombre_usuario
       FROM solicitud s
       JOIN usuario u ON s.usuario_id = u.usuario_id
       WHERE s.estado = 'pendiente'
       ORDER BY s.solicitud_id DESC`
    );

    return res.status(200).json({
      ok: true,
      message: 'Pedidos pendientes obtenidos correctamente',
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener pedidos pendientes',
      error: error.message,
    });
  }
});

app.post('/api/solicitudes', async (req, res) => {
  const usuarioId = Number(req.body?.usuario_id);
  const precioOfrecido = Number(req.body?.precio_ofrecido);
  const distanciaKm = Number(req.body?.distancia_km);

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.status(400).json({ ok: false, message: 'usuario_id invalido' });
  }

  if (!Number.isFinite(precioOfrecido) || precioOfrecido <= 0) {
    return res.status(400).json({ ok: false, message: 'precio_ofrecido invalido' });
  }

  if (!Number.isFinite(distanciaKm) || distanciaKm <= 0) {
    return res.status(400).json({ ok: false, message: 'distancia_km invalido' });
  }

  try {
    let empresaId = null;
    const [empresaRows] = await pool.query('SELECT empresa_id FROM empresa ORDER BY empresa_id ASC LIMIT 1');

    if (empresaRows.length > 0) {
      empresaId = Number(empresaRows[0].empresa_id);
    } else {
      const fallbackEmail = `sistema+${Date.now()}@fleteandote.local`;
      const [empresaResult] = await pool.query(
        `INSERT INTO empresa (nombre_empresa, email_empresarial, contrasena_hash)
         VALUES ('FleteandoTe Sistema', ?, 'NO_LOGIN')`,
        [fallbackEmail]
      );
      empresaId = Number(empresaResult.insertId);
    }

    const [result] = await pool.query(
      `INSERT INTO solicitud (usuario_id, empresa_id, precio_ofrecido, distancia_km, estado, hora_inicio, hora_fin)
       VALUES (?, ?, ?, ?, 'pendiente', NOW(), NULL)`,
      [usuarioId, empresaId, precioOfrecido, distanciaKm]
    );

    return res.status(201).json({
      ok: true,
      message: 'Solicitud creada correctamente',
      data: {
        solicitud_id: result.insertId,
        usuario_id: usuarioId,
        empresa_id: empresaId,
        precio_ofrecido: precioOfrecido,
        distancia_km: distanciaKm,
        estado: 'pendiente',
      },
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: `Error al crear solicitud: ${error.message}`, error: error.message });
  }
});

app.post('/api/pedidos/aceptar/:solicitudId', async (req, res) => {
  const solicitudId = Number(req.params.solicitudId);

  if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
    return res.status(400).json({ ok: false, message: 'solicitudId invalido' });
  }

  try {
    const [result] = await pool.query(
      `UPDATE solicitud
       SET estado = 'aceptado',
           hora_inicio = COALESCE(hora_inicio, NOW()),
           hora_fin = NOW()
       WHERE solicitud_id = ? AND estado = 'pendiente'`,
      [solicitudId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        message: 'El pedido no existe, ya fue tomado o no esta pendiente',
      });
    }

    return res.status(200).json({
      ok: true,
      message: 'Pedido aceptado correctamente',
      data: { solicitud_id: solicitudId, estado: 'aceptado' },
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al aceptar pedido', error: error.message });
  }
});

app.get('/api/historial/:usuarioId', async (req, res) => {
  const usuarioId = Number(req.params.usuarioId);

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.status(400).json({ ok: false, message: 'usuarioId invalido' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT
          s.solicitud_id,
          s.usuario_id,
          s.precio_ofrecido,
          s.distancia_km,
          s.estado,
          s.hora_inicio,
          s.hora_fin,
          COALESCE(s.hora_fin, s.hora_inicio) AS fecha_evento,
          u.nombre AS nombre_usuario,
          CASE
            WHEN s.usuario_id = ? THEN 'solicitud_usuario'
            ELSE 'pedido_transportista'
          END AS tipo_historial
        FROM solicitud s
        JOIN usuario u ON s.usuario_id = u.usuario_id
        WHERE s.usuario_id = ?
           OR s.estado = 'aceptado'
        ORDER BY s.solicitud_id DESC`,
      [usuarioId, usuarioId]
    );

    return res.status(200).json({
      ok: true,
      message: 'Historial obtenido correctamente',
      data: rows,
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: 'Error al obtener historial',
      error: error.message,
    });
  }
});

// --- Mensajes ---

app.post('/api/enviar-mensaje', async (req, res) => {
  const { flete_id, emisor_id, receptor_id, mensaje } = req.body;

  if (!flete_id || !emisor_id || !receptor_id || !mensaje) {
    return res.status(400).json({ ok: false, message: 'Todos los campos son obligatorios' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO mensajes (flete_id, emisor_id, receptor_id, mensaje, fecha_envio)
       VALUES (?, ?, ?, ?, NOW())`,
      [flete_id, emisor_id, receptor_id, mensaje]
    );

    return res.status(201).json({
      ok: true,
      message: 'Mensaje enviado correctamente',
      data: { id: result.insertId, flete_id, emisor_id, receptor_id, mensaje }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Error al enviar mensaje', error: error.message });
  }
});

app.get('/api/mensajes/:fleteId', async (req, res) => {
  const fleteId = Number(req.params.fleteId);

  console.log('🔵 GET /api/mensajes/:fleteId - fleteId:', fleteId);

  if (!fleteId) {
    console.error('❌ fleteId invalido');
    return res.status(400).json({ ok: false, message: 'fleteId invalido' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM mensajes WHERE flete_id = ? ORDER BY fecha_envio ASC',
      [fleteId]
    );

    console.log('✅ Mensajes encontrados:', rows.length);
    return res.status(200).json({
      ok: true,
      message: 'Mensajes obtenidos correctamente',
      data: rows
    });
  } catch (error) {
    console.error('❌ Error en BD:', error.message);
    return res.status(500).json({ ok: false, message: 'Error al obtener mensajes', error: error.message });
  }
});

// 🔴 Catch-all para rutas no encontradas
app.use((req, res) => {
  console.error(`❌ 404 - Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ ok: false, message: 'Ruta no encontrada', path: req.path, method: req.method });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend escuchando en http://0.0.0.0:${PORT}`);
});