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
    socket.on("joinRoom", (room) => {
      if (room === "homeRequeriment") {
        socket.join("homeRequeriment"); // Unir al cliente a la sala 'home'
        console.log(
          `Usuario con ID ${socket.id} se ha unido a la sala ${room}`
        );
      } //AQUI PROGRMAR LAS SALAS
    });
    // El cliente se une a la sala 'home' (puedes hacer esto basado en la autenticación si lo deseas)
    socket.join("homeRequeriment"); // Esto hará que el cliente esté en la sala 'home'
    // Escuchar evento para recibir el ID del usuario
    socket.on("registerUser", (userId) => {
      if (!userId) {
        socket.emit("error", "Se requiere un ID de usuario válido");
        return;
      }
      console.log("idUsuario: " + userId);
      // Crear una sala con el nombre del ID del usuario
      socket.join("myRequeriment" + userId);
      console.log(`Usuario ${socket.id} se unió a su sala: ${userId}`);

      // Confirmar al cliente que se unió a la sala
      socket.emit("joinedRoom", `Te has unido a tu sala privada: ${userId}`);
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
