import { App } from "./app";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import db from "./database/mongo";
import "./initConfig";
import "./utils/cronJobs";
import { join } from "path";
// Declarar `io` en un alcance más amplio
let io: SocketIOServer;

const startApp = async () => {
  const app = App.getInstance();

  // Crear servidor HTTP y Socket.IO
  const server = createServer(app);
  io = new SocketIOServer(server, {
    cors: {
      origin: "*", // Permitir conexiones desde cualquier origen
    },
  });

  const port = process.env.PORT || 3002;

  db().then(() => console.log("Conectado a la BD"));

  // Cuando un usuario se conecta, se une a la sala 'home'
  io.on("connection", (socket) => {
    console.log("Nuevo usuario conectado", socket.id);
    // Escuchar evento de unión a la sala 'home'
    /*socket.on("joinRoom", (room) => {
      if (room === "homeRequeriment") {
        socket.join("homeRequeriment"); // Unir al cliente a la sala 'home'
        console.log(
          `Usuario con ID ${socket.id} se ha unido a la sala ${room}`
        );
      } // Verificar si es una sala 'myRequeriment<userId>'
      else if (room.startsWith("roomRequeriment")) {
        socket.join(room); // Unir al cliente a la sala específica
        console.log(
          `Usuario con ID ${socket.id} se ha unido a la sala ${room}`
        );
      }
      // Otras salas (opcional)
      else {
        console.log(`Sala desconocida: ${room}`);
      }
    });*/
    socket.on("joinRoom", (room) => {
      socket.join(room);
      console.log(`Usuario ${socket.id} se unió a la sala ${room}`);
      socket.emit("joinedRoom", `Te has unido a la sala ${room}`);
    });

    // Cuando un usuario se desconecta
    socket.on("disconnect", () => {
      console.log("Usuario desconectado", socket.id);
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
