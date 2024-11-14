import axios from "axios";
import { OfferI } from "../interfaces/offer.interface";
import { OfferModel } from "../models/offerModel";
import { RequerimentService } from "./requerimentService";
import ProductModel from "../models/productModel";
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
        subUserEmail = resultData.data.data[0]?.auth_users?.email;
      }

      if (entityID === (await result).data?.[0].entityID) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "No puedes ofertar a tu propio requerimiento",
          },
        };
      }

      const newOffer = new OfferModel({
        name,
        email,
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

      const resultOffer = this.GetOfferByUser(requerimentID, userID);
      if ((await resultOffer).code === 200) {
        return {
          success: false,
          code: 409,
          error: {
            msg: "Ya haz realizado una oferta a este requerimiento",
          },
        };
      } else {
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

        return {
          success: true,
          code: 200,
          data: newOffer,
          res: {
            msg: "Se ha creado correctamente la Oferta",
          },
        };
      }
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
            canceledByCreator: 1,
            requerimentTitle: {
              $arrayElemAt: ["$requerimentDetails.name", 0],
            }, // Extrae el campo 'name' del primer requerimiento encontrado
          },
        },
      ]);

      if (detailOffer) {
        return {
          success: true,
          code: 200,
          data: detailOffer,
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

  static GetOffers = async () => {
    try {
      const result = await OfferModel.aggregate([
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
            canceledByCreator: 1,

            // Extrae el campo 'name' de `ProductModel` (en `requerimentDetails`) como `requerimentTitle`
            requerimentTitle: {
              $arrayElemAt: ["$requerimentDetails.name", 0],
            },
          },
        },
      ]);
      if (result) {
        return {
          success: true,
          code: 200,
          data: result,
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

  static getOffersByRequeriment = async (requerimentID: string) => {
    try {
      const result = await OfferModel.find({ requerimentID });

      return {
        success: true,
        code: 200,
        data: result,
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

  static getOffersByEntity = async (uid: string) => {
    try {
      const result = await OfferModel.find({ entityID: uid });
      return {
        success: true,
        code: 200,
        data: result,
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

  static getOffersBySubUser = async (uid: string) => {
    try {
      const result = await OfferModel.find({ userID: uid });
      return {
        success: true,
        code: 200,
        data: result,
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
      console.log(userBase.data.data?.[0]);
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
}
