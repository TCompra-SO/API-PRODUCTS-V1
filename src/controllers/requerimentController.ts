import { Request, Response } from "express";
import { RequerimentService } from "../services/requerimentService";
import { io } from "../server"; // Importamos el objeto `io` de Socket.IO
import { transformData } from "../middlewares/requeriment.front.Interface";

const createRequerimentController = async (
  { body }: Request,
  res: Response
) => {
  try {
    const responseUser = await RequerimentService.CreateRequeriment(body);
    if (responseUser.success) {
      // Emitimos un evento 'requerimentCreated' a todos los usuarios conectados
      //io.emit("requerimentCreated", responseUser);  // Emitir el nuevo requerimiento
      io.emit("getRequeriments"); // Emitir el evento

      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en CreateRequerimentController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const getRequerimentsController = async (req: Request, res: Response) => {
  try {
    const responseUser = await RequerimentService.getRequeriments();

    // Verifica si la respuesta es válida y contiene datos
    if (responseUser && responseUser.success) {
      if (responseUser.data) {
        res.status(responseUser.code).send(transformData(responseUser));
      } else {
        // Si 'data' es undefined, puedes devolver un mensaje de error o manejarlo como prefieras
        res.status(404).send({
          success: false,
          msg: "No se encontraron requerimientos",
        });
      }
    } else {
      // Manejar el error según la respuesta
      res
        .status(responseUser.code)
        .send(responseUser.error || { msg: "Error desconocido" });
    }
  } catch (error) {
    console.error("Error en getRequerimentsController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const getRequerimentIDController = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const responseUser = await RequerimentService.getRequerimentById(uid);
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getRequerimentIDController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

export {
  createRequerimentController,
  getRequerimentsController,
  getRequerimentIDController,
};
