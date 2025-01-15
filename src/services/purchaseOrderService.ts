import axios from "axios";
import {
  PurchaseOrderI,
  PurchaseOrderState,
  TypeRequeriment,
} from "../interfaces/purchaseOrder.interface";
import PurchaseOrderModel from "../models/purchaseOrder";
import { OfferService } from "./offerService";
import { igv } from "../initConfig";
import { RequerimentService } from "./requerimentService";
import { sendEmailPurchaseOrder } from "../utils/NodeMailer";
import puppeteer from "puppeteer";
import { Buffer } from "node:buffer";
import { OrderPurchaseTemplate } from "../utils/OrderPurchaseTemplate";
import { OrderType, TypeEntity, TypeUser } from "../utils/Types";
import Fuse from "fuse.js";
import { PipelineStage, SortOrder } from "mongoose";

let API_USER = process.env.API_USER;
export class PurchaseOrderService {
  static CreatePurchaseOrder = async (
    requerimentID: string,
    offerID: string,
    price_Filter: number,
    deliveryTime_Filter: number,
    location_Filter: number,
    warranty_Filter: number
  ) => {
    try {
      const offerBasicData = OfferService.BasicRateData(offerID);
      const offerData = OfferService.GetDetailOffer(offerID);
      const userProviderID = (await offerBasicData).data?.[0].userId;
      const subUserProviderID = (await offerBasicData).data?.[0].subUserId;

      const requerimentBasicData =
        RequerimentService.BasicRateData(requerimentID);
      const requerimentData =
        RequerimentService.getRequerimentById(requerimentID);
      const userClientID = (await requerimentBasicData).data?.[0].userId;
      const subUserClientID = (await requerimentBasicData).data?.[0].subUserId;

      if (requerimentID !== (await offerData).data?.[0].requerimentID) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "La oferta seleccionada no pertenece a este requerimiento",
          },
        };
      }

      if ((await offerData).data?.[0].stateID !== 1) {
        return {
          success: false,
          code: 401,
          error: {
            msg: "La Oferta no puede ser seleccionada",
          },
        };
      }
      const userProviderData = await axios.get(
        `${API_USER}auth/getBaseDataUser/${subUserProviderID}`
      );

      const basicProviderData = await axios.get(
        `${API_USER}auth/getUser/${userProviderID}`
      );

      const baseClientData = await axios.get(
        `${API_USER}auth/getUser/${userClientID}`
      );

      const currencyData = await axios.get(`${API_USER}util/utilData/currency`);

      const currencyId = (await requerimentData).data?.[0].currencyID; // Cambia este valor al ID que deseas buscar
      const currencyValue = currencyData.data.currencies.find(
        (currency: { id: number; value: string; alias: string }) =>
          currency.id === currencyId
      )?.alias;

      const daysDeliveryData = await axios.get(
        `${API_USER}util/utilData/delivery_time`
      );

      const deliveryTimeID = (await offerData).data?.[0].deliveryTimeID;
      let days = 0;
      let deliveryDate;
      if (deliveryTimeID !== 6) {
        deliveryDate = new Date();
        days = daysDeliveryData.data.times.find(
          (days: { id: number; value: string; days: number }) =>
            days.id === deliveryTimeID
        )?.days;

        deliveryDate.setDate(deliveryDate.getDate() + days);
      } else {
        deliveryDate = null;
      }

      if (!(await offerBasicData).success) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "No se encontro la Oferta",
          },
        };
      }

      let price = (await offerData).data?.[0].budget;
      let subTotal = price;
      let total, totalIgv;
      if (!(await offerData).data?.[0].includesIGV) {
        totalIgv = ((await offerData).data?.[0].budget * igv) / 100;
        totalIgv = parseFloat(totalIgv.toFixed(2));
        total = subTotal + totalIgv;
      } else {
        subTotal = price / (1 + igv / 100);
        subTotal = parseFloat(subTotal.toFixed(2));
        totalIgv = parseFloat((price - subTotal).toFixed(2));
        total = price;
      }

      const newPurchaseOrder: Omit<PurchaseOrderI, "uid"> = {
        type: TypeRequeriment.PRODUCTS,
        userClientID: userClientID,
        userNameClient: (await requerimentBasicData).data?.[0].userName,
        addressClient: (await baseClientData).data.data?.address,
        documentClient: (await baseClientData).data.data?.document,
        emailClient: (await requerimentData).data?.[0].email,
        subUserClientID: subUserClientID,
        subUserClientEmail: (await requerimentData).data?.[0].subUserEmail,
        nameSubUserClient: (await requerimentBasicData).data?.[0].subUserName,
        createDate: new Date(),
        deliveryDate: deliveryDate,
        requerimentID: requerimentID,
        requerimentTitle: (await offerData).data?.[0].requerimentTitle,
        currency: currencyValue,
        price: price,
        subtotal: subTotal,
        totaligv: totalIgv,
        total: total,
        igv: igv,
        userProviderID: userProviderID,
        nameUserProvider: (await offerBasicData).data?.[0].userName,
        subUserProviderID: subUserProviderID,
        nameSubUserProvider: (await offerBasicData).data?.[0].subUserName,
        subUserEmailProvider: (await offerBasicData).data?.[0].subUserEmail,
        addressProvider: (await basicProviderData).data.data?.address,
        documentProvider: (await userProviderData).data.data?.[0].document,
        emailProvider: (await offerData).data?.[0].email,
        stateID: PurchaseOrderState.PENDING,
        offerID: (await offerData).data?.[0].uid,
        offerTitle: (await offerData).data?.[0].name,
        price_Filter,
        deliveryTime_Filter,
        location_Filter,
        warranty_Filter,
        scoreState: {
          scoreClient: false,
          scoreProvider: false,
          deliveredClient: false,
          deliveredProvider: false,
        },
      };

      const CreateOrder = new PurchaseOrderModel(newPurchaseOrder);
      await CreateOrder.save();
      await RequerimentService.manageCount(
        userProviderID,
        subUserProviderID,
        "numPurchaseOrdersProvider"
      );

      await RequerimentService.manageCount(
        userClientID,
        subUserClientID,
        "numPurchaseOrdersClient"
      );
      // const sendMail = sendEmailPurchaseOrder(newPurchaseOrder);
      let responseEmail = "";
      /*  if ((await sendMail).success) {
        responseEmail = "Orden de Compra enviada al Email correctamente";
      } else {
        responseEmail = "No se ha podido enviar la Orden al Correo";
      }*/

      // Inicia el envío del correo en segundo plano
      sendEmailPurchaseOrder(newPurchaseOrder)
        .then((result) => {
          if (result.success) {
            responseEmail = "Orden de Compra enviada al Email correctamente";
          } else {
            responseEmail = "No se ha podido enviar la Orden al Correo";
          }
        })
        .catch((error) => {
          console.error("Error al enviar el correo:", error);
        });

      return {
        success: true,
        code: 200,
        res: {
          msg: "Se ha creaqdo correctamente la orden de Compra",
          responseEmail: responseEmail,
        },
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno en el Servidor, no se ha podido Crear la Orden de Compra",
        },
      };
    }
  };

  static getPurchaseOrders = async (page: number, pageSize: number) => {
    if (!page || page < 1) page = 1;
    if (!pageSize || pageSize < 1) pageSize = 10;
    try {
      const result = await PurchaseOrderModel.find()
        .sort({ createDate: -1 })
        .skip((page - 1) * pageSize) // Omitir documentos según la página
        .limit(pageSize); // Limitar el número de documentos por página;

      const totalDocuments = await PurchaseOrderModel.countDocuments();
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
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno con el Servidor",
        },
      };
    }
  };

  static getPurchaseOrdersClient = async (
    userClientID: string,
    page: number,
    pageSize: number
  ) => {
    if (!page || page < 1) page = 1;
    if (!pageSize || pageSize < 1) pageSize = 10;

    try {
      const result = await PurchaseOrderModel.find({ userClientID })
        .sort({ createDate: -1 })
        .skip((page - 1) * pageSize) // Omitir documentos según la página
        .limit(pageSize); // Limitar el número de documentos por página;;
      const totalDocuments = (await PurchaseOrderModel.find({ userClientID }))
        .length;
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
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          res: "Se ha producido un error interno en el Servidor",
        },
      };
    }
  };

  static getPurchaseOrdersProvider = async (
    userProviderID: string,
    page: number,
    pageSize: number
  ) => {
    if (!page || page < 1) page = 1;
    if (!pageSize || pageSize < 1) pageSize = 10;
    try {
      const result = await PurchaseOrderModel.find({ userProviderID })
        .sort({ createDate: -1 })
        .skip((page - 1) * pageSize) // Omitir documentos según la página
        .limit(pageSize); // Limitar el número de documentos por página;
      const totalDocuments = (await PurchaseOrderModel.find({ userProviderID }))
        .length;
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
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          res: "Se ha producido un error interno en el Servidor",
        },
      };
    }
  };

  static getPurchaseOrderID = async (uid: string) => {
    try {
      const result = await PurchaseOrderModel.findOne({ uid });
      if (!result) {
        return {
          success: false,
          code: 403,
          error: {
            msg: "Orden de Compra no encontrada",
          },
        };
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
          msg: "Error interno en el Servidor",
        },
      };
    }
  };

  static getPurchaseOrdersByEntityProvider = async (
    uid: string,
    typeUser: number,
    page: number,
    pageSize: number
  ) => {
    if (!page || page < 1) page = 1;
    if (!pageSize || pageSize < 1) pageSize = 10;
    try {
      let result;
      let totalDocuments;
      if (TypeUser.ADMIN === typeUser) {
        result = await PurchaseOrderModel.find({ userProviderID: uid })
          .sort({ createDate: -1 })
          .skip((page - 1) * pageSize) // Omitir documentos según la página
          .limit(pageSize); // Limitar el número de documentos por página
        totalDocuments = (
          await PurchaseOrderModel.find({ userProviderID: uid })
        ).length;
      } else {
        result = await PurchaseOrderModel.find({
          subUserProviderID: uid,
        })
          .sort({ createDate: -1 })
          .skip((page - 1) * pageSize) // Omitir documentos según la página
          .limit(pageSize); // Limitar el número de documentos por página
        totalDocuments = (
          await PurchaseOrderModel.find({ subUserProviderID: uid })
        ).length;
      }

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

  static getPurchaseOrdersByEntityClient = async (
    uid: string,
    typeUser: number,
    page: number,
    pageSize: number
  ) => {
    try {
      let result;
      let totalDocuments;
      if (TypeUser.ADMIN === typeUser) {
        result = await PurchaseOrderModel.find({
          userClientID: uid,
        })
          .sort({ createDate: -1 })
          .skip((page - 1) * pageSize) // Omitir documentos según la página
          .limit(pageSize); // Limitar el número de documentos por página;

        totalDocuments = (await PurchaseOrderModel.find({ userClientID: uid }))
          .length;
      } else {
        result = await PurchaseOrderModel.find({
          subUserClientID: uid,
        })
          .sort({ createDate: -1 })
          .skip((page - 1) * pageSize) // Omitir documentos según la página
          .limit(pageSize); // Limitar el número de documentos por página;

        totalDocuments = (
          await PurchaseOrderModel.find({ subUserClientID: uid })
        ).length;
      }

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

  static searchPurchaseOrderByProvider = async (
    keyWords: string,
    typeUser: TypeEntity,
    userId: string,
    page?: number,
    pageSize?: number,
    fieldName?: string,
    orderType?: number
  ) => {
    page = !page || page < 1 ? 1 : page;
    pageSize = !pageSize || pageSize < 1 ? 10 : pageSize;
    let total = 0;
    try {
      if (!keyWords) {
        keyWords = "";
      }
      let fieldUserName;
      if (TypeEntity.COMPANY === typeUser || TypeEntity.USER === typeUser) {
        fieldUserName = "userProviderID";
      } else {
        fieldUserName = "subUserProviderID";
      }

      if (!fieldName) {
        fieldName = "createDate";
      }
      let order: SortOrder;
      if (!orderType || orderType === OrderType.DESC) {
        order = -1;
      } else {
        order = 1;
      }
      const searchConditions: any = {
        $and: [
          {
            $or: [
              { requerimentTitle: { $regex: keyWords, $options: "i" } },
              { offerTitle: { $regex: keyWords, $options: "i" } },
              { userNameClient: { $regex: keyWords, $options: "i" } },
            ],
          },
          { [fieldUserName]: userId },
          { stateID: { $ne: PurchaseOrderState.ELIMINATED } }, // Excluye los documentos con stateID igual a 7
        ],
      };

      // Primero intentamos hacer la búsqueda en MongoDB
      const skip = (page - 1) * pageSize;

      let results = await PurchaseOrderModel.find(searchConditions)
        .sort({ [fieldName]: order })
        .skip(skip)
        .limit(pageSize);

      // COREGIR
      if (keyWords && results.length === 0) {
        // Crear una copia del array $and sin la condición $or
        const searchConditionsWithoutKeyWords = {
          ...searchConditions,
          $and: searchConditions.$and.filter(
            (condition: any) => !condition.$or
          ),
        };

        // Obtener todos los registros sin aplicar el filtro de palabras clave
        const allResults = await PurchaseOrderModel.find(
          searchConditionsWithoutKeyWords
        );
        PurchaseOrderState;
        // Configurar Fuse.js
        const fuse = new Fuse(allResults, {
          keys: ["requerimentTitle", "offerTitle", "userNameClient"], // Las claves por las que buscar (name y description)
          threshold: 0.4, // Define qué tan "difusa" puede ser la coincidencia (0 es exacto, 1 es muy permisivo)
        });

        // Buscar usando Fuse.js
        results = fuse.search(keyWords).map((result) => result.item);

        const sortField = fieldName ?? "createDate"; // Si fieldName es undefined, usar "publish_date"

        // Ordenar los resultados por el campo dinámico sortField
        results.sort((a, b) => {
          const valueA = (a as any)[sortField];
          const valueB = (b as any)[sortField];

          if (valueA > valueB) return orderType === OrderType.ASC ? 1 : -1;
          if (valueA < valueB) return orderType === OrderType.ASC ? -1 : 1;
          return 0; // Si son iguales, no cambiar el orden
        });
        // Total de resultados (count usando Fuse.js)
        total = results.length;

        // Aplicar paginación sobre los resultados ordenados de Fuse.js
        const start = (page - 1) * pageSize;
        results = results.slice(start, start + pageSize);
      } else {
        // Si encontramos resultados en MongoDB, el total es la cantidad de documentos encontrados
        total = await PurchaseOrderModel.countDocuments(searchConditions);
      }
      return {
        success: true,
        code: 200,
        data: results,
        res: {
          total,
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

  static searchPurchaseOrderByClient = async (
    keyWords: string,
    typeUser: TypeEntity,
    userId: string,
    page?: number,
    pageSize?: number,
    fieldName?: string,
    orderType?: number
  ) => {
    page = !page || page < 1 ? 1 : page;
    pageSize = !pageSize || pageSize < 1 ? 10 : pageSize;
    let total = 0;
    try {
      if (!keyWords) {
        keyWords = "";
      }
      let fieldUserName;
      if (TypeEntity.COMPANY === typeUser || TypeEntity.USER === typeUser) {
        fieldUserName = "userClientID";
      } else {
        fieldUserName = "subUserClientID";
      }

      if (!fieldName) {
        fieldName = "createDate";
      }
      let order: SortOrder;
      if (!orderType || orderType === OrderType.DESC) {
        order = -1;
      } else {
        order = 1;
      }
      const searchConditions: any = {
        $and: [
          {
            $or: [
              { requerimentTitle: { $regex: keyWords, $options: "i" } }, // Reemplazamos name por requirementTitle
              { offerTitle: { $regex: keyWords, $options: "i" } },
              { userNameClient: { $regex: keyWords, $options: "i" } },
            ],
          },
          { [fieldUserName]: userId },
          { stateID: { $ne: PurchaseOrderState.ELIMINATED } }, // Excluye los documentos con stateID igual a 7
        ],
      };

      // Primero intentamos hacer la búsqueda en MongoDB
      const skip = (page - 1) * pageSize;

      let results = await PurchaseOrderModel.find(searchConditions)
        .sort({ [fieldName]: order })
        .skip(skip)
        .limit(pageSize);

      if (keyWords && results.length === 0) {
        // Crear una copia del array $and sin la condición $or
        const searchConditionsWithoutKeyWords = {
          ...searchConditions,
          $and: searchConditions.$and.filter(
            (condition: any) => !condition.$or
          ),
        };
        console.log(searchConditionsWithoutKeyWords);
        // Obtener todos los registros sin aplicar el filtro de palabras clave
        const allResults = await PurchaseOrderModel.find(
          searchConditionsWithoutKeyWords
        );

        // Configurar Fuse.js
        const fuse = new Fuse(allResults, {
          keys: ["requerimentTitle", "offerTitle", "userNameProvider"], // Las claves por las que buscar (name y description)
          threshold: 0.4, // Define qué tan "difusa" puede ser la coincidencia (0 es exacto, 1 es muy permisivo)
        });

        // Buscar usando Fuse.js
        results = fuse.search(keyWords).map((result) => result.item);

        const sortField = fieldName ?? "createDate"; // Si fieldName es undefined, usar "publish_date"

        // Ordenar los resultados por el campo dinámico sortField
        results.sort((a, b) => {
          const valueA = (a as any)[sortField];
          const valueB = (b as any)[sortField];

          if (valueA > valueB) return orderType === OrderType.ASC ? 1 : -1;
          if (valueA < valueB) return orderType === OrderType.ASC ? -1 : 1;
          return 0; // Si son iguales, no cambiar el orden
        });
        // Total de resultados (count usando Fuse.js)
        total = results.length;

        // Aplicar paginación sobre los resultados ordenados de Fuse.js
        const start = (page - 1) * pageSize;
        results = results.slice(start, start + pageSize);
      } else {
        // Si encontramos resultados en MongoDB, el total es la cantidad de documentos encontrados
        total = await PurchaseOrderModel.countDocuments(searchConditions);
      }
      return {
        success: true,
        code: 200,
        data: results,
        res: {
          total,
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

  static createPDF = async (htmlContent: string): Promise<Buffer> => {
    // Iniciar el navegador de Puppeteer
    //const browser = await puppeteer.launch();
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"], // Deshabilitar sandbox
    });

    const page = await browser.newPage();
    let pdfBuffer;
    // Establecer el contenido HTML
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    // Generar el PDF como Buffer (con formato A4)
    /*  pdfBuffer = (await page.pdf({
      format: "A4",
      printBackground: true,
    })) as Buffer;
*/
    pdfBuffer = Buffer.from(
      await page.pdf({
        format: "A4",
        printBackground: true,
      })
    );
    // Cerrar el navegador
    await browser.close();

    // Retornar el buffer del PDF
    return pdfBuffer;
  };

  static getPurchaseOrderPDF = async (uid: string) => {
    try {
      const data = await this.getPurchaseOrderID(uid);
      if (data && data.success && data.data) {
        const html = await OrderPurchaseTemplate(data.data);

        // Genera el PDF a partir de la plantilla HTML
        const pdfBuffer: Buffer = await this.createPDF(html);

        // Convierte el PDF a base64
        const pdfBase64 = pdfBuffer.toString("base64");

        return {
          success: true,
          code: 200,
          data: pdfBase64,
        };
      } else {
        return {
          success: false,
          code: 403,
          error: {
            msg: "No se ha encontrado la Orden de Compra",
          },
        };
      }
    } catch (error) {
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error al generar el PDF",
        },
      };
    }
  };

  static canceled = async (purchaseOrderID: string) => {
    try {
      const purchaseOrderData = await this.getPurchaseOrderID(purchaseOrderID);
      if (purchaseOrderData.data?.stateID === PurchaseOrderState.PENDING) {
        console.log(purchaseOrderData.data?.stateID);
      }
      return {
        success: true,
        code: 200,
        data: purchaseOrderData,
        res: {
          message: "La Orden de Compra ha sido cancelada con éxito",
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
