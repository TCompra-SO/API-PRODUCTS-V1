import { App } from "./app";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import db from "./database/mongo";

// Declarar `io` en un alcance más amplio
let io: SocketIOServer;

const startApp = async () => {
  const app = App.getInstance();

  // Crear servidor HTTP y Socket.IO
  const server = createServer(app);
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",  // Permitir conexiones desde cualquier origen
    },
  });

  const port = process.env.PORT || 3002;

  db().then(() => console.log("Conectado a la BD"));

  // Manejar conexiones de Socket.IO
  io.on("connection", (socket) => {
    console.log(`Cliente conectado: ${socket.id}`);
    
    socket.on("disconnect", () => {
      console.log(`Cliente desconectado: ${socket.id}`);
    });
  });

  // Iniciar el servidor Express
  server.listen(port, () => {
    console.log(`Server running in port ${port}`);
  });

  return io;
};

const init = async () => {
  await startApp();
};

init();

export { io };
