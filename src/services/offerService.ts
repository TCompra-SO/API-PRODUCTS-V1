import axios from "axios";
import { OfferI } from "../interfaces/offer.interface";
import { OfferModel } from "../models/offerModel";
import { RequerimentService } from "./requerimentService";

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
      const resultData = await axios.get(
        `${API_USER}/getBaseDataUser/${userID}`
      );
      if (resultData.data.success === false) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "No se ha podido encontrar la Entidad",
          },
        };
      } else {
        entityID = resultData.data.data[0]?.uid;
      }

      if (entityID === (await result).data?.entityID) {
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
              (await dataRequeriment).data?.number_offers ?? 0; // Si 'number_offers' es undefined, usa 0

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
          res: {
            msg: "Se ha creado correctamente la Oferta",
          },
        };
      }
    } catch (error) {
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
      const detailOffer = await OfferModel.findOne({ uid });
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
      const result = await OfferModel.find();
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
      console.error("Error al obtener productos:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Hubo un error al obtener los productos.",
        },
      };
    }
  };
}
