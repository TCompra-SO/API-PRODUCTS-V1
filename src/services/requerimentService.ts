import { RequerimentI } from "../interfaces/requeriment.interface";
import ProductModel from "../models/productModel";
import Joi from "joi";
import axios from "axios";
import { OfferService } from "./offerService";
import { OfferModel } from "../models/offerModel";
export class RequerimentService {
  static CreateRequeriment = async (data: RequerimentI) => {
    const {
      name,
      description,
      categoryID,
      cityID,
      budget,
      currencyID,
      payment_methodID,
      completion_date,
      submission_dateID,
      warranty,
      durationID,
      allowed_bidersID,
      userID,
    } = data;
    try {
      let entityID = "";
      const API_USER = process.env.API_USER;
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

      const newRequeriment = new ProductModel({
        name,
        description,
        categoryID,
        cityID,
        budget,
        currencyID,
        payment_methodID,
        completion_date,
        submission_dateID,
        warranty,
        durationID,
        allowed_bidersID,
        userID,
        entityID,
        publish_date: new Date(),
        number_offers: 0,
        stateID: 1,
      });
      const savedRequeriment = await newRequeriment.save();
      if (!savedRequeriment) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "Se ha producido un error al crear el Requerimiento",
          },
        };
      }
      return {
        success: true,
        code: 200,
        res: {
          msg: "Se ha creado correctamente el requerimiento",
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

  static getRequeriments = async () => {
    try {
      const requeriments = await ProductModel.find();
      if (!requeriments) {
        return {
          success: false,
          code: 403,
          res: {
            msg: "Ha ocurrido un error al listar los Requerimientos",
          },
        };
      }

      return {
        success: true,
        code: 200,
        data: requeriments,
      };
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

  static getRequerimentById = async (uid: string) => {
    try {
      const requeriment = await ProductModel.findOne({ uid });
      if (!requeriment) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "No se ha encontrado el requerimiento con el ID proporcionado",
          },
        };
      }

      return {
        success: true,
        code: 200,
        data: requeriment,
      };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno en el Servidor",
        },
      };
    }
  };

  static updateRequeriment = async (
    uid: string,
    data: Partial<RequerimentI>
  ) => {
    try {
      // Buscar y actualizar el requerimiento por su UID
      const updatedRequeriment = await ProductModel.findOneAndUpdate(
        { uid }, // Usar un objeto de consulta para buscar por uid
        {
          // Solo se actualizarán los campos que están definidos en `data`
          ...data,
          updated_at: new Date(), // Fecha de actualización
        },
        { new: true } // Retorna el documento actualizado
      );

      // Si no se encuentra el requerimiento o no se puede actualizar
      if (!updatedRequeriment) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "No se ha encontrado el requerimiento",
          },
        };
      }

      // Si la actualización fue exitosa
      return {
        success: true,
        code: 200,
        res: {
          msg: "El requerimiento ha sido actualizado correctamente",
          data: updatedRequeriment,
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

  static selectOffer = async (
    requerimentID: string,
    offerID: string,
    observation: string
  ) => {
    try {
      const requerimentData =
        RequerimentService.getRequerimentById(requerimentID);
      const stateID = (await requerimentData).data?.stateID;
      if (!(await requerimentData).success) {
        return {
          success: false,
          code: 408,
          error: {
            msg: "El requerimiento seleccionado no existe",
          },
        };
      }
      switch (stateID) {
        case 1:
          const offerData = OfferService.GetDetailOffer(offerID);
          if ((await offerData).success) {
            const updatedProduct = await ProductModel.findOneAndUpdate(
              { uid: requerimentID },
              {
                $set: {
                  winOffer: { uid: offerID, observation },
                  stateID: 2,
                },
              },
              { new: true } // Devolver el documento actualizado
            );

            if (!updatedProduct) {
              return {
                success: false,
                code: 400,
                error: {
                  msg: "No se encontró el Requerimiento",
                },
              };
            }

            const updatedOffer = await OfferModel.findOneAndUpdate(
              { uid: offerID },
              {
                $set: {
                  stateID: 2,
                },
              },
              { new: true }
            );
            if (!updatedOffer) {
              return {
                success: false,
                code: 401,
                error: {
                  msg: "No se encontró la oferta",
                },
              };
            }

            return {
              success: true,
              code: 200,
              data: updatedProduct,
              res: {
                msg: "La oferta ganadora ha sido seleccionada y guardada exitosamente",
              },
            };
          } else {
            return {
              success: false,
              code: 403,
              error: {
                msg: "No se ha encontrado la Oferta",
              },
            };
          }

        case 2:
          return {
            success: false,
            code: 404,
            error: {
              msg: "El requerimiento se encuentra Atendido",
            },
          };

        default:
          return {
            success: false,
            code: 405,
            error: {
              msg: "El estado del Requerimiento no permite seleccionar mas Ofertas",
            },
          };
      }
    } catch (error) {
      console.error("Error al seleccionar la oferta:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno del servidor",
        },
      };
    }
  };

  static expired = async () => {
    console.log(new Date());
    try {
      const result = await ProductModel.updateMany(
        { completion_date: { $lt: new Date() } }, // Filtra solo los documentos que cumplen la condición
        { $set: { stateID: 5 } } // Actualiza el campo `stateID`
      );
      console.log(result);
      return {
        success: true,
        code: 200,
        res: {
          msg: "Se han actualizado los productos expirados",
        },
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno del servidor",
        },
      };
    }
  };
}
