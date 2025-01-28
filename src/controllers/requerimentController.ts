import { Request, Response } from "express";
import { RequerimentService } from "../services/requerimentService";
import { io } from "../server"; // Importamos el objeto `io` de Socket.IO
import { transformData } from "../middlewares/requeriment.front.Interface";
import { TypeEntity, TypeSocket } from "../utils/Types";

const createRequerimentController = async (
  { body }: Request,
  res: Response
) => {
  try {
    const responseUser = await RequerimentService.CreateRequeriment(body);
    if (responseUser.success) {
      // Emitimos un evento 'requerimentCreated' a todos los usuarios conectados
      //io.emit("requerimentCreated", responseUser);  // Emitir el nuevo requerimiento
      //io.emit("getRequeriments"); // Emitir el evento
      // Emitimos el evento 'getRequeriments' junto con los datos de responseUser
      //  io.to("home").emit("getRequeriments", transformData(responseUser));
      const dataPack = transformData(responseUser);
      const typeSocket = TypeSocket.CREATE;
      io.to("homeRequeriment").emit("requeriment", {
        dataPack,
        typeSocket: typeSocket,
        key: dataPack.data[0].key,
      });

      res.status(responseUser.code).send(transformData(responseUser));
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
    const { page, pageSize } = req.params;
    const responseUser = await RequerimentService.getRequeriments(
      Number(page),
      Number(pageSize)
    );

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

const getRequerimentsByEntityController = async (
  req: Request,
  res: Response
) => {
  try {
    const { uid, page, pageSize, fieldName, orderType } = req.params;
    const responseUser = await RequerimentService.getRequerimentsByEntity(
      uid,
      Number(page),
      Number(pageSize),
      fieldName,
      Number(orderType)
    );
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
    console.error("Error en getRequerimentByEntityController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const getRequerimentsBySubUserController = async (
  req: Request,
  res: Response
) => {
  try {
    const { uid, page, pageSize, fieldName, orderType } = req.params;
    const responseUser = await RequerimentService.getRequerimentsbySubUser(
      uid,
      Number(page),
      Number(pageSize),
      fieldName,
      Number(orderType)
    );
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
    console.error("Error en getRequerimentBySubUserController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const selectOfferController = async (req: Request, res: Response) => {
  try {
    const {
      requerimentID,
      offerID,
      observation,
      price_Filter,
      deliveryTime_Filter,
      location_Filter,
      warranty_Filter,
    } = req.body;
    const responseUser = await RequerimentService.selectOffer(
      requerimentID,
      offerID,
      observation,
      price_Filter,
      deliveryTime_Filter,
      location_Filter,
      warranty_Filter
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en selectOfferController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const getbasicRateDataController = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    console.log(uid);
    const responseUser = await RequerimentService.BasicRateData(uid);
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en BasicRateDataController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const expiredController = async (req: Request, res: Response) => {
  try {
    const responseUser = await RequerimentService.expired();
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en expiredController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const deleteController = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const responseUser = await RequerimentService.delete(uid);
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en deleteController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const republishController = async (req: Request, res: Response) => {
  try {
    const { completion_date, uid } = req.body;
    const responseUser = await RequerimentService.republish(
      uid,
      completion_date
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en republishController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const culminateController = async (req: Request, res: Response) => {
  try {
    const { requerimentID, delivered, score, comments } = req.body;
    const responseUser = await RequerimentService.culminate(
      requerimentID,
      delivered,
      score,
      comments
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en culminateController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const canceledController = async (req: Request, res: Response) => {
  try {
    const { requerimentID, reason } = req.body;
    const responseUser = await RequerimentService.canceled(
      requerimentID,
      reason
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en canceledController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const searchMainFiltersController = async (req: Request, res: Response) => {
  try {
    const {
      keyWords,
      location,
      category,
      startDate,
      endDate,
      companyId,
      page,
      pageSize,
    } = req.body;
    const responseUser = await RequerimentService.searchMainFilters(
      keyWords,
      Number(location),
      Number(category),
      startDate,
      endDate,
      companyId,
      Number(page),
      Number(pageSize)
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(transformData(responseUser));
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en searchMainFiltersController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const searchProductsByUserController = async (req: Request, res: Response) => {
  try {
    const {
      keyWords,
      userId,
      typeUser,
      page,
      pageSize,
      fieldName,
      orderType,
      filterColumn,
      filterData,
    } = req.body;
    const responseUser = await RequerimentService.searchProductsByUser(
      keyWords,
      userId,
      typeUser,
      Number(page),
      Number(pageSize),
      fieldName,
      orderType,
      filterColumn,
      filterData
    );

    console.log(typeUser);
    if (responseUser && responseUser.success) {
      // Si el tipo de usuario es "Company", crear una sala de Socket.IO
      if (typeUser === TypeEntity.COMPANY || typeUser === TypeEntity.USER) {
        const roomName = `roomRequeriment${userId}`;

        // Unir al socket a la sala (si es aplicable en este contexto)
        // Puedes enviar un evento o mensaje a todos los sockets en la sala
        io.to(roomName).emit("requeriment", {
          message: `Sala ${roomName} creada exitosamente para el usuario con ID ${userId}`,
        });

        console.log(`Sala ${roomName} creada para el usuario con ID ${userId}`);
      }
      res.status(responseUser.code).send(transformData(responseUser));
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en searchProductsByUserController", error);
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
  selectOfferController,
  expiredController,
  getbasicRateDataController,
  getRequerimentsByEntityController,
  getRequerimentsBySubUserController,
  deleteController,
  republishController,
  culminateController,
  canceledController,
  searchMainFiltersController,
  searchProductsByUserController,
};
