const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

let io;

const initializeWebSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Middleware para autenticación de WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Autenticación requerida'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'comprajunts_secret');
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Token inválido'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.user.id}`);

    // // Unirse a salas para cada lista del usuario
    // socket.on('joinLists', (lists) => {
    //   if (Array.isArray(lists)) {
    //     lists.forEach(listId => {
    //       socket.join(`list:${listId}`);
    //     });
    //   }
    // });

    // Unirse a salas para cada lista del usuario
    socket.on('joinLists', (lists) => {
      if (Array.isArray(lists)) {
        lists.forEach(listId => {
          socket.join(`list:${listId}`);
          console.log(`Usuario ${socket.user.id} unido a múltiples listas, incluyendo ${listId}`);
        });
      }
    });


    // // Escuchar cuando un usuario se une a una lista
    // socket.on('joinList', (listId) => {
    //   socket.join(`list:${listId}`);
    //   console.log(`Usuario ${socket.user.id} unido a la lista ${listId}`);
    // });
    
    // Escuchar cuando un usuario se une a una lista
    socket.on('joinList', (listId) => {
      socket.join(`list:${listId}`);
      console.log(`Usuario ${socket.user.id} unido a la lista ${listId}`);
      
      // Informar cuántos clientes hay en la sala
      const room = io.sockets.adapter.rooms.get(`list:${listId}`);
      const numClients = room ? room.size : 0;
      console.log(`Actualmente hay ${numClients} clientes en la sala list:${listId}`);
    });


    // Escuchar cuando un usuario abandona una lista
    socket.on('leaveList', (listId) => {
      socket.leave(`list:${listId}`);
      console.log(`Usuario ${socket.user.id} abandonó la lista ${listId}`);
    });

    // Desconexión
    socket.on('disconnect', () => {
      console.log(`Usuario desconectado: ${socket.user.id}`);
    });
  });

  return io;
};

// // Función para emitir actualizaciones a una sala específica
// const emitToList = (listId, event, data) => {
//   if (io) {
//     io.to(`list:${listId}`).emit(event, data);
//   }
// };

// Función para emitir actualizaciones a una sala específica
const emitToList = (listId, event, data) => {
  if (io) {
    console.log(`Emitiendo evento ${event} a sala list:${listId}`, data);
    io.to(`list:${listId}`).emit(event, data);
  } else {
    console.error(`No se pudo emitir evento ${event}: io no inicializado`);
  }
};

module.exports = {
  initializeWebSocket,
  emitToList,
  getIO: () => io
};