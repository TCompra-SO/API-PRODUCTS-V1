import { Request, Response } from "express";
import { OfferService } from "../services/offerService";
import { transformOffersData } from "../middlewares/offer.front.interface";
import { JwtPayload } from "jsonwebtoken";
import { RequestExt } from "../interfaces/req-ext";
import { io } from "../server";
import { NameAPI, TypeSocket } from "../utils/Types";
import { RequerimentService } from "../services/requerimentService";
import { transformData } from "../middlewares/requeriment.front.Interface";
import { PurchaseOrderService } from "../services/purchaseOrderService";

const CreateOfferController = async (req: RequestExt, res: Response) => {
  try {
    const { body, user } = req; // Extraemos `body` y `user` de `req`
    const { uid } = user as JwtPayload; // Obtenemos `uid` del usuario autenticado
    console.log(uid);
    console.log(body.userID);
    if (uid !== body.userID) {
      return res.status(403).json({
        success: false,
        code: 403,
        error: {
          msg: "El usuario no tiene acceso",
        },
      });
    }
    const responseUser = await OfferService.CreateOffer(body);
    if (responseUser.success) {
      const uid = responseUser.data?.uid;
      if (uid) {
        const offerData = await OfferService.GetDetailOffer(uid);
        const typeSocket = TypeSocket.CREATE;
        const roomNameHome = `roomOffer${
          NameAPI.NAME + offerData.data?.[0].entityID
        }`;
        io.to(roomNameHome).emit("updateRoom", {
          dataPack: transformOffersData(offerData),
          typeSocket: typeSocket,
          key: offerData.data?.[0].uid,
          userId: offerData.data?.[0].userID,
        });

        // enviamos a la sala de usuarios
        const requerimentUid = responseUser.res?.requerimentID;
        if (requerimentUid) {
          const requerimentData = await RequerimentService.getRequerimentById(
            requerimentUid
          );
          const roomName = `roomRequeriment${
            NameAPI.NAME + requerimentData.data?.[0].entityID
          }`;

          io.to(roomName).emit("updateRoom", {
            dataPack: transformData(requerimentData),
            typeSocket: TypeSocket.UPDATE,
            key: requerimentData.data?.[0].uid,
            userId: requerimentData.data?.[0].userID,
          });

          //enviamos al home
          const roomNameHome = `homeRequeriment${NameAPI.NAME}`;

          io.to(roomNameHome).emit("updateRoom", {
            dataPack: transformData(requerimentData),
            typeSocket: TypeSocket.UPDATE,
            key: requerimentData.data?.[0].uid,
            userId: requerimentData.data?.[0].userID,
          });
        }
      }
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en CreateOfferController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const GetDetailOfferController = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    const responseUser = await OfferService.GetDetailOffer(uid);

    if (responseUser.success) {
      res.status(responseUser.code).send(
        transformOffersData(
          responseUser as {
            success: boolean;
            code: number;
            data: any[];
            res: any;
          }
        )
      );
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en GetDatailOfferController");
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

const GetOffersController = async (req: RequestExt, res: Response) => {
  try {
    const { page, pageSize } = req.params;
    const responseUser = await OfferService.GetOffers(
      Number(page),
      Number(pageSize)
    );

    if (responseUser && responseUser.success) {
      if (responseUser.data) {
        res.status(responseUser.code).send(transformOffersData(responseUser));
      } else {
        // Si 'data' es undefined, puedes devolver un mensaje de error o manejarlo como prefieras
        res.status(404).send({
          success: false,
          msg: "No se encontraron requerimientos",
        });
      }
    }
  } catch (error) {
    console.error("Error en GetOffersController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

const GetOffersByEntityController = async (req: Request, res: Response) => {
  const { uid, page, pageSize } = req.params;
  try {
    const responseUser = await OfferService.getOffersByEntity(
      uid,
      Number(page),
      Number(pageSize)
    );
    if (responseUser && responseUser.success) {
      if (responseUser.data) {
        res.status(responseUser.code).send(transformOffersData(responseUser));
      } else {
        // Si 'data' es undefined, puedes devolver un mensaje de error o manejarlo como prefieras
        res.status(404).send({
          success: false,
          msg: "No se encontraron requerimientos",
        });
      }
    }
  } catch (error) {
    console.error("Error en GetOffersByEntityController");
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

const GetOffersBySubUserController = async (req: Request, res: Response) => {
  const { uid, page, pageSize } = req.params;
  try {
    const responseUser = await OfferService.getOffersBySubUser(
      uid,
      Number(page),
      Number(pageSize)
    );
    if (responseUser && responseUser.success) {
      if (responseUser.data) {
        res.status(responseUser.code).send(transformOffersData(responseUser));
      } else {
        // Si 'data' es undefined, puedes devolver un mensaje de error o manejarlo como prefieras
        res.status(404).send({
          success: false,
          msg: "No se encontraron requerimientos",
        });
      }
    }
  } catch (error) {
    console.error("Error en GetOffersBySubUserController");
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

const GetOffersByRequerimentController = async (
  req: Request,
  res: Response
) => {
  try {
    const { requerimentID, page, pageSize } = req.params;
    const responseUser = await OfferService.getOffersByRequeriment(
      requerimentID,
      Number(page),
      Number(pageSize)
    );
    if (responseUser && responseUser.success) {
      if (responseUser.data) {
        res.status(responseUser.code).send(transformOffersData(responseUser));
      } else {
        // Si 'data' es undefined, puedes devolver un mensaje de error o manejarlo como prefieras
        res.status(404).send({
          success: false,
          msg: "No se encontraron requerimientos",
        });
      }
    }
  } catch (error) {
    console.error("Error en GetOffersByRequerimentController");
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

const getbasicRateDataController = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    console.log(uid);
    const responseUser = await OfferService.BasicRateData(uid);
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

const deleteController = async (req: RequestExt, res: Response) => {
  try {
    const { uid: offerID } = req.params;
    let offerData = await OfferService.GetDetailOffer(offerID);
    const { user } = req; // Extraemos `user` y `body` de la request
    const { uid: userUID } = user as JwtPayload; // Obtenemos `uid` del usuario autenticado

    if (
      userUID !== offerData.data?.[0].userID &&
      userUID !== offerData.data?.[0].entityID
    ) {
      return res.status(403).json({
        success: false,
        code: 403,
        error: {
          msg: "El usuario no tiene acceso",
        },
      });
    }
    //LOGICA DE LOS SOCKETS
    const responseUser = await OfferService.deleteOffer(offerID);
    if (responseUser && responseUser.success) {
      const offerUid = responseUser.res?.offerID;
      if (offerUid) {
        offerData = await OfferService.GetDetailOffer(offerUid);
        const typeSocket = TypeSocket.UPDATE;
        const roomNameHome = `roomOffer${
          NameAPI.NAME + offerData.data?.[0].entityID
        }`;
        io.to(roomNameHome).emit("updateRoom", {
          dataPack: transformOffersData(offerData),
          typeSocket: typeSocket,
          key: offerData.data?.[0].uid,
          userId: offerData.data?.[0].userID,
        });
        const requerimentUid = responseUser.res?.requerimentID;
        if (requerimentUid) {
          // enviamos a la sala de usuarios
          const requerimenData = await RequerimentService.getRequerimentById(
            requerimentUid
          );
          const roomName = `roomRequeriment${
            NameAPI.NAME + requerimenData.data?.[0].entityID
          }`;

          io.to(roomName).emit("updateRoom", {
            dataPack: transformData(requerimenData),
            typeSocket: typeSocket,
            key: requerimenData.data?.[0].uid,
            userId: requerimenData.data?.[0].userID,
          });
          //home
          const roomNameHome = `homeRequeriment${NameAPI.NAME}`;

          io.to(roomNameHome).emit("updateRoom", {
            dataPack: transformData(requerimenData),
            typeSocket: typeSocket,
            key: requerimenData.data?.[0].uid,
            userId: requerimenData.data?.[0].userID,
          });
        }
      }
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

const culminateController = async (req: RequestExt, res: Response) => {
  try {
    const { offerID, delivered, score, comments } = req.body;

    let offerData = await OfferService.GetDetailOffer(offerID);
    const { user } = req; // Extraemos `user` y `body` de la request
    const { uid: userUID } = user as JwtPayload; // Obtenemos `uid` del usuario autenticado
    if (
      userUID !== offerData.data?.[0].userID &&
      userUID !== offerData.data?.[0].entityID
    ) {
      return res.status(403).json({
        success: false,
        code: 403,
        error: {
          msg: "El usuario no tiene acceso",
        },
      });
    }

    const responseUser = await OfferService.culminate(
      offerID,
      delivered,
      score,
      comments
    );
    if (responseUser && responseUser.success) {
      const typeSocket = TypeSocket.UPDATE;
      const offerUid = responseUser.res?.offerUid;
      // socket ofertas
      if (offerUid) {
        const offerData = await OfferService.GetDetailOffer(offerUid);
        const roomNameHome = `roomOffer${
          NameAPI.NAME + offerData.data?.[0].entityID
        }`;
        io.to(roomNameHome).emit("updateRoom", {
          dataPack: transformOffersData(offerData),
          typeSocket: typeSocket,
          key: offerData.data?.[0].uid,
          userId: offerData.data?.[0].userID,
        });
      }
      //socket requerimientos
      const requerimentUid = responseUser.res?.requerimentUid;
      if (requerimentUid) {
        const requerimenData = await RequerimentService.getRequerimentById(
          requerimentUid
        );
        const roomName = `roomRequeriment${
          NameAPI.NAME + requerimenData.data?.[0].entityID
        }`;

        io.to(roomName).emit("updateRoom", {
          dataPack: transformData(requerimenData),
          typeSocket: typeSocket,
          key: requerimenData.data?.[0].uid,
          userId: requerimenData.data?.[0].userID,
        });
      }
      //socket Ordenes de Compra
      const purchaseOderUid = responseUser.res?.purchaseOrderUid;
      if (purchaseOderUid) {
        const purchaseOrderData = await PurchaseOrderService.getPurchaseOrderID(
          purchaseOderUid
        );
        //Proveedor
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

const getValidationController = async (req: Request, res: Response) => {
  try {
    const { userID, requerimentID } = req.params;
    const responseUser = await OfferService.getValidation(
      userID,
      requerimentID
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getValidationController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const canceledController = async (req: RequestExt, res: Response) => {
  try {
    const { offerID, reason, canceledByCreator } = req.body;
    let offerData = await OfferService.GetDetailOffer(offerID);
    const { user } = req; // Extraemos `user` y `body` de la request
    const { uid: userUID } = user as JwtPayload; // Obtenemos `uid` del usuario autenticado
    let requerimentData = await RequerimentService.getRequerimentById(
      offerData.data?.[0].requerimentID
    );
    if (
      userUID !== offerData.data?.[0].userID &&
      userUID !== offerData.data?.[0].entityID &&
      userUID !== requerimentData.data?.[0].userID &&
      userUID !== requerimentData.data?.[0].entityID
    ) {
      return res.status(403).json({
        success: false,
        code: 403,
        error: {
          msg: "El usuario no tiene acceso",
        },
      });
    }

    const responseUser = await OfferService.canceled(
      offerID,
      reason,
      canceledByCreator
    );
    const typeSocket = TypeSocket.UPDATE;
    if (responseUser && responseUser.success) {
      const offerUid = responseUser.res?.offerUid;
      //Socket Offer
      if (offerUid) {
        const offerData = await OfferService.GetDetailOffer(offerUid);
        const roomNameHome = `roomOffer${
          NameAPI.NAME + offerData.data?.[0].entityID
        }`;
        io.to(roomNameHome).emit("updateRoom", {
          dataPack: transformOffersData(offerData),
          typeSocket: typeSocket,
          key: offerData.data?.[0].uid,
          userId: offerData.data?.[0].userID,
        });
      }

      //socket requerimientos
      const requerimentUid = responseUser.res?.requerimentUid;
      if (requerimentUid) {
        requerimenData = await RequerimentService.getRequerimentById(
          requerimentUid
        );
        const roomName = `roomRequeriment${
          NameAPI.NAME + requerimenData.data?.[0].entityID
        }`;

        io.to(roomName).emit("updateRoom", {
          dataPack: transformData(requerimenData),
          typeSocket: typeSocket,
          key: requerimenData.data?.[0].uid,
          userId: requerimenData.data?.[0].userID,
        });
        //home
        const roomNameHome = `homeRequeriment${NameAPI.NAME}`;

        io.to(roomNameHome).emit("updateRoom", {
          dataPack: transformData(requerimenData),
          typeSocket: typeSocket,
          key: requerimenData.data?.[0].uid,
          userId: requerimenData.data?.[0].userID,
        });
      }
      //socket Ordenes de Compra
      const purchaseOderUid = responseUser.res?.purchaseOrderUid;
      if (purchaseOderUid) {
        const purchaseOrderData = await PurchaseOrderService.getPurchaseOrderID(
          purchaseOderUid
        );
        //Proveedor
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
    console.error("Error en canceledController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const searchOffersByUserController = async (req: Request, res: Response) => {
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
    const responseUser = await OfferService.searchOffersByUser(
      keyWords,
      userId,
      typeUser,
      Number(page),
      Number(pageSize),
      fieldName,
      Number(orderType),
      filterColumn,
      filterData
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(transformOffersData(responseUser));
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en searchOffersByUserController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

export {
  CreateOfferController,
  GetDetailOfferController,
  GetOffersController,
  GetOffersByRequerimentController,
  getbasicRateDataController,
  GetOffersByEntityController,
  GetOffersBySubUserController,
  deleteController,
  culminateController,
  getValidationController,
  canceledController,
  searchOffersByUserController,
};
