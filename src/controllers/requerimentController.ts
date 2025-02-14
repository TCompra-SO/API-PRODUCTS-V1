import { Request, Response } from "express";
import { RequerimentService } from "../services/requerimentService";
import { io } from "../server"; // Importamos el objeto `io` de Socket.IO
import { transformData } from "../middlewares/requeriment.front.Interface";
import { NameAPI, TypeEntity, TypeSocket } from "../utils/Types";
import { OfferService } from "../services/offerService";
import { transformOffersData } from "../middlewares/offer.front.interface";
import { PurchaseOrderService } from "../services/purchaseOrderService";
import { JwtPayload } from "jsonwebtoken";
import { RequestExt } from "../interfaces/req-ext";

const createRequerimentController = async (req: RequestExt, res: Response) => {
  try {
    const { body, user } = req; // Extraemos `body` y `user` de `req`
    const { uid } = user as JwtPayload; // Obtenemos `uid` del usuario autenticado
    if (uid !== body.userID) {
      return res.status(403).json({
        success: false,
        code: 403,
        error: {
          msg: "El usuario no tiene acceso",
        },
      });
    }

    const responseUser = await RequerimentService.CreateRequeriment(body);
    if (responseUser.success) {
      const uid = responseUser.data?.uid;
      if (uid) {
        const dataPack = transformData(
          await RequerimentService.getRequerimentById(uid)
        );
        const typeSocket = TypeSocket.CREATE;
        const roomNameHome = `homeRequeriment${NameAPI.NAME}`;
        io.to(roomNameHome).emit("updateRoom", {
          dataPack,
          typeSocket: typeSocket,
          key: dataPack.data[0].key,
          userId: dataPack.data[0].subUser,
        });

        // enviamos a la sala de usuarios
        const roomName = `roomRequeriment${
          NameAPI.NAME + responseUser.data?.entityID
        }`;

        io.to(roomName).emit("updateRoom", {
          dataPack: dataPack,
          typeSocket: typeSocket,
          key: dataPack.data[0].key,
          userId: dataPack.data[0].subUser,
        });
      }

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

const selectOfferController = async (req: RequestExt, res: Response) => {
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
    let requerimentData = await RequerimentService.getRequerimentById(
      requerimentID
    );
    //ESTA PENDIENTE
    const { user } = req; // Extraemos `user` y `body` de la request
    const { uid } = user as JwtPayload; // Obtenemos `uid` del usuario autenticado
    if (
      uid !== requerimentData.data?.[0].userID &&
      uid !== requerimentData.data?.[0].entityID
    ) {
      return res.status(403).json({
        success: false,
        code: 403,
        error: {
          msg: "El usuario no tiene acceso",
        },
      });
    }
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
      const roomNameHome = `homeRequeriment${NameAPI.NAME}`;
      const requerimentUID = responseUser.data?.uid;
      if (requerimentUID) {
        //socket sala principal
        requerimentData = await RequerimentService.getRequerimentById(
          requerimentUID
        );
        io.to(roomNameHome).emit("updateRoom", {
          dataPack: transformData(requerimentData),
          typeSocket: TypeSocket.UPDATE,
          key: responseUser.data?.uid,
          userId: responseUser.data?.userID,
        });

        // socket sala de requerimientos
        const roomName = `roomRequeriment${
          NameAPI.NAME + responseUser.data?.entityID
        }`;

        io.to(roomName).emit("updateRoom", {
          dataPack: transformData(requerimentData),
          typeSocket: TypeSocket.UPDATE,
          key: responseUser.data?.uid,
          userId: responseUser.data?.userID,
        });
      }

      //socket sala de ofertas
      const uidOffer = responseUser.res?.offerUID;

      let offerData;
      if (uidOffer) {
        offerData = await OfferService.GetDetailOffer(uidOffer);
      }
      const offerTransform = transformOffersData(offerData);

      const roomNameOffer = `roomOffer${
        NameAPI.NAME + offerTransform.data[0].user
      }`;
      io.to(roomNameOffer).emit("updateRoom", {
        dataPack: offerTransform,
        typeSocket: TypeSocket.UPDATE,
        key: offerTransform.data[0].key,
        userId: offerTransform.data[0].subUser,
      });

      const purchaseOrderUID = responseUser.res?.purchaseOrderUID;
      if (purchaseOrderUID) {
        let purchaseOrderData = await PurchaseOrderService.getPurchaseOrderID(
          purchaseOrderUID
        );

        // socket PurchaseOrderProvider
        const roomNamePurchaseOrderProvider = `roomPurchaseOrderProvider${
          NameAPI.NAME + purchaseOrderData.data?.[0].userProviderID
        }`;
        io.to(roomNamePurchaseOrderProvider).emit("updateRoom", {
          dataPack: purchaseOrderData,
          typeSocket: TypeSocket.CREATE,
          key: purchaseOrderData.data?.[0].uid,
          userId: purchaseOrderData.data?.[0].subUserProviderID,
        });

        //SOCKET PURCHASEORDERCLIENT
        const roomNamePurchaseOrderClient = `roomPurchaseOrderClient${
          NameAPI.NAME + purchaseOrderData.data?.[0].userClientID
        }`;

        io.to(roomNamePurchaseOrderClient).emit("updateRoom", {
          dataPack: purchaseOrderData,
          typeSocket: TypeSocket.CREATE,
          key: purchaseOrderData.data?.[0].uid,
          userId: purchaseOrderData.data?.[0].subUserClientID,
        });
      }

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
      const requerimentData = responseUser.res?.socketData.data;

      if (requerimentData) {
        for (let i = 0; i < requerimentData.length; i++) {
          const roonNameHome = `homeRequeriment${NameAPI.NAME}`;
          const dataPack = await RequerimentService.getRequerimentById(
            requerimentData[i].uid
          );
          io.to(roonNameHome).emit("updateRoom", {
            dataPack: transformData(dataPack),
            typeSocket: TypeSocket.UPDATE,
            key: requerimentData[i].uid,
            userId: requerimentData[i].userID,
          });

          const roomName = `roomRequeriment${
            NameAPI.NAME + responseUser.res?.socketData.data?.[i].entityID
          }`;
          io.to(roomName).emit("updateRoom", {
            dataPack: transformData(dataPack),
            typeSocket: TypeSocket.UPDATE,
            key: requerimentData[i].uid,
            userId: requerimentData[i].userID,
          });
        }
      }
      res.status(responseUser.code).send(responseUser.res?.msg);
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

const deleteController = async (req: RequestExt, res: Response) => {
  try {
    const { uid } = req.params;
    const { user } = req;
    const { uid: userID } = user as JwtPayload;
    let requerimentData = await RequerimentService.getRequerimentById(uid);
    if (
      userID !== requerimentData.data?.[0].userID &&
      userID !== requerimentData.data?.[0].entityID
    ) {
      return res.status(403).json({
        success: false,
        code: 403,
        error: {
          msg: "El usuario no tiene acceso",
        },
      });
    }
    const responseUser = await RequerimentService.delete(uid);
    if (responseUser && responseUser.success) {
      //logica del Socket
      const requerimentID = responseUser.data;
      if (requerimentID) {
        requerimentData = await RequerimentService.getRequerimentById(
          responseUser.data
        );
        const roonNameHome = `homeRequeriment${NameAPI.NAME}`;
        io.to(roonNameHome).emit("updateRoom", {
          dataPack: transformData(requerimentData),
          typeSocket: TypeSocket.UPDATE,
          key: requerimentID,
          userId: requerimentData.data?.[0].userID,
        });

        const roomName = `roomRequeriment${
          NameAPI.NAME + requerimentData.data?.[0].entityID
        }`;

        io.to(roomName).emit("updateRoom", {
          dataPack: transformData(requerimentData), // Información relevante
          typeSocket: TypeSocket.UPDATE,
          key: requerimentID,
          userId: requerimentData.data?.[0].userID,
        });
      }

      const offerUIDs = responseUser.res?.socketData.offerUIDs;
      if (offerUIDs) {
        for (let i = 0; i < offerUIDs.length; i++) {
          const offerData = await OfferService.GetDetailOffer(offerUIDs[i]);
          const roomName = `roomOffer${
            NameAPI.NAME + offerData.data?.[i].entityID
          }`;
          io.to(roomName).emit("updateRoom", {
            dataPack: transformOffersData(offerData),
            typeSocket: TypeSocket.UPDATE,
            key: offerUIDs[i],
            userId: offerData.data?.[i].userID,
          });
          console.log(transformOffersData(offerData));
        }
      }
      //fin logica del socket
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

const republishController = async (req: RequestExt, res: Response) => {
  try {
    const { completion_date, uid } = req.body;
    const { user } = req;
    const { uid: userID } = user as JwtPayload;
    let requerimentData = await RequerimentService.getRequerimentById(uid);
    if (
      userID !== requerimentData.data?.[0].userID &&
      userID !== requerimentData.data?.[0].entityID
    ) {
      return res.status(403).json({
        success: false,
        code: 403,
        error: {
          msg: "El usuario no tiene acceso",
        },
      });
    }
    const responseUser = await RequerimentService.republish(
      uid,
      completion_date
    );
    if (responseUser && responseUser.success) {
      const roomNameHome = `homeRequeriment${NameAPI.NAME}`;
      const requerimentUID = responseUser.data?.uid;
      if (requerimentUID) {
        const requerimentData = await RequerimentService.getRequerimentById(
          requerimentUID
        );
        io.to(roomNameHome).emit("updateRoom", {
          dataPack: transformData(requerimentData), // Información relevante
          typeSocket: TypeSocket.UPDATE,
          key: responseUser.data?.uid,
          userId: responseUser.data?.userID,
        });

        const roomName = `roomRequeriment${
          NameAPI.NAME + responseUser.data?.entityID
        }`;

        io.to(roomName).emit("updateRoom", {
          dataPack: transformData(requerimentData), // Información relevante
          typeSocket: TypeSocket.UPDATE,
          key: responseUser.data?.uid,
          userId: responseUser.data?.userID,
        });
      }

      const offerUIDs = responseUser.res?.offerUids;
      if (offerUIDs) {
        for (let i = 0; i < offerUIDs.length; i++) {
          const offerData = await OfferService.GetDetailOffer(offerUIDs[i]);
          const roomName = `roomOffer${
            NameAPI.NAME + offerData.data?.[i].entityID
          }`;
          io.to(roomName).emit("updateRoom", {
            dataPack: transformOffersData(offerData),
            typeSocket: TypeSocket.UPDATE,
            key: offerUIDs[i],
            userId: offerData.data?.[i].userID,
          });
          
        }
      }

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

const culminateController = async (req: RequestExt, res: Response) => {
  try {
    const { requerimentID, delivered, score, comments } = req.body;

    const { user } = req;
    const { uid: userID } = user as JwtPayload;
    let requerimentData = await RequerimentService.getRequerimentById(
      requerimentID
    );
    if (
      userID !== requerimentData.data?.[0].userID &&
      userID !== requerimentData.data?.[0].entityID
    ) {
      return res.status(403).json({
        success: false,
        code: 403,
        error: {
          msg: "El usuario no tiene acceso",
        },
      });
    }

    const responseUser = await RequerimentService.culminate(
      requerimentID,
      delivered,
      score,
      comments
    );
    if (responseUser && responseUser.success) {
      // Requeriment
      const requerimentUID = responseUser.res?.requerimentUID;
      if (requerimentUID) {
        requerimentData = await RequerimentService.getRequerimentById(
          requerimentUID
        );
        const roomNameRequeriment = `roomRequeriment${
          NameAPI.NAME + requerimentData.data?.[0].entityID
        }`;
        io.to(roomNameRequeriment).emit("updateRoom", {
          dataPack: transformData(requerimentData), // Información relevante
          typeSocket: TypeSocket.UPDATE,
          key: requerimentData.data?.[0].uid,
          userId: requerimentData.data?.[0].userID,
        });
      }

      //Offer
      const offerUID = responseUser.res?.offerUID;

      if (offerUID) {
        const offerData = await OfferService.GetDetailOffer(offerUID);
        const roomNameOffer = `roomOffer${
          NameAPI.NAME + offerData.data?.[0].entityID
        }`;
        io.to(roomNameOffer).emit("updateRoom", {
          dataPack: transformOffersData(offerData), // Información relevante
          typeSocket: TypeSocket.UPDATE,
          key: offerData.data?.[0].uid,
          userId: offerData.data?.[0].userID,
        });
      }

      const purchaseOrderUID = responseUser.res?.purchaseOrderUID;
      if (purchaseOrderUID) {
        // PROVEEDOR
        const purchaseOrderData = await PurchaseOrderService.getPurchaseOrderID(
          purchaseOrderUID
        );
        const roomNameProvider = `roomPurchaseOrderProvider${
          NameAPI.NAME + purchaseOrderData.data?.[0].userProviderID
        }`;
        io.to(roomNameProvider).emit("updateRoom", {
          dataPack: purchaseOrderData, // Información relevante
          typeSocket: TypeSocket.UPDATE,
          key: purchaseOrderData.data?.[0].uid,
          userId: purchaseOrderData.data?.[0].subUserProviderID,
        });

        //CLIENT
        const roomNameClient = `roomPurchaseOrderClient${
          NameAPI.NAME + purchaseOrderData.data?.[0].userClientID
        }`;
        io.to(roomNameClient).emit("updateRoom", {
          dataPack: purchaseOrderData, // Información relevante
          typeSocket: TypeSocket.UPDATE,
          key: purchaseOrderData.data?.[0].uid,
          userId: purchaseOrderData.data?.[0].subUserClientID,
        });
      }

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

const canceledController = async (req: RequestExt, res: Response) => {
  try {
    const { requerimentID, reason } = req.body;
    const { user } = req;
    const { uid: userID } = user as JwtPayload;
    let requerimentData = await RequerimentService.getRequerimentById(
      requerimentID
    );
    if (
      userID !== requerimentData.data?.[0].userID &&
      userID !== requerimentData.data?.[0].entityID
    ) {
      return res.status(403).json({
        success: false,
        code: 403,
        error: {
          msg: "El usuario no tiene acceso",
        },
      });
    }

    const responseUser = await RequerimentService.canceled(
      requerimentID,
      reason
    );
    if (responseUser && responseUser.success) {
      const requerimentUid = responseUser.res?.requerimentUid;
      if (requerimentUid) {
        requerimentData = await RequerimentService.getRequerimentById(
          requerimentUid
        );
        //HOME
        const roomNameHomeRequeriment = `homeRequeriment${NameAPI.NAME}`;
        io.to(roomNameHomeRequeriment).emit("updateRoom", {
          dataPack: transformData(requerimentData), // Información relevante
          typeSocket: TypeSocket.UPDATE,
          key: requerimentData.data?.[0].uid,
          userId: requerimentData.data?.[0].userID,
        });
        //SALA
        const roomNameRequeriment = `roomRequeriment${
          NameAPI.NAME + requerimentData.data?.[0].entityID
        }`;
        io.to(roomNameRequeriment).emit("updateRoom", {
          dataPack: transformData(requerimentData), // Información relevante
          typeSocket: TypeSocket.UPDATE,
          key: requerimentData.data?.[0].uid,
          userId: requerimentData.data?.[0].userID,
        });
      }

      const selecOfferUid = responseUser.res?.selectOfferUid;
      if (selecOfferUid) {
        const offerData = await OfferService.GetDetailOffer(selecOfferUid);
        const roomNameOffer = `roomOffer${
          NameAPI.NAME + offerData.data?.[0].entityID
        }`;
        io.to(roomNameOffer).emit("updateRoom", {
          dataPack: transformOffersData(offerData), // Información relevante
          typeSocket: TypeSocket.UPDATE,
          key: offerData.data?.[0].uid,
          userId: offerData.data?.[0].userID,
        });
      }

      const purchaseOrderUID = responseUser.res?.purchaseOrderUid;
      if (purchaseOrderUID) {
        // PROVEEDOR
        const purchaseOrderData = await PurchaseOrderService.getPurchaseOrderID(
          purchaseOrderUID
        );
        const roomNameProvider = `roomPurchaseOrderProvider${
          NameAPI.NAME + purchaseOrderData.data?.[0].userProviderID
        }`;
        io.to(roomNameProvider).emit("updateRoom", {
          dataPack: purchaseOrderData, // Información relevante
          typeSocket: TypeSocket.UPDATE,
          key: purchaseOrderData.data?.[0].uid,
          userId: purchaseOrderData.data?.[0].subUserProviderID,
        });

        //CLIENT
        const roomNameClient = `roomPurchaseOrderClient${
          NameAPI.NAME + purchaseOrderData.data?.[0].userClientID
        }`;
        io.to(roomNameClient).emit("updateRoom", {
          dataPack: purchaseOrderData, // Información relevante
          typeSocket: TypeSocket.UPDATE,
          key: purchaseOrderData.data?.[0].uid,
          userId: purchaseOrderData.data?.[0].subUserClientID,
        });
      }

      const offerUids = responseUser.res?.offerUids;
      if (offerUids) {
        for (let i = 0; i < offerUids.length; i++) {
          const offerData = await OfferService.GetDetailOffer(offerUids[i]);
          const roomName = `roomOffer${
            NameAPI.NAME + offerData.data?.[i].entityID
          }`;
          io.to(roomName).emit("updateRoom", {
            dataPack: transformOffersData(offerData),
            typeSocket: TypeSocket.UPDATE,
            key: offerUids[i],
            userId: offerData.data?.[i].userID,
          });
        }
      }
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

    if (responseUser && responseUser.success) {
      // Si el tipo de usuario es "Company", crear una sala de Socket.IO
      if (typeUser === TypeEntity.COMPANY || typeUser === TypeEntity.USER) {
        const roomName = `roomRequeriment${userId}`;

        // Unir al socket a la sala (si es aplicable en este contexto)
        // Puedes enviar un evento o mensaje a todos los sockets en la sala
        // Emitir un mensaje a la sala
        io.to(roomName).emit(roomName, {
          message: `Sala ${roomName} actualizada`,
          dataPack: responseUser.data, // Información relevante
        });

        console.log(`Evento emitido a la sala ${roomName}`);
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
