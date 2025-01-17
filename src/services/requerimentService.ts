import { RequerimentI } from "../interfaces/requeriment.interface";
import { SortOrder } from "mongoose";
import ProductModel from "../models/productModel";
import Joi from "joi";
import axios from "axios";
import { OfferService } from "./offerService";
import { OfferModel } from "../models/offerModel";
import { PurchaseOrderService } from "./purchaseOrderService";
import Fuse from "fuse.js";
import { PipelineStage } from "mongoose";
import {
  OfferState,
  OrderType,
  PurchaseOrderState,
  RequirementState,
} from "../utils/Types";
import PurchaseOrderModel from "../models/purchaseOrder";
import { number } from "joi";
import mongoose from "mongoose";
import { TypeUser, TypeEntity } from "../utils/Types";
import { profile } from "node:console";
import { countries } from "../utils/Countries";
import { RequerimentFrontI } from "./../middlewares/requeriment.front.Interface";

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

      await this.manageCount(entityID, userID, "numProducts");

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
  ////////////////////////FALTA PROBAR AQUI
  static manageCount = async (
    entityID: string,
    userID: string,
    field: string
  ) => {
    const ResourceCountersCollection =
      mongoose.connection.collection("resourcecounters");

    const UserMasterCollection = mongoose.connection.collection("usermasters");
    const CompanyModel = mongoose.connection.collection("companys");

    try {
      const CompanyData = await CompanyModel.findOne({ uid: userID });

      let typeEntity;
      const userMasterData = await UserMasterCollection.findOne({
        role: TypeEntity.MASTER,
      });

      if (entityID !== userID) {
        typeEntity = TypeEntity.COMPANY;

        // Crear o actualizar el contador del campo (por ejemplo, numProducts) para el usuario (subusuario)
        await ResourceCountersCollection.updateOne(
          { uid: userID, typeEntity: TypeEntity.SUBUSER },
          { $inc: { [field]: 1 }, $set: { updateDate: new Date() } }, // Usar el campo dinámico pasado como parámetro
          { upsert: true } // No usamos 'new' ni 'setDefaultsOnInsert' aquí
        );
        // Crear o actualizar el contador del campo para la compañía
        await ResourceCountersCollection.updateOne(
          { uid: entityID, typeEntity: TypeEntity.COMPANY },
          { $inc: { [field]: 1 }, $set: { updateDate: new Date() } }, // Usar el campo dinámico pasado como parámetro
          { upsert: true } // No usamos 'new' ni 'setDefaultsOnInsert' aquí
        );
      } else if (CompanyData) {
        typeEntity = TypeEntity.COMPANY;
        // Crear o actualizar el contador del campo para la compañía
        await ResourceCountersCollection.updateOne(
          { uid: entityID, typeEntity: TypeEntity.COMPANY },
          { $inc: { [field]: 1 }, $set: { updateDate: new Date() } }, // Usar el campo dinámico pasado como parámetro
          { upsert: true } // No usamos 'new' ni 'setDefaultsOnInsert' aquí
        );
      } else {
        typeEntity = TypeEntity.USER;

        // Crear o actualizar el contador del campo para el usuario
        await ResourceCountersCollection.updateOne(
          { uid: entityID, typeEntity: TypeEntity.USER },
          { $inc: { [field]: 1 }, $set: { updateDate: new Date() } }, // Usar el campo dinámico pasado como parámetro
          { upsert: true } // No usamos 'new' ni 'setDefaultsOnInsert' aquí
        );
      }

      await ResourceCountersCollection.updateOne(
        { uid: userMasterData?.uid, typeEntity: TypeEntity.MASTER },
        { $inc: { [field]: 1 }, $set: { updateDate: new Date() } }, // Usar el campo dinámico pasado como parámetro
        { upsert: true } // No usamos 'new' ni 'setDefaultsOnInsert' aquí
      );
    } catch (error: any) {
      console.error("Error en manageCount:", error.message);
      return {
        success: false,
        error: error.message,
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
          $match: {
            // Filtrar documentos donde stateID = 1
            stateID: 1,
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
          $sort: {
            publish_date: -1, // Orden descendente (más reciente primero)
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
      const totalDocuments = await ProductModel.countDocuments({ stateID: 1 });

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

  static getRequerimentsByEntity = async (
    uid: string,
    page: number,
    pageSize: number,
    fieldName?: string,
    orderType?: OrderType
  ) => {
    try {
      if (!page || page < 1) page = 1; // Valor por defecto para la página
      if (!pageSize || pageSize < 1) pageSize = 10; // Valor por defecto para el tamaño de página

      if (!fieldName) {
        fieldName = "publish_date"; // Valor por defecto para el campo de ordenación
      }
      let order: SortOrder;
      if (!orderType || orderType === OrderType.DESC) {
        order = -1;
      } else {
        order = 1;
      }
      /*
      const pipeline = [
        // Buscar el requerimiento por su uid
        {
          $match: {
            entityID: uid,
            stateID: { $ne: 7 }, // Excluir documentos donde stateID = 7
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
      ];*/
      const pipeline = [
        // Buscar el requerimiento por su userID
        {
          $match: {
            entityID: uid,
            stateID: { $ne: 7 }, // Excluir documentos donde stateID = 7
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
        // Relacionar la colección 'OffersProducts' (ofertas) con la colección de requerimientos (Products)
        {
          $lookup: {
            from: "profiles", // Nombre de la colección de ofertas
            localField: "userID", // El campo en los requerimientos (Products) que relacionamos (winOffer.uid)
            foreignField: "uid", // El campo en las ofertas (Offers) con el que se relaciona (uid de la oferta)
            as: "profile", // El alias para la relación, esto almacenará la oferta ganadora relacionada
          },
        },
        // Opcionalmente, puedes agregar un paso $unwind si solo quieres una única oferta ganadora
        {
          $unwind: {
            path: "$profile", // Esto descompone el array de ofertas ganadoras
            preserveNullAndEmptyArrays: true, // Mantiene el documento aún si no hay oferta ganadora
          },
        },
        // Relacionar la colección 'OffersProducts' (ofertas) con la colección de requerimientos (Products)
        {
          $lookup: {
            from: "companys", // Nombre de la colección de ofertas
            localField: "userID", // El campo en los requerimientos (Products) que relacionamos (winOffer.uid)
            foreignField: "uid", // El campo en las ofertas (Offers) con el que se relaciona (uid de la oferta)
            as: "company", // El alias para la relación, esto almacenará la oferta ganadora relacionada
          },
        },
        // Opcionalmente, puedes agregar un paso $unwind si solo quieres una única oferta ganadora
        {
          $unwind: {
            path: "$company", // Esto descompone el array de ofertas ganadoras
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
            userName: { $ifNull: ["$profile.name", "$company.name"] },
          },
        },
      ];

      const result = await ProductModel.aggregate([
        ...pipeline,
        {
          $sort: {
            [fieldName]: order, // Orden descendente (más reciente primero)
          },
        },
        {
          $skip: (page - 1) * pageSize, // Saltar documentos según la página
        },
        {
          $limit: pageSize, // Limitar a la cantidad de documentos por página
        },
      ]).collation({ locale: "en", strength: 2 });
      // Asociar la ciudad al resultado
      const resultWithCities = result.map((item) => {
        // Buscar el país que contiene la ciudad con el cityID
        const country = countries.find((country) =>
          country.cities.some((city) => city.id === item.cityID)
        );

        // Si se encuentra el país, buscar la ciudad
        if (country) {
          const city = country.cities.find((city) => city.id === item.cityID);
          item.cityName = city ? city.value : null; // Agregar el nombre de la ciudad
        } else {
          item.cityName = null;
        }

        return item;
      });

      let resultData;
      if (fieldName === "cityID") {
        // Ordenamos el arreglo según 'cityName' basado en el valor de `order`
        resultData = resultWithCities.sort((a, b) => {
          // Normalizamos las cadenas para asegurarnos de que las comparaciones sean correctas
          const cityA =
            a.cityName?.normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ""; // Normaliza y elimina tildes
          const cityB =
            b.cityName?.normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ""; // Normaliza y elimina tildes

          // Compara las ciudades con `localeCompare` para tratar los acentos correctamente
          const comparison = cityA.localeCompare(cityB);

          // Si `order` es 1 (ascendente), utilizamos la comparación tal cual, si es -1 (descendente) la invertimos
          return order === 1 ? comparison : -comparison;
        });
      } else {
        resultData = resultWithCities;
      }

      //  console.log(sortedResult);

      // Obtener el número total de documentos (sin paginación)
      const totalData = await ProductModel.aggregate(pipeline);
      const totalDocuments = totalData.length;
      return {
        success: true,
        code: 200,
        data: resultWithCities,
        res: {
          totalDocuments,
          totalPages: Math.ceil(totalDocuments / pageSize),
          currentPage: page,
          pageSize,
        },
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

  static getRequerimentsbySubUser = async (
    uid: string,
    page: number,
    pageSize: number,
    fieldName?: string,
    orderType?: number
  ) => {
    try {
      if (!page || page < 1) page = 1; // Valor por defecto para la página
      if (!pageSize || pageSize < 1) pageSize = 10; // Valor por defecto para el tamaño de página

      if (!fieldName) {
        fieldName = "publish_date"; // Valor por defecto para el campo de ordenación
      }
      let order: SortOrder;
      if (!orderType || orderType === OrderType.DESC) {
        order = -1;
      } else {
        order = 1;
      }

      const pipeline = [
        // Buscar el requerimiento por su userid
        {
          $match: {
            userID: uid,
            stateID: { $ne: 7 }, // Excluir documentos donde stateID = 7
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
      ];

      const result = await ProductModel.aggregate([
        ...pipeline,
        {
          $sort: {
            [fieldName]: order, // Orden descendente (más reciente primero)
          },
        },
        {
          $skip: (page - 1) * pageSize, // Saltar documentos según la página
        },
        {
          $limit: pageSize, // Limitar a la cantidad de documentos por página
        },
      ]).collation({ locale: "en", strength: 2 });

      const resultWithCities = result.map((item) => {
        // Buscar el país que contiene la ciudad con el cityID
        const country = countries.find((country) =>
          country.cities.some((city) => city.id === item.cityID)
        );

        // Si se encuentra el país, buscar la ciudad
        if (country) {
          const city = country.cities.find((city) => city.id === item.cityID);
          item.cityName = city ? city.value : null; // Agregar el nombre de la ciudad
        } else {
          item.cityName = null;
        }

        return item;
      });

      let resultData;
      if (fieldName === "cityID") {
        // Ordenamos el arreglo según 'cityName' basado en el valor de `order`
        resultData = resultWithCities.sort((a, b) => {
          // Normalizamos las cadenas para asegurarnos de que las comparaciones sean correctas
          const cityA =
            a.cityName?.normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ""; // Normaliza y elimina tildes
          const cityB =
            b.cityName?.normalize("NFD").replace(/[\u0300-\u036f]/g, "") || ""; // Normaliza y elimina tildes

          // Compara las ciudades con `localeCompare` para tratar los acentos correctamente
          const comparison = cityA.localeCompare(cityB);

          // Si `order` es 1 (ascendente), utilizamos la comparación tal cual, si es -1 (descendente) la invertimos
          return order === 1 ? comparison : -comparison;
        });
      } else {
        resultData = resultWithCities;
      }
      // Obtener el número total de documentos (sin paginación)
      const totalData = await ProductModel.aggregate(pipeline);
      const totalDocuments = totalData.length;

      return {
        success: true,
        code: 200,
        data: resultData,
        res: {
          totalDocuments,
          totalPages: Math.ceil(totalDocuments / pageSize),
          currentPage: page,
          pageSize,
        },
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
      await ProductModel.updateMany(
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

  static searchMainFilters = async (
    keyWords?: string,
    location?: number,
    category?: number,
    startDate?: string,
    endDate?: string,
    companyId?: string,
    page?: number,
    pageSize?: number
  ) => {
    page = !page || page < 1 ? 1 : page;
    pageSize = !pageSize || pageSize < 1 ? 10 : pageSize;
    let total = 0;
    try {
      if (!keyWords) {
        keyWords = "";
      }
      const searchConditions: any = {
        $or: [
          { name: { $regex: keyWords, $options: "i" } },
          { description: { $regex: keyWords, $options: "i" } },
        ],
      };

      // Definimos la proyección para excluir campos específicos
      const projection = {
        _id: 1,
        createdAt: 0, // Excluir el campo 'createdAt'
        updatedAt: 0, // Excluir el campo 'updatedAt'
        payment_methodID: 0, // Excluir el campo 'payment_methodID'
        submission_dateID: 0,
        allowed_bidersID: 0,
      };

      if (location) {
        searchConditions.cityID = location;
      }
      if (category) {
        searchConditions.categoryID = category;
      }
      if (companyId) {
        searchConditions.entityID = companyId;
      }

      if (startDate) {
        searchConditions.publish_date = {
          ...searchConditions.publish_date,
          $gte: new Date(startDate),
        };
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setUTCHours(23, 59, 59, 999); // Ajustar a las 23:59:59.999 en UTC
        searchConditions.publish_date = {
          ...searchConditions.publish_date,
          $lte: end,
        };
      }

      // Primero intentamos hacer la búsqueda en MongoDB
      const skip = (page - 1) * pageSize;

      let results = await ProductModel.find(searchConditions, projection)
        .skip(skip)
        .limit(pageSize)
        .sort({ publish_date: -1 });

      // Si no hay resultados en MongoDB, usamos Fuse.js para hacer una búsqueda difusa
      if (keyWords && results.length === 0) {
        // Eliminar el filtro de keyWords del searchConditions para obtener todos los registros
        const searchConditionsWithoutKeyWords = { ...searchConditions };
        delete searchConditionsWithoutKeyWords.$or; // Quitamos la condición que filtra por palabras clave

        // Obtener todos los registros sin aplicar el filtro de palabras clave
        const allResults = await ProductModel.find(
          searchConditionsWithoutKeyWords,
          projection
        );

        // Configurar Fuse.js
        const fuse = new Fuse(allResults, {
          keys: ["name", "description"], // Las claves por las que buscar (name y description)
          threshold: 0.4, // Define qué tan "difusa" puede ser la coincidencia (0 es exacto, 1 es muy permisivo)
        });

        // Buscar usando Fuse.js
        results = fuse.search(keyWords).map((result) => result.item);

        // Ordenar los resultados obtenidos de Fuse.js por publish_date en orden descendente
        results.sort((a, b) => {
          return b.publish_date.getTime() - a.publish_date.getTime(); // Convertimos las fechas a timestamps
        });
        // Total de resultados (count usando Fuse.js)
        total = results.length;

        // Aplicar paginación sobre los resultados ordenados de Fuse.js
        const start = (page - 1) * pageSize;
        results = results.slice(start, start + pageSize);
      } else {
        // Si encontramos resultados en MongoDB, el total es la cantidad de documentos encontrados
        total = await ProductModel.countDocuments(searchConditions);
      }

      return {
        success: true,
        code: 200,
        data: results,
        res: {
          totalDocuments: total,
          totalPages: Math.ceil(total / pageSize),
          currentPage: page,
          pageSize,
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

  static searchProductsByUser = async (
    keyWords: string,
    userId: string,
    typeUser?: TypeEntity,
    page?: number,
    pageSize?: number,
    fieldName?: string,
    orderType?: OrderType
  ) => {
    page = !page || page < 1 ? 1 : page;
    pageSize = !pageSize || pageSize < 1 ? 10 : pageSize;
    let total = 0;
    try {
      if (!keyWords) {
        keyWords = "";
      }

      if (!fieldName) {
        fieldName = "publish_date";
      }
      let userType, userName, subUserName;
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
        // Filtro inicial (searchConditions)
        {
          $match: {
            $and: [
              { [userType]: userId },
              { stateID: { $ne: RequirementState.ELIMINATED } },
              { $or: [{ name: { $regex: keyWords, $options: "i" } }] },
            ],
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

        // Proyección de los campos que queremos devolver
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
            subUserName: { $ifNull: ["$profile.name", "$company.name"] },
            userName: { $ifNull: ["$company.name", "$profile.name"] },
          },
        },
      ];

      // Primero intentamos hacer la búsqueda en MongoDB
      const skip = (page - 1) * pageSize;
      let results = await ProductModel.aggregate(pipeline)
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

        // Ejecutar el pipeline sin el filtro de palabras clave
        const allResults = await ProductModel.aggregate(
          pipelineWithoutKeyWords
        );

        // Configurar Fuse.js para la búsqueda difusa
        const fuse = new Fuse(allResults, {
          keys: ["name", subUserName], // Claves por las que buscar
          threshold: 0.4, // Define qué tan "difusa" es la coincidencia
        });

        // Buscar usando Fuse.js
        results = fuse.search(keyWords).map((result) => result.item);

        // Asegurar que fieldName tenga un valor predeterminado antes de ser usado
        const sortField = fieldName ?? "publish_date"; // Si fieldName es undefined, usar "publish_date"

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
        const resultData = await ProductModel.aggregate(pipeline);
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
