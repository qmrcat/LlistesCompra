// Punto de entrada principal del servidor
const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const { initializeWebSocket } = require('./config/websocket');
const { sequelize } = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const listRoutes = require('./routes/listRoutes');
const itemRoutes = require('./routes/itemRoutes');
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');

// Inicializar la aplicación Express
const app = express();
const server = http.createServer(app);

// Configuración del puerto
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del cliente
app.use(express.static(path.join(__dirname, '../client')));

// Rutas API
app.use('/api/auth',  authRoutes);
app.use('/api/lists', listRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

// Ruta principal para servir la aplicación cliente
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Inicializar WebSocket
initializeWebSocket(server);

// Sincronizar la base de datos y arrancar el servidor
sequelize.sync({ alter: false }) // Cambiamos a false para evitar problemas con las restricciones de unicidad
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Servidor ejecutándose en el puerto ${PORT}`);
    });
  })
  .catch(err => {
    console.error('index.js: Error al inicializar la base de datos:', err);
  });