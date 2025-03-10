import axios from "axios";
import { OfferI } from "../interfaces/offer.interface";
import { OfferModel } from "../models/offerModel";
import { RequerimentService } from "./requerimentService";
import ProductModel from "../models/productModel";
import Fuse from "fuse.js";
import { PipelineStage, SortOrder } from "mongoose";
import {
  NameAPI,
  OfferState,
  OrderType,
  PurchaseOrderState,
  RequirementState,
  TypeEntity,
} from "../utils/Types";
import PurchaseOrderModel from "../models/purchaseOrder";
import { Console, error } from "node:console";
import { TypeUser } from "../utils/Types";
import { TypeRequeriment } from "../interfaces/purchaseOrder.interface";
import { object } from "joi";
let API_USER = process.env.API_USER;
export class OfferService {
  static CreateOffer = async (data: OfferI) => {
    const {
      name,
      email,
      description,
      cityID,
      deliveryTimeID,
      currencyID,
      warranty,
      timeMeasurementID,
      support,
      budget,
      includesIGV,
      includesDelivery,
      requerimentID,
      userID,
    } = data;

    try {
      const result = RequerimentService.getRequerimentById(requerimentID);
      const API_USER = process.env.API_USER;
      let entityID;
      let subUserEmail = "";
      let emailEntity;
      const resultData = await axios.get(
        `${API_USER}auth/getBaseDataUser/${userID}`
      );

      if (!resultData.data.success) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "No se ha podido encontrar la Entidad",
          },
        };
      } else {
        entityID = resultData.data.data[0]?.uid;
        // subUserEmail = resultData.data.data[0]?.auth_users?.email;
        subUserEmail = email;
        emailEntity = resultData.data.data[0]?.email;
      }

      if (entityID === (await result).data?.[0].entityID) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "No puedes ofertar a un requerimiento de tu Empresa",
          },
        };
      }

      const newOffer = new OfferModel({
        name,
        email: emailEntity,
        subUserEmail,
        description,
        cityID,
        deliveryTimeID,
        currencyID,
        warranty,
        timeMeasurementID,
        support,
        budget,
        includesIGV,
        includesDelivery,
        requerimentID,
        userID: userID,
        entityID: entityID,
        stateID: 1,
        publishDate: new Date(),
      });
      //SEGUIR ANALIZANDO LA CREACION
      const resultOffer = await this.GetOfferByUser(requerimentID, userID);

      const offerUserEntity = resultData.data.data?.[0].uid;

      const resultOfferEntity = await this.GetOfferByUser(
        requerimentID,
        offerUserEntity
      );

      const codeResponse = (await this.getValidation(userID, requerimentID))
        .data?.codeResponse;

      const validStates = [
        OfferState.ACTIVE,
        OfferState.WINNER,
        OfferState.DISPUTE,
        OfferState.FINISHED,
      ];

      if (codeResponse === 1) {
        return {
          success: false,
          code: 409,
          error: {
            msg: "Ya has realizado una oferta a este requerimiento",
          },
        };
      }

      if (codeResponse === 3 || codeResponse === 7) {
        return {
          success: false,
          code: 409,
          error: {
            msg: "Otro usuario ya ha realizado una oferta a este requerimiento",
          },
        };
      } else if (codeResponse === 4) {
        const savedOffer = await newOffer.save();
        if (savedOffer) {
          const dataRequeriment =
            RequerimentService.getRequerimentById(requerimentID);

          if ((await dataRequeriment).success === true) {
            const currentOffers =
              (await dataRequeriment).data?.[0].number_offers ?? 0; // Si 'number_offers' es undefined, usa 0

            const updateData = {
              number_offers: currentOffers + 1,
            };
            RequerimentService.updateRequeriment(requerimentID, updateData);
            RequerimentService.manageCount(
              entityID,
              userID,
              "numOffers" + NameAPI.NAME + "s",
              true
            );
          } else {
            return {
              success: false,
              code: 401,
              error: {
                msg: "No se ha podido encontrar el Requerimiento",
              },
            };
          }
        } else {
          return {
            success: false,
            code: 400,
            error: {
              msg: "Se ha producido un error al crear la Oferta",
            },
          };
        }
      } else {
        return {
          success: false,
          code: 403,
          error: {
            msg: "No se ha podido realizar la oferta",
          },
        };
      }

      return {
        success: true,
        code: 200,
        data: newOffer,
        res: {
          msg: "Se ha creado correctamente la Oferta",
          requerimentID: requerimentID,
        },
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno en el Servidor",
        },
      };
    }
  };

  static GetOfferByUser = async (requerimentID: string, userID: string) => {
    try {
      const offer = await OfferModel.findOne({ requerimentID, userID });

      if (offer) {
        return {
          success: true,
          code: 200,
          data: offer,
        };
      } else {
        return {
          success: false,
          code: 404,
          message:
            "No se encontró ninguna oferta con los datos proporcionados.",
        };
      }
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Ocurrió un error al intentar obtener la oferta.",
        },
      };
    }
  };

  static GetDetailOffer = async (uid: string) => {
    try {
      const detailOffer = await OfferModel.aggregate([
        // Fase de coincidencia para encontrar la oferta por UID
        { $match: { uid: uid } },
        // Fase de lookup para unir la colección Requeriment
        {
          $lookup: {
            from: "products", // Nombre de la colección de requerimientos, asegúrate de que sea correcto
            localField: "requerimentID", // Campo de la oferta
            foreignField: "uid", // Campo del requerimiento
            as: "requerimentDetails", // Nombre del campo que contendrá los detalles del requerimiento
          },
        },
        // Relacionar con la colección 'profiles' usando el campo 'userID'
        {
          $lookup: {
            from: "profiles", // Nombre de la colección de perfiles
            localField: "userID", // Campo en la colección 'Products'
            foreignField: "uid", // Campo en la colección 'Profiles'
            as: "profile", // Alias del resultado
          },
        },
        // Descomponer el array de perfiles (si existe)
        { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },

        // Relacionar con la colección 'companys' usando el campo 'userID'
        {
          $lookup: {
            from: "companys", // Nombre de la colección de compañías
            localField: "entityID", // Campo en la colección 'Products'
            foreignField: "uid", // Campo en la colección 'Companys'
            as: "company", // Alias del resultado
          },
        },
        // Descomponer el array de compañías (si existe)
        { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },

        // Relacionar con la colección 'companys' usando el campo 'userID'
        {
          $lookup: {
            from: "users", // Nombre de la colección de compañías
            localField: "entityID", // Campo en la colección 'Products'
            foreignField: "uid", // Campo en la colección 'Companys'
            as: "user", // Alias del resultado
          },
        },
        // Descomponer el array de usuarios (si existe)
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        // Fase de proyección para obtener solo los campos deseados
        {
          $project: {
            _id: 0, // Excluir el _id de la oferta
            uid: 1,
            name: 1,
            email: 1,
            subUserEmail: 1,
            description: 1,
            cityID: 1,
            deliveryTimeID: 1,
            currencyID: 1,
            warranty: 1,
            timeMeasurementID: 1,
            support: 1,
            budget: 1,
            includesIGV: 1,
            includesDelivery: 1,
            requerimentID: 1,
            stateID: 1,
            publishDate: 1,
            userID: 1,
            entityID: 1,
            files: 1,
            images: 1,
            canceledByCreator: 1,
            selectionDate: 1,
            delivered: 1,
            cancelRated: 1,
            requerimentTitle: {
              $arrayElemAt: ["$requerimentDetails.name", 0],
            }, // Extrae el campo 'name' del primer requerimiento encontrado
            subUserName: {
              $ifNull: ["$profile.name", "$company.name", "$user.name"],
            },
            userName: {
              $ifNull: ["$company.name", "$user.name", "$profile.name"],
            },
          },
        },
      ]);

      // Validar si se encontró la oferta
      if (detailOffer && detailOffer.length > 0) {
        return {
          success: true,
          code: 200,
          data: detailOffer,
        };
      } else {
        return {
          success: false,
          code: 404,
          error: {
            msg: "No se encontró ninguna oferta con los datos proporcionados.",
          },
        };
      }
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Ocurrió un error al intentar obtener la oferta.",
        },
      };
    }
  };

  static GetOffers = async (page: number, pageSize: number) => {
    try {
      if (!page || page < 1) page = 1; // Valor por defecto para la página
      if (!pageSize || pageSize < 1) pageSize = 10; // Valor por defecto para el tamaño de página
      const pipeline = [
        // Fase de lookup para unir la colección de productos
        {
          $lookup: {
            from: "products", // Nombre de la colección de productos (ProductModel)
            localField: "requerimentID", // Campo en OfferModel
            foreignField: "uid", // Campo en ProductModel que coincide
            as: "requerimentDetails", // Nombre del campo que contendrá los detalles del producto relacionado
          },
        },

        // Fase de proyección para obtener solo los campos deseados
        {
          $project: {
            _id: 0, // Excluir el _id de OfferModel
            uid: 1,
            name: 1,
            email: 1,
            subUserEmail: 1,
            description: 1,
            cityID: 1,
            deliveryTimeID: 1,
            currencyID: 1,
            warranty: 1,
            timeMeasurementID: 1,
            support: 1,
            budget: 1,
            includesIGV: 1,
            includesDelivery: 1,
            requerimentID: 1,
            stateID: 1,
            publishDate: 1,
            userID: 1,
            entityID: 1,
            files: 1,
            images: 1,
            canceledByCreator: 1,
            selectionDate: 1,
            delivered: 1,

            // Extrae el campo 'name' de `ProductModel` (en `requerimentDetails`) como `requerimentTitle`
            requerimentTitle: {
              $arrayElemAt: ["$requerimentDetails.name", 0],
            },
          },
        },
      ];
      const result = await OfferModel.aggregate([
        ...pipeline,
        {
          $sort: {
            publishDate: -1, // Orden descendente (más reciente primero)
          },
        },
        {
          $skip: (page - 1) * pageSize, // Saltar documentos según la página
        },
        {
          $limit: pageSize, // Limitar a la cantidad de documentos por página
        },
      ]);

      // Obtener el número total de documentos (sin paginación)
      const totalData = await OfferModel.aggregate(pipeline);
      const totalDocuments = totalData.length;

      if (result) {
        return {
          success: true,
          code: 200,
          data: result,
          res: {
            totalDocuments,
            totalPages: Math.ceil(totalDocuments / pageSize),
            currentPage: page,
            pageSize,
          },
        };
      } else {
        return {
          success: false,
          code: 403,
          error: {
            msg: "No se encontraron ofertas",
          },
        };
      }
    } catch (error) {
      console.error("Error al obtener las ofertas:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Hubo un error al obtener las ofertas.",
        },
      };
    }
  };

  static getOffersByRequeriment = async (
    requerimentID: string,
    page?: number,
    pageSize?: number
  ) => {
    if (!page || page < 1) page = 1;
    if (!pageSize || pageSize < 1) pageSize = 10;
    try {
      // const result = await OfferModel.find({ requerimentID });
      const pipeline = [
        // Fase de lookup para unir la colección de productos
        {
          $match: {
            requerimentID, // Filtra por el `requerimentID` proporcionado
            stateID: { $ne: 7 }, // Excluye los documentos con `stateID = 7`
          },
        },
        {
          $lookup: {
            from: "products", // Nombre de la colección de productos (ProductModel)
            localField: "requerimentID", // Campo en OfferModel
            foreignField: "uid", // Campo en ProductModel que coincide
            as: "requerimentDetails", // Nombre del campo que contendrá los detalles del producto relacionado
          },
        },

        // Fase de proyección para obtener solo los campos deseados
        {
          $project: {
            _id: 0, // Excluir el _id de OfferModel
            uid: 1,
            name: 1,
            email: 1,
            subUserEmail: 1,
            description: 1,
            cityID: 1,
            deliveryTimeID: 1,
            currencyID: 1,
            warranty: 1,
            timeMeasurementID: 1,
            support: 1,
            budget: 1,
            includesIGV: 1,
            includesDelivery: 1,
            requerimentID: 1,
            stateID: 1,
            publishDate: 1,
            userID: 1,
            entityID: 1,
            files: 1,
            images: 1,
            canceledByCreator: 1,
            selectionDate: 1,
            delivered: 1,

            // Extrae el campo 'name' de `ProductModel` (en `requerimentDetails`) como `requerimentTitle`
            requerimentTitle: {
              $arrayElemAt: ["$requerimentDetails.name", 0],
            },
            cancelRated: 1,
          },
        },
      ];
      const result = await OfferModel.aggregate([
        ...pipeline,
        {
          $sort: {
            publishDate: -1, // Orden descendente (más reciente primero)
          },
        },
        {
          $skip: (page - 1) * pageSize, // Saltar documentos según la página
        },
        {
          $limit: pageSize, // Limitar a la cantidad de documentos por página
        },
      ]);
      // Obtener el número total de documentos (sin paginación)
      const totalData = await OfferModel.aggregate(pipeline);
      const totalDocuments = totalData.length;
      return {
        success: true,
        code: 200,
        data: result,
        res: {
          totalDocuments,
          totalPages: Math.ceil(totalDocuments / pageSize),
          currentPage: page,
          pageSize,
        },
      };
    } catch (error) {
      console.error("Error al obtener las ofertas:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Hubo un error al obtener las ofertas.",
        },
      };
    }
  };

  static getOffersByEntity = async (
    uid: string,
    page: number,
    pageSize: number
  ) => {
    try {
      if (!page || page < 1) page = 1;
      if (!pageSize || pageSize < 1) pageSize = 10;

      const pipeline = [
        {
          $match: {
            entityID: uid,
            stateID: { $ne: 7 }, // Excluye los documentos con `stateID = 7`
          },
        },
        {
          $lookup: {
            from: "products", // Nombre de la colección de productos (ProductModel)
            localField: "requerimentID", // Campo en OfferModel
            foreignField: "uid", // Campo en ProductModel que coincide
            as: "requerimentDetails", // Nombre del campo que contendrá los detalles del producto relacionado
          },
        },

        // Fase de proyección para obtener solo los campos deseados
        {
          $project: {
            _id: 0, // Excluir el _id de OfferModel
            uid: 1,
            name: 1,
            email: 1,
            subUserEmail: 1,
            description: 1,
            cityID: 1,
            deliveryTimeID: 1,
            currencyID: 1,
            warranty: 1,
            timeMeasurementID: 1,
            support: 1,
            budget: 1,
            includesIGV: 1,
            includesDelivery: 1,
            requerimentID: 1,
            stateID: 1,
            publishDate: 1,
            userID: 1,
            entityID: 1,
            files: 1,
            images: 1,
            canceledByCreator: 1,
            selectionDate: 1,
            delivered: 1,

            // Extrae el campo 'name' de `ProductModel` (en `requerimentDetails`) como `requerimentTitle`
            requerimentTitle: {
              $arrayElemAt: ["$requerimentDetails.name", 0],
            },
            cancelRated: 1,
          },
        },
      ];
      const result = await OfferModel.aggregate([
        ...pipeline,
        {
          $sort: {
            publishDate: -1, // Orden descendente (más reciente primero)
          },
        },
        {
          $skip: (page - 1) * pageSize, // Saltar documentos según la página
        },
        {
          $limit: pageSize, // Limitar a la cantidad de documentos por página
        },
      ]);

      // Obtener el número total de documentos (sin paginación)
      const totalData = await OfferModel.aggregate(pipeline);
      const totalDocuments = totalData.length;
      return {
        success: true,
        code: 200,
        data: result,
        res: {
          totalDocuments,
          totalPages: Math.ceil(totalDocuments / pageSize),
          currentPage: page,
          pageSize,
        },
      };
    } catch (error) {
      console.error("Error al obtener las ofertas:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno en el Servidor.",
        },
      };
    }
  };

  static getOffersBySubUser = async (
    uid: string,
    page: number,
    pageSize: number
  ) => {
    if (!page || page < 1) page = 1;
    if (!pageSize || pageSize < 1) pageSize = 10;

    const pipeline = [
      {
        $match: {
          userID: uid,
          stateID: { $ne: 7 }, // Excluye los documentos con `stateID = 7`
        },
      },
      {
        $lookup: {
          from: "products", // Nombre de la colección de productos (ProductModel)
          localField: "requerimentID", // Campo en OfferModel
          foreignField: "uid", // Campo en ProductModel que coincide
          as: "requerimentDetails", // Nombre del campo que contendrá los detalles del producto relacionado
        },
      },

      // Fase de proyección para obtener solo los campos deseados
      {
        $project: {
          _id: 0, // Excluir el _id de OfferModel
          uid: 1,
          name: 1,
          email: 1,
          subUserEmail: 1,
          description: 1,
          cityID: 1,
          deliveryTimeID: 1,
          currencyID: 1,
          warranty: 1,
          timeMeasurementID: 1,
          support: 1,
          budget: 1,
          includesIGV: 1,
          includesDelivery: 1,
          requerimentID: 1,
          stateID: 1,
          publishDate: 1,
          userID: 1,
          entityID: 1,
          files: 1,
          images: 1,
          canceledByCreator: 1,
          selectionDate: 1,
          delivered: 1,
          cancelRated: 1,

          // Extrae el campo 'name' de `ProductModel` (en `requerimentDetails`) como `requerimentTitle`
          requerimentTitle: {
            $arrayElemAt: ["$requerimentDetails.name", 0],
          },
        },
      },
    ];
    try {
      const result = await OfferModel.aggregate([
        ...pipeline,
        {
          $sort: {
            publishDate: -1, // Orden descendente (más reciente primero)
          },
        },
        {
          $skip: (page - 1) * pageSize, // Saltar documentos según la página
        },
        {
          $limit: pageSize, // Limitar a la cantidad de documentos por página
        },
      ]);

      // Obtener el número total de documentos (sin paginación)
      const totalData = await OfferModel.aggregate(pipeline);
      const totalDocuments = totalData.length;

      return {
        success: true,
        code: 200,
        data: result,
        res: {
          totalDocuments,
          totalPages: Math.ceil(totalDocuments / pageSize),
          currentPage: page,
          pageSize,
        },
      };
    } catch (error) {
      console.error("Error al obtener las ofertas:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno en el Servidor.",
        },
      };
    }
  };

  static BasicRateData = async (offerID: string) => {
    try {
      const result = await OfferModel.aggregate([
        {
          // Match para encontrar el producto con el requerimentID
          $match: { uid: offerID },
        },

        {
          // Proyección de los campos requeridos
          $project: {
            _id: 0,
            uid: 1,
            title: "$name", // Título del producto
            userId: "$entityID", // ID del usuario en la oferta
            userName: "", // Nombre del usuario en la oferta
            userImage: "", // URL de imagen (asigna el campo correspondiente si existe)
            subUserId: "$userID", // ID de la entidad
            subUserName: "", // Nombre de la subentidad (agrega el campo si existe)
            canceledByCreator: 1,
          },
        },
      ]);

      // Verificamos si se encontró un resultado y lo devolvemos
      if (!result || result.length === 0) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "No se ha encontrado la oferta",
          },
        };
      }
      const userBase = await axios.get(
        `${API_USER}auth/getBaseDataUser/${result[0].subUserId}`
      );

      result[0].userImage = userBase.data.data?.[0].image;
      if (result[0].userId === result[0].subUserId) {
        result[0].userName = userBase.data.data?.[0].name;
        result[0].subUserName = userBase.data.data?.[0].name;
      } else {
        result[0].userName = userBase.data.data?.[0].name;
        result[0].subUserName = userBase.data.data?.[0].auth_users.name;
      }

      return {
        success: true,
        code: 200,
        data: result,
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno con el servidor",
        },
      };
    }
  };

  static updateStateOffer = async (
    offerId: any,
    state: OfferState,
    cond?: { [key: string]: any }
  ) => {
    try {
      const updatedOffer = await OfferModel.findOneAndUpdate(
        { ...cond, uid: offerId },
        {
          $set: {
            stateID: state,
          },
        },
        { new: true }
      );
      return updatedOffer;
    } catch (error) {
      throw error;
    }
  };

  static deleteOffer = async (offerId: string) => {
    try {
      const updatedOffer = await OfferService.updateStateOffer(
        offerId,
        OfferState.ELIMINATED,
        { stateID: OfferState.ACTIVE }
      );

      if (!updatedOffer)
        return {
          success: false,
          code: 404,
          error: {
            msg: "Oferta no encontrada o estado no permite eliminar",
          },
        };

      await RequerimentService.updateNumberOffersRequeriment(
        updatedOffer.requerimentID,
        false
      );
      //actualizamos contador
      await RequerimentService.manageCount(
        updatedOffer.entityID,
        updatedOffer.userID,
        "numDeleteOffers" + NameAPI.NAME + "s",
        true
      );
      //restamos
      await RequerimentService.manageCount(
        updatedOffer.entityID,
        updatedOffer.userID,
        "numOffers" + NameAPI.NAME + "s",
        false
      );
      return {
        success: true,
        code: 200,
        res: {
          msg: "Se eliminó la oferta exitosamente",
          offerID: offerId,
          requerimentID: updatedOffer.requerimentID,
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Ocurrió un error al intentar eliminar la oferta.",
        },
      };
    }
  };

  static culminate = async (
    offerID: string,
    delivered: boolean,
    score: number,
    comments?: string
  ) => {
    try {
      let offerUid;
      let requerimentUid;
      let purchaseOrderUid;
      const offerData = await OfferModel.findOne({
        uid: offerID,
      });
      if (!offerData) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "Oferta no encontrado",
          },
        };
      }

      if (offerData.stateID !== OfferState.WINNER) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "El estado de la Oferta no permite realizar esta acción",
          },
        };
      }

      const purchaseOrderData = await PurchaseOrderModel.aggregate([
        {
          $match: {
            offerID: offerID, // Sustituye por el valor real
          },
        },
      ]);
      // Corregir bien esto solo cambie CLIENT
      const requestBody = {
        typeScore: "Client", // Tipo de puntaje
        uidEntity: purchaseOrderData?.[0].userClientID, // ID de la empresa a ser evaluada
        uidUser: purchaseOrderData?.[0].userProviderID, // ID del usuario que evalua
        score: score, // Puntaje
        comments: comments, // Comentarios
      };

      const resultData = await axios.post(
        `${API_USER}score/registerScore/`,
        requestBody
      );

      if (!resultData.data.success) {
        return {
          success: false,
          code: 401,
          error: {
            msg: "No se ha podido calificar al usuario",
          },
        };
      }
      const requerimentID = purchaseOrderData?.[0].requerimentID;
      // AQUI USAR LA FUNCION EN DISPUTA //
      if (
        purchaseOrderData?.[0].scoreState?.scoreClient &&
        purchaseOrderData?.[0].scoreState?.deliveredClient !== delivered
      ) {
        purchaseOrderUid = (
          await this.inDispute(purchaseOrderData?.[0].uid, PurchaseOrderModel)
        ).uid;
        requerimentUid = (await this.inDispute(requerimentID, ProductModel))
          .uid;
        offerUid = (await this.inDispute(offerID, OfferModel)).uid;

        await OfferModel.updateOne(
          {
            uid: offerID,
          },
          {
            $set: {
              delivered: delivered,
            },
          }
        );

        return {
          success: true,
          code: 200,
          res: {
            msg: "El cliente ha reportado una discrepancia, por lo tanto el estado del proceso se ha marcado como EN DISPUTA.",
            offerUid,
            requerimentUid,
            purchaseOrderUid,
          },
        };
      } else {
        if (
          purchaseOrderData?.[0].scoreState?.scoreClient &&
          purchaseOrderData?.[0].scoreState?.deliveredClient === delivered
        ) {
          purchaseOrderUid = await PurchaseOrderModel.findOneAndUpdate(
            {
              requerimentID: requerimentID,
              offerID: offerID,
            },
            {
              $set: {
                "scoreState.scoreProvider": true,
                "scoreState.deliveredProvider": delivered,
                stateID: PurchaseOrderState.FINISHED,
              },
            },
            { new: true } // Devuelve el documento actualizado
          );
          purchaseOrderUid = purchaseOrderUid?.uid;
        } else {
          purchaseOrderUid = await PurchaseOrderModel.findOneAndUpdate(
            {
              requerimentID: requerimentID,
              offerID: offerID,
            },
            {
              $set: {
                "scoreState.scoreProvider": true,
                "scoreState.deliveredProvider": delivered,
                stateID: PurchaseOrderState.PENDING,
              },
            },
            { new: true } // Devuelve el documento actualizado
          );
          purchaseOrderUid = purchaseOrderUid?.uid;
        }

        offerUid = await OfferModel.findOneAndUpdate(
          {
            uid: offerID,
          },
          {
            $set: {
              stateID: OfferState.FINISHED,
              delivered: delivered,
            },
          },
          { new: true } // Retorna el documento después de la actualización
        );
        offerUid = offerUid?.uid;
        return {
          success: true,
          code: 200,
          res: {
            msg: "Se ha culminado correctamente la Oferta",
            offerUid,
            requerimentUid,
            purchaseOrderUid,
          },
        };
      }
    } catch (error) {
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno del servidor",
        },
      };
    }
  };

  static inDispute = async (uid: string, Model: any) => {
    try {
      const updateResult = await Model.updateOne(
        { uid },
        { $set: { stateID: PurchaseOrderState.DISPUTE } }
      );

      // Verificar si se actualizó algún documento
      if (updateResult.matchedCount === 0) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "No se encontró ninguna coincidencia para el UID proporcionado.",
          },
        };
      }

      return {
        success: true,
        code: 200,
        uid,
        res: {
          msg: "El estado se actualizó correctamente.",
        },
      };
    } catch (error) {
      console.error("Error en inDispute:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno del servidor.",
        },
      };
    }
  };

  static getValidation = async (userID: string, requerimentID: string) => {
    try {
      let typeUser;
      let entityID;
      let codeResponse;
      const userData = await axios.get(
        `${API_USER}auth/getBaseDataUser/${userID}`
      );

      if (userData.data.data[0].auth_users) {
        typeUser = userData.data.data[0].auth_users.typeEntity;
        entityID = userData.data.data[0].uid;
      } else {
        typeUser = userData.data.data[0].typeEntity;
        entityID = userData.data.data[0].uid;
      }
      const requerimentData = await ProductModel.aggregate([
        {
          $match: {
            entityID: entityID,
            uid: requerimentID, // Reemplaza con el valor que deseas buscar
            stateID: {
              $nin: [RequirementState.CANCELED, RequirementState.ELIMINATED],
            },
          },
        },
      ]);

      const resultData = await OfferModel.aggregate([
        {
          $match: {
            entityID: entityID,
            requerimentID: requerimentID, // Reemplaza con el valor que deseas buscar
            stateID: { $nin: [5, 7] },
          },
        },
      ]);
      // se ha Modificado AQUI /////////////////////// 02/12
      const resultFilterData = await OfferModel.find({
        requerimentID: requerimentID, // Buscar por requerimentID
        entityID: entityID,
        stateID: { $nin: [5, 7] }, // Excluir stateID 5 y 7
      });
      const offerUserID = resultData[0]?.userID;
      const offerEntityID = resultData[0]?.entityID;
      const offerState = resultData[0]?.stateID;
      const requerimentUserID = requerimentData[0]?.userID;
      const requerimentEntityID = requerimentData[0]?.entityID;
      const requerimentState = requerimentData[0]?.stateID;

      if (resultFilterData.length > 0 || requerimentData.length > 0) {
        if (resultData.length > 0) {
          if (typeUser === TypeEntity.SUBUSER) {
            //VERIFICAMOS SI EL USUARIO YA HIZO UNA OFERTA AL REQUERIMIENTO
            if (offerUserID === userID) {
              codeResponse = 1; // EL USUARIO HACE UNA OFERTA QUE YA HIZO
            } else if (
              offerUserID !== userID &&
              offerUserID === offerEntityID
            ) {
              codeResponse = 2; // HACE UNA OFERTA A UN REQUERIMIENTO QUE YA HA SIDO OFERTADO POR EL USUARIO PRINCIPAL DE LA EMPRESA
            } else {
              codeResponse = 3; // HACE UNA OFERTA A UN REQUERIMIENTO QUE YA HA SIDO OFERTADO POR OTRO SUBUSUARIO DE LA EMPRESA
            }
          } else if (offerUserID === userID) {
            codeResponse = 1; // HACE UNA OFERTA QUE YA HA REALIZADO
          } else if (offerUserID !== userID) {
            codeResponse = 3; // HACE UNA OFERTA A UN REQUERIMIENTO QUE YA HA SIDO OFERTADO POR OTRO SUBUSUARIO DE LA EMPRESA
          }
        } else {
          codeResponse = 4; /// esta entrando al 4 porque no hay offerID esta vacio
        }

        if (requerimentData.length > 0 && codeResponse === 4) {
          if (typeUser === TypeEntity.SUBUSER) {
            //VERIFICAMOS SI EL USUARIO INTENTA HACER UNA OFERTA A SU PROPIO REQUERIMIENTO
            if (requerimentUserID === userID) {
              codeResponse = 5; // El usuario intenta hacer una oferta a su propio requerimiento
            } else if (
              requerimentUserID !== userID &&
              requerimentUserID === requerimentEntityID
            ) {
              codeResponse = 6; //El usuario intenta hacer oferta al requerimiento del Usuario Principal de su empresa
            } else {
              codeResponse = 7; // El usuario intenta hacer una oferta al requerimiento de un subUsuario de la empresa
            }
          } else if (requerimentUserID === userID) {
            codeResponse = 5; // El usuario Principal intenta hacer una oferta a su propio requerimiento
          } else if (requerimentUserID !== userID) {
            codeResponse = 7; //El usuario  intenta hacer oferta a su propio requerimiento de otro subUsuario de la empresa
          }
        }
      } else {
        codeResponse = 4;
      }

      return {
        success: true,
        code: 200,
        data: {
          codeResponse: codeResponse,
          offerID: resultData[0]?.uid,
          requerimentID: requerimentData[0]?.uid,
        },
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno del servidor.",
        },
      };
    }
  };

  static canceled = async (
    offerID: string,
    reason?: string,
    canceledByCreator?: boolean
  ) => {
    try {
      const offerData = await this.GetDetailOffer(offerID);
      const stateID = offerData.data?.[0].stateID;
      const purchaseOrderData = await PurchaseOrderModel.findOne({
        offerID: offerID,
        stateID: PurchaseOrderState.PENDING,
      });
      const requerimentID = purchaseOrderData?.requerimentID;

      if (stateID === OfferState.CANCELED) {
        return {
          success: false,
          code: 400,
          error: {
            msg: "La Oferta ya fue cancelada",
          },
        };
      } else if (
        stateID === OfferState.WINNER ||
        purchaseOrderData?.stateID === PurchaseOrderState.PENDING
      ) {
        await OfferModel.updateOne(
          { uid: offerID }, // Busca el documento por el campo `uid`
          {
            $set: {
              stateID: OfferState.CANCELED, // Actualiza el campo `stateID`
              canceledByCreator: canceledByCreator, // Actualiza el campo `canceledByCreator`
            },
          }
        );
        await PurchaseOrderModel.updateOne(
          {
            uid: purchaseOrderData?.uid,
          },
          {
            $set: {
              stateID: PurchaseOrderState.CANCELED,
              canceledByCreator: false,
              reasonCancellation: reason,
            },
          }
        );

        await ProductModel.updateOne(
          { uid: requerimentID },
          {
            $set: {
              stateID: RequirementState.PUBLISHED,
            },
            $inc: {
              number_offers: -1, // Resta 1 a numOffers
            },
          }
        );

        return {
          success: true,
          code: 200,
          res: {
            msg: "La oferta fue cancelada con éxito",
            offerUid: offerID,
            requerimentUid: requerimentID,
            purchaseOrderUid: purchaseOrderData?.uid,
            requirementUserUid: purchaseOrderData?.userProviderID,
            requirementSubUserUid: purchaseOrderData?.subUserProviderID,
          },
        };
      } else {
        return {
          success: false,
          code: 403,
          error: {
            msg: "No se puede cancelar la oferta",
          },
        };
      }
    } catch (error) {
      console.log(error);
      return {
        succes: false,
        code: 500,
        error: {
          msg: "Error interno del servidor.",
        },
      };
    }
  };

  static searchOffersByUser = async (
    keyWords: string,
    userId: string,
    typeUser?: TypeEntity,
    page?: number,
    pageSize?: number,
    fieldName?: string,
    orderType?: OrderType,
    filterColumn?: string,
    filterData?: [string]
  ) => {
    page = !page || page < 1 ? 1 : page;
    pageSize = !pageSize || pageSize < 1 ? 10 : pageSize;
    let total = 0;
    try {
      if (!keyWords) {
        keyWords = "";
      }

      // Parámetro fieldName con valor por defecto 'publishDate'
      fieldName = fieldName ?? "publishDate";

      let userType, subUserName;
      if (typeUser === TypeEntity.COMPANY || typeUser === TypeEntity.USER) {
        userType = "entityID";
        subUserName = "subUserName";
      } else {
        userType = "userID";
        subUserName = "";
      }

      let tableName;

      switch (typeUser) {
        case TypeEntity.COMPANY:
          tableName = "companys";
          break;
        case TypeEntity.USER:
          tableName = "users";
          break;
        default:
          tableName = "companys";
          break;
      }

      if (fieldName === "cityName") {
        fieldName = "cityID";
      }

      let order: SortOrder = orderType === OrderType.ASC ? 1 : -1;

      const pipeline: PipelineStage[] = [
        {
          $lookup: {
            from: "products", // Nombre de la colección de productos (ProductModel)
            localField: "requerimentID", // Campo en OfferModel
            foreignField: "uid", // Campo en ProductModel que coincide
            as: "requerimentDetails", // Nombre del campo que contendrá los detalles del producto relacionado
          },
        },

        // Relacionar con la colección 'profiles' usando el campo 'userID'
        {
          $lookup: {
            from: "profiles", // Nombre de la colección de perfiles
            localField: "userID", // Campo en la colección 'Products'
            foreignField: "uid", // Campo en la colección 'Profiles'
            as: "profile", // Alias del resultado
          },
        },
        // Descomponer el array de perfiles (si existe)
        { $unwind: { path: "$profile", preserveNullAndEmptyArrays: true } },

        // Relacionar con la colección 'companys' usando el campo 'userID'
        {
          $lookup: {
            from: tableName, // Nombre de la colección de compañías
            localField: "entityID", // Campo en la colección 'Products'
            foreignField: "uid", // Campo en la colección 'Companys'
            as: "company", // Alias del resultado
          },
        },
        // Descomponer el array de compañías (si existe)
        { $unwind: { path: "$company", preserveNullAndEmptyArrays: true } },
        {
          $match: {
            $and: [
              { [userType]: userId },
              // { stateID: { $ne: OfferState.ELIMINATED } },
              {
                $or: [
                  { name: { $regex: keyWords, $options: "i" } }, // Búsqueda por el nombre
                  {
                    "requerimentDetails.name": {
                      $regex: keyWords,
                      $options: "i",
                    },
                  }, // Búsqueda por requerimentTitle
                ],
              },
              ...(filterColumn && filterData && filterData.length > 0
                ? [{ [filterColumn]: { $in: filterData } }] // Campo dinámico con valores de filterData
                : []), // Si no hay filterColumn o filterData, no añade esta condición
            ],
          },
        },
        // Fase de proyección para obtener solo los campos deseados
        {
          $project: {
            _id: 0, // Excluir el _id de OfferModel
            uid: 1,
            name: 1,
            email: 1,
            subUserEmail: 1,
            description: 1,
            cityID: 1,
            deliveryTimeID: 1,
            currencyID: 1,
            warranty: 1,
            timeMeasurementID: 1,
            support: 1,
            budget: 1,
            includesIGV: 1,
            includesDelivery: 1,
            requerimentID: 1,
            stateID: 1,
            publishDate: 1,
            userID: 1,
            entityID: 1,
            files: 1,
            images: 1,
            canceledByCreator: 1,
            selectionDate: 1,
            delivered: 1,

            // Extrae el campo 'name' de `ProductModel` (en `requerimentDetails`) como `requerimentTitle`
            requerimentTitle: {
              $arrayElemAt: ["$requerimentDetails.name", 0],
            },
            subUserName: { $ifNull: ["$profile.name", "$company.name"] },
            userName: { $ifNull: ["$company.name", "$profile.name"] },
            cancelRated: 1,
          },
        },
      ];
      // Primero intentamos hacer la búsqueda en MongoDB
      const skip = (page - 1) * pageSize;
      let results = await OfferModel.aggregate(pipeline)
        .sort({ [fieldName]: order })
        .skip(skip)
        .limit(pageSize)
        .collation({ locale: "en", strength: 2 });
      // Si no hay resultados en MongoDB, usamos Fuse.js para hacer una búsqueda difusa
      if (keyWords && results.length === 0) {
        // Crear un nuevo pipeline sin el filtro de palabras clave ($or)
        const pipelineWithoutKeyWords = pipeline
          .map((stage: any) => {
            if (stage.$match && stage.$match.$and) {
              // Filtrar las condiciones del $and eliminando únicamente las que contienen $or
              const remainingMatchConditions = stage.$match.$and.filter(
                (condition: any) => !condition.$or
              );

              // Si hay condiciones restantes, devolver el nuevo $match, si no, eliminar la etapa
              return remainingMatchConditions.length > 0
                ? { $match: { $and: remainingMatchConditions } }
                : null;
            }
            return stage; // Conservar las demás etapas ($lookup, $unwind, $project)
          })
          .filter((stage) => stage !== null);

        // Obtener todos los registros sin el filtro de palabras clave
        const allResults = await OfferModel.aggregate(pipelineWithoutKeyWords);

        // Configurar Fuse.js
        const fuse = new Fuse(allResults, {
          keys: ["name", "requerimentTitle", subUserName], // Las claves por las que buscar (name y description)
          threshold: 0.4, // Define qué tan "difusa" puede ser la coincidencia
        });

        // Buscar usando Fuse.js
        results = fuse.search(keyWords).map((result) => result.item);

        // Asegurar que fieldName tenga un valor predeterminado antes de ser usado
        const sortField = fieldName ?? "publishDate"; // Si fieldName es undefined, usar "publish_date"

        // Ordenar los resultados por el campo dinámico sortField
        results.sort((a, b) => {
          const valueA = a[sortField];
          const valueB = b[sortField];

          if (typeof valueA === "string" && typeof valueB === "string") {
            // Usar localeCompare para comparar cadenas ignorando mayúsculas, minúsculas y acentos
            return (
              valueA.localeCompare(valueB, undefined, {
                sensitivity: "base",
              }) * (orderType === OrderType.ASC ? 1 : -1)
            );
          }

          if (valueA > valueB) return orderType === OrderType.ASC ? 1 : -1;
          if (valueA < valueB) return orderType === OrderType.ASC ? -1 : 1;
          return 0; // Si son iguales, no cambiar el orden
        });

        // Total de resultados encontrados
        total = results.length;

        // Aplicar paginación sobre los resultados ordenados de Fuse.js
        const start = (page - 1) * pageSize;
        results = results.slice(start, start + pageSize);
      } else {
        // Si encontramos resultados en MongoDB, el total es la cantidad de documentos encontrados
        const resultData = await OfferModel.aggregate(pipeline);
        total = resultData.length;
      }

      return {
        success: true,
        code: 200,
        data: results,
        res: {
          totalDocuments: total,
          totalPages: Math.ceil(total / pageSize),
          currentPage: page,
          pageSize: pageSize,
        },
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno en el Servidor",
        },
      };
    }
  };
}
