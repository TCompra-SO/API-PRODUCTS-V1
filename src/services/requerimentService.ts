import { RequerimentI } from "../interfaces/requeriment.interface";
import ProductModel from "../models/productModel";
import Joi from "joi";
import axios from "axios";
import { OfferService } from "./offerService";
import { OfferModel } from "../models/offerModel";
import { PurchaseOrderService } from "./purchaseOrderService";
import { Console, error } from "console";
import {
  OfferState,
  PurchaseOrderState,
  RequirementState,
} from "../utils/Types";
import PurchaseOrderModel from "../models/purchaseOrder";

let API_USER = process.env.API_USER;
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
      let email = "";
      const API_USER = process.env.API_USER;
      const resultData = await axios.get(
        `${API_USER}auth/getBaseDataUser/${userID}`
      );

      let subUserEmail = "";
      let subUserName = "";
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
        email = resultData.data.data[0]?.email;
        subUserEmail = resultData.data.data[0]?.auth_users?.email;
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
        subUserEmail,
        entityID,
        email,
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
        data: newRequeriment,
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

  static getRequeriments = async (page: number, pageSize: number) => {
    try {
      const requeriments = await ProductModel.aggregate([
        {
          $lookup: {
            from: "offersproducts", // Nombre de la colección de las ofertas, ajusta según tu modelo
            localField: "winOffer.uid", // Campo de la colección de requerimientos
            foreignField: "uid", // Campo de la colección de ofertas
            as: "winOffer", // Alias para los resultados relacionados
          },
        },
        {
          $unwind: {
            // Si hay más de un resultado, los aplanamos
            path: "$winOffer",
            preserveNullAndEmptyArrays: true, // Para mantener los requerimientos sin una oferta ganadora
          },
        },
        {
          $project: {
            // Proyectamos los campos que queremos mostrar
            uid: 1,
            name: 1,
            description: 1,
            categoryID: 1,
            cityID: 1,
            budget: 1,
            currencyID: 1,
            payment_methodID: 1,
            completion_date: 1,
            submission_dateID: 1,
            warranty: 1,
            durationID: 1,
            allowed_bidersID: 1,
            entityID: 1,
            userID: 1,
            email: 1,
            subUserEmail: 1,
            publish_date: 1,
            stateID: 1,
            number_offers: 1,
            images: 1,
            files: 1,
            winOffer: {
              uid: 1,
              userID: 1,
              entityID: 1,
            },
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
      const totalDocuments = await ProductModel.countDocuments();

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
        res: {
          totalDocuments,
          totalPages: Math.ceil(totalDocuments / pageSize),
          currentPage: page,
          pageSize,
        },
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
      const requeriment = await ProductModel.aggregate([
        // Buscar el requerimiento por su uid
        {
          $match: {
            uid: uid,
          },
        },
        // Relacionar la colección 'OffersProducts' (ofertas) con la colección de requerimientos (Products)
        {
          $lookup: {
            from: "offersproducts", // Nombre de la colección de ofertas
            localField: "winOffer.uid", // El campo en los requerimientos (Products) que relacionamos (winOffer.uid)
            foreignField: "uid", // El campo en las ofertas (Offers) con el que se relaciona (uid de la oferta)
            as: "winOffer", // El alias para la relación, esto almacenará la oferta ganadora relacionada
          },
        },
        // Opcionalmente, puedes agregar un paso $unwind si solo quieres una única oferta ganadora
        {
          $unwind: {
            path: "$winOffer", // Esto descompone el array de ofertas ganadoras
            preserveNullAndEmptyArrays: true, // Mantiene el documento aún si no hay oferta ganadora
          },
        },
        // Proyección de los campos que deseas devolver (todos los campos del requerimiento)
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            categoryID: 1,
            cityID: 1,
            budget: 1,
            currencyID: 1,
            payment_methodID: 1,
            completion_date: 1,
            submission_dateID: 1,
            warranty: 1,
            durationID: 1,
            allowed_bidersID: 1,
            entityID: 1,
            subUserEmail: 1,
            userID: 1,
            email: 1,
            publish_date: 1,
            stateID: 1,
            uid: 1,
            createdAt: 1,
            updatedAt: 1,
            number_offers: 1,
            images: 1,
            files: 1,
            winOffer: {
              uid: 1,
              userID: 1,
              entityID: 1,
            }, // Aquí incluimos todos los campos de la oferta ganadora
          },
        },
      ]);
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

  static getRequerimentsByEntity = async (uid: string) => {
    try {
      const result = await ProductModel.aggregate([
        // Buscar el requerimiento por su uid
        {
          $match: {
            entityID: uid,
          },
        },
        // Relacionar la colección 'OffersProducts' (ofertas) con la colección de requerimientos (Products)
        {
          $lookup: {
            from: "offersproducts", // Nombre de la colección de ofertas
            localField: "winOffer.uid", // El campo en los requerimientos (Products) que relacionamos (winOffer.uid)
            foreignField: "uid", // El campo en las ofertas (Offers) con el que se relaciona (uid de la oferta)
            as: "winOffer", // El alias para la relación, esto almacenará la oferta ganadora relacionada
          },
        },
        // Opcionalmente, puedes agregar un paso $unwind si solo quieres una única oferta ganadora
        {
          $unwind: {
            path: "$winOffer", // Esto descompone el array de ofertas ganadoras
            preserveNullAndEmptyArrays: true, // Mantiene el documento aún si no hay oferta ganadora
          },
        },
        // Proyección de los campos que deseas devolver (todos los campos del requerimiento)
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            categoryID: 1,
            cityID: 1,
            budget: 1,
            currencyID: 1,
            payment_methodID: 1,
            completion_date: 1,
            submission_dateID: 1,
            warranty: 1,
            duration: 1,
            allowed_bidersID: 1,
            entityID: 1,
            subUserEmail: 1,
            userID: 1,
            email: 1,
            publish_date: 1,
            stateID: 1,
            uid: 1,
            createdAt: 1,
            updatedAt: 1,
            number_offers: 1,
            images: 1,
            files: 1,
            winOffer: {
              uid: 1,
              userID: 1,
              entityID: 1,
            }, // Aquí incluimos todos los campos de la oferta ganadora
          },
        },
      ]);
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
        error: { msg: "Error interno en el Servidor" },
      };
    }
  };

  static getRequerimentsbySubUser = async (uid: string) => {
    try {
      const result = await ProductModel.aggregate([
        // Buscar el requerimiento por su userid
        {
          $match: {
            userID: uid,
          },
        },
        // Relacionar la colección 'OffersProducts' (ofertas) con la colección de requerimientos (Products)
        {
          $lookup: {
            from: "offersproducts", // Nombre de la colección de ofertas
            localField: "winOffer.uid", // El campo en los requerimientos (Products) que relacionamos (winOffer.uid)
            foreignField: "uid", // El campo en las ofertas (Offers) con el que se relaciona (uid de la oferta)
            as: "winOffer", // El alias para la relación, esto almacenará la oferta ganadora relacionada
          },
        },
        // Opcionalmente, puedes agregar un paso $unwind si solo quieres una única oferta ganadora
        {
          $unwind: {
            path: "$winOffer", // Esto descompone el array de ofertas ganadoras
            preserveNullAndEmptyArrays: true, // Mantiene el documento aún si no hay oferta ganadora
          },
        },
        // Proyección de los campos que deseas devolver (todos los campos del requerimiento)
        {
          $project: {
            _id: 1,
            name: 1,
            description: 1,
            categoryID: 1,
            cityID: 1,
            budget: 1,
            currencyID: 1,
            payment_methodID: 1,
            completion_date: 1,
            submission_dateID: 1,
            warranty: 1,
            duration: 1,
            allowed_bidersID: 1,
            entityID: 1,
            subUserEmail: 1,
            userID: 1,
            email: 1,
            publish_date: 1,
            stateID: 1,
            uid: 1,
            createdAt: 1,
            updatedAt: 1,
            number_offers: 1,
            images: 1,
            files: 1,
            winOffer: {
              uid: 1,
              userID: 1,
              entityID: 1,
            }, // Aquí incluimos todos los campos de la oferta ganadora
          },
        },
      ]);
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
        error: { msg: "Error interno en el Servidor" },
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
    observation: string,
    price_Filter: number,
    deliveryTime_Filter: number,
    location_Filter: number,
    warranty_Filter: number
  ) => {
    try {
      const requerimentData =
        RequerimentService.getRequerimentById(requerimentID);

      if (
        !(await requerimentData).success ||
        (await requerimentData).data?.length == 0
      ) {
        return {
          success: false,
          code: 400,
          error: {
            msg: "El requerimiento seleccionado no existe",
          },
        };
      }
      const stateID = (await requerimentData).data?.[0].stateID;
      switch (stateID) {
        case 1:
          const offerData = OfferService.GetDetailOffer(offerID);
          const stateOffer = (await offerData).data?.[0].stateID;

          if (stateOffer !== 1) {
            return {
              success: false,
              code: 401,
              error: {
                msg: "El estado de la Oferta no permite ser seleccionada",
              },
            };
          }
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
                code: 403,
                error: {
                  msg: "No se encontró el Requerimiento",
                },
              };
            }

            const purchaseOrder =
              await PurchaseOrderService.CreatePurchaseOrder(
                requerimentID,
                offerID,
                price_Filter,
                deliveryTime_Filter,
                location_Filter,
                warranty_Filter
              );

            if (!purchaseOrder.success) {
              await ProductModel.findOneAndUpdate(
                { uid: requerimentID },
                {
                  $set: {
                    winOffer: "",
                    stateID: 1,
                  },
                },
                { new: true } // Devolver el documento actualizado
              );
              return {
                success: false,
                code: 409,
                error: {
                  msg: purchaseOrder.error,
                },
              };
            }

            const updatedOffer = await OfferModel.findOneAndUpdate(
              { uid: offerID },
              {
                $set: {
                  stateID: 2,
                  selectionDate: new Date(),
                },
              },
              { new: true }
            );
            if (!updatedOffer) {
              return {
                success: false,
                code: 403,
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

        default:
          let stateLabel;

          switch (stateID) {
            case 2:
              stateLabel = "Atendido";
              break;
            case 3:
              stateLabel = "Culminado";
              break;
            case 5:
              stateLabel = "Expirado";
              break;
            case 6:
              stateLabel = "Cancelado";
              break;
            case 7:
              stateLabel = "Eliminado";
              break;
            case 8:
              stateLabel = "En Disputa";
              break;
          }

          return {
            success: false,
            code: 405,
            error: {
              msg: "El Requerimiento se encuentra " + stateLabel,
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

  static BasicRateData = async (requerimentID: string) => {
    try {
      const result = await ProductModel.aggregate([
        {
          // Match para encontrar el producto con el requerimentID
          $match: { uid: requerimentID },
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

      result[0].userImage = userBase.data.data?.[0].image;
      if (result[0].userId === result[0].subUserId) {
        result[0].userName = userBase.data.data?.[0].name;
        result[0].subUserName = userBase.data.data?.[0].name;
      } else {
        result[0].userName = userBase.data.data?.[0].name;
        result[0].subUserName = userBase.data.data?.[0].auth_users?.name;
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

  static expired = async () => {
    try {
      const result = await ProductModel.updateMany(
        { completion_date: { $lt: new Date() }, stateID: 1 }, // Filtra solo los documentos que cumplen la condición
        { $set: { stateID: 5 } } // Actualiza el campo `stateID`
      );

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

  static delete = async (requirementID: string) => {
    try {
      const requirementData = await ProductModel.findOne({
        uid: requirementID,
        stateID: {
          $in: [
            RequirementState.CANCELED,
            RequirementState.EXPIRED,
            RequirementState.PUBLISHED,
          ],
        }, // oferta seleccionada ya debe estar cancelada o no hay oferta seleccionada
      });

      if (requirementData) {
        if (
          requirementData.stateID != RequirementState.CANCELED ||
          (requirementData.stateID != RequirementState.CANCELED &&
            !requirementData.winOffer) // no hay oferta seleccionada cancelada
        ) {
          const offers = await OfferService.getOffersByRequeriment(
            requirementID
          );
          if (offers.success && offers.data && offers.data.length > 0) {
            // eliminar todas las ofertas del requerimiento
            await Promise.all(
              offers.data.map(async (offer) => {
                await OfferService.deleteOffer(offer.uid);
              })
            );
          }
        }

        await ProductModel.findOneAndUpdate(
          { uid: requirementID },
          {
            $set: {
              stateID: RequirementState.ELIMINATED,
            },
          },
          { new: true }
        );

        return {
          success: true,
          code: 200,
          data: requirementID,
          res: {
            msg: "Se ha eliminado el requerimiento",
          },
        };
      } else
        return {
          success: false,
          code: 404,
          error: {
            msg: "Requerimiento no encontrado o estado no permite eliminar",
          },
        };
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

  static republish = async (requirementID: string, completionDate: string) => {
    try {
      const requirementData = await ProductModel.findOne({
        uid: requirementID,
      });

      if (requirementData) {
        if (
          requirementData.stateID == RequirementState.CANCELED ||
          requirementData.stateID == RequirementState.EXPIRED
        ) {
          const offers = await OfferService.getOffersByRequeriment(
            requirementID
          );
          if (offers.success && offers.data && offers.data.length > 0) {
            // eliminar todas las ofertas del requerimiento
            await Promise.all(
              offers.data.map(async (offer) => {
                await OfferService.updateStateOffer(
                  offer.uid,
                  OfferState.ACTIVE
                );
              })
            );
          }

          const updatedRequirement = await ProductModel.findOneAndUpdate(
            { uid: requirementID },
            {
              $set: {
                stateID: RequirementState.PUBLISHED,
                publish_date: new Date(),
                completion_date: completionDate,
              },
            },
            { new: true }
          );

          return {
            success: true,
            code: 200,
            data: updatedRequirement,
            res: {
              msg: "Se ha republicado el requerimiento",
            },
          };
        } else {
          return {
            success: false,
            code: 400,
            error: {
              msg: "Estado de requerimiento no permite republicar",
            },
          };
        }
      } else
        return {
          success: false,
          code: 404,
          error: {
            msg: "Requerimiento no encontrado",
          },
        };
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

  static culminate = async (
    requerimentID: string,
    delivered: boolean,
    score: number,
    comments?: string
  ) => {
    try {
      const requerimentData = await ProductModel.findOne({
        uid: requerimentID,
      });
      if (!requerimentData) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "Requerimiento no encontrado",
          },
        };
      }

      if (requerimentData.stateID !== RequirementState.SELECTED) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "El estado del requerimiento no permite realizar esta acción",
          },
        };
      }

      const offerID = requerimentData.winOffer.uid;

      const purchaseOrderData = await PurchaseOrderModel.aggregate([
        {
          $match: {
            requerimentID: requerimentID, // Sustituye por el valor real
            offerID: offerID, // Sustituye por el valor real
          },
        },
      ]);

      const requestBody = {
        typeScore: "Provider", // Tipo de puntaje
        uidEntity: purchaseOrderData?.[0].userProviderID, // ID de la empresa a ser evaluada
        uidUser: purchaseOrderData?.[0].userClientID, // ID del usuario que evalua
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

      // AQUI USAR LA FUNCION EN DISPUTA //
      if (
        purchaseOrderData?.[0].scoreState?.scoreProvider &&
        purchaseOrderData?.[0].scoreState?.deliveredProvider !== delivered
      ) {
        this.inDispute(purchaseOrderData?.[0].uid, PurchaseOrderModel);
        this.inDispute(requerimentID, ProductModel);
        this.inDispute(offerID, OfferModel);

        return {
          success: true,
          code: 200,
          res: {
            msg: "El proveedor ha reportado una discrepancia, por lo que el estado del proceso se ha marcado como EN DISPUTA.",
          },
        };
      } else {
        if (
          purchaseOrderData?.[0].scoreState?.scoreProvider &&
          purchaseOrderData?.[0].scoreState?.deliveredProvider === delivered
        ) {
          await PurchaseOrderModel.updateOne(
            {
              requerimentID: requerimentID,
              offerID: offerID,
            },
            {
              $set: {
                "scoreState.scoreClient": true,
                "scoreState.deliveredClient": delivered,
                stateID: PurchaseOrderState.FINISHED,
              },
            }
          );
        } else {
          await PurchaseOrderModel.updateOne(
            {
              requerimentID: requerimentID,
              offerID: offerID,
            },
            {
              $set: {
                "scoreState.scoreClient": true,
                "scoreState.deliveredClient": delivered,
                stateID: PurchaseOrderState.PENDING,
              },
            }
          );
        }

        await ProductModel.updateOne(
          {
            uid: requerimentID,
          },
          {
            $set: {
              stateID: RequirementState.FINISHED,
            },
          }
        );

        return {
          success: true,
          code: 200,
          res: {
            msg: "Se ha culminado correctamente el Requerimiento",
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

  static canceled = async (uid: string, reason?: string) => {
    try {
      const resultData = await ProductModel.find({ uid: uid });
      if (resultData[0]?.stateID === RequirementState.CANCELED) {
        return {
          success: false,
          code: 401,
          error: {
            msg: "El Requerimiento ya se encuentra cancelado.",
          },
        };
      }
      if (resultData[0]?.stateID === RequirementState.SELECTED) {
        const OfferID = resultData[0]?.winOffer.uid;
        const offerData = (await OfferService.GetDetailOffer(OfferID)).data;
        const purchaseOrderData = await PurchaseOrderModel.find({
          requerimentID: uid, // Filtro por requerimentID
          offerID: OfferID, // Filtro por offerID
        });
        console.log(offerData);
        console.log("Estado oferta: " + offerData?.[0].stateID);
        if (purchaseOrderData[0].stateID === PurchaseOrderState.CANCELED) {
          await this.changeStateOffer(uid, OfferState.CANCELED, true);
          await this.changeStateID(
            ProductModel,
            uid,
            RequirementState.CANCELED
          );
          return {
            success: true,
            code: 200,
            error: {
              msg: "Se ha cancelado el Requerimiento exitosamente",
            },
          };
        } else if (
          purchaseOrderData[0].scoreState?.scoreProvider === true &&
          offerData?.[0].stateID === OfferState.FINISHED
        ) {
          return {
            success: false,
            code: 400,
            error: {
              msg: "No se puede cancelar el Requerimiento porque el creador de la Oferta ya ha culminado",
            },
          };
        } else {
          console.log("entramos");
          await PurchaseOrderModel.findOneAndUpdate(
            { uid: purchaseOrderData[0].uid }, // Filtro para buscar por uid
            {
              canceledByCreator: true,
              reasonCancellation: reason,
              cancellationDate: new Date(),
              stateID: PurchaseOrderState.CANCELED,
            }, // Campos a actualizar
            { new: true } // Devuelve el documento actualizado
          );
        }
        await this.changeStateOffer(uid, OfferState.CANCELED, true); // cancelo todas las Ofertas del requerimiento
        await this.changeStateID(OfferModel, OfferID, OfferState.CANCELED); // cancelo la oferta asociada
        await this.changeStateID(ProductModel, uid, RequirementState.CANCELED);

        return {
          success: true,
          code: 200,
          error: {
            msg: "Se ha cancelado el Requerimiento exitosamente",
          },
        };
      } else {
        await this.changeStateOffer(uid, OfferState.CANCELED, true);
        await this.changeStateID(ProductModel, uid, RequirementState.CANCELED);

        return {
          success: true,
          code: 200,
          error: {
            msg: "Se ha cancelado el Requerimiento exitosamente",
          },
        };
      }
    } catch (error) {
      console.error("Error en canceled", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno del servidor.",
        },
      };
    }
  };

  static changeStateID = async (
    ServiceModel: any,
    uid: string,
    stateID: number
  ) => {
    try {
      await ServiceModel.updateOne(
        { uid: uid },
        {
          $set: {
            stateID: stateID,
          },
        }
      );
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno del servidor.",
        },
      };
    }
  };

  static changeStateOffer = async (
    uid: string,
    stateID: number,
    canceledByCreator: boolean
  ) => {
    try {
      await OfferModel.updateMany(
        {
          requerimentID: uid,
          stateID: { $nin: [5, 7] },
        },
        {
          $set: {
            stateID: stateID,
            canceledByCreator: canceledByCreator,
          },
        }
      );
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

  static updateNumberOffersRequeriment = async (
    uid: string,
    increase: boolean
  ) => {
    try {
      // Buscar y actualizar el requerimiento por su UID
      const updatedRequeriment = await ProductModel.findOneAndUpdate(
        { uid }, // Usar un objeto de consulta para buscar por uid
        {
          $inc: { number_offers: increase ? +1 : -1 }, // Decrease numOffers by 1
          $max: { number_offers: 0 }, // Prevent numOffers from dropping below 0
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
}
