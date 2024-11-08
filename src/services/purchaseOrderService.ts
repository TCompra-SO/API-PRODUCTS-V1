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
        `${API_USER}/getBaseDataUser/${subUserProviderID}`
      );

      const basicProviderData = await axios.get(
        `${API_USER}/getUser/${userProviderID}`
      );

      const baseClientData = await axios.get(
        `${API_USER}/getUser/${subUserClientID}`
      );

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
        totalIgv = price - subTotal;
        total = price;
      }
      const newPurchaseOrder = {
        type: TypeRequeriment.PRODUCTS,
        userClientID: userClientID,
        userNameClient: (await requerimentBasicData).data?.[0].userName,
        addressClient: (await baseClientData).data.data?.[0].address,
        documentClient: (await baseClientData).data.data?.[0].document,
        subUserClientID: subUserClientID,
        nameSubUserClient: (await requerimentBasicData).data?.[0].subUserName,
        createDate: new Date(),
        deliveryDate: new Date(),
        requerimentID: requerimentID,
        requerimentTitle: (await offerData).data?.[0].requerimentTitle,
        price: price,
        subtotal: subTotal,
        totaligv: totalIgv,
        total: total,
        igv: igv,
        userProviderID: userProviderID,
        nameUserProvider: (await offerBasicData).data?.[0].userName,
        subUserProviderID: subUserProviderID,
        nameSubUserProvider: (await offerBasicData).data?.[0].subUserName,
        addressProvider: (await basicProviderData).data.data?.[0].address,
        documentProvider: (await userProviderData).data.data?.[0].document,
        emailProvider: (await offerData).data?.[0].email,
        state: PurchaseOrderState.PENDING,
        offerID: (await offerData).data?.[0].uid,
        offerTitle: (await offerData).data?.[0].name,
        price_Filter,
        deliveryTime_Filter,
        location_Filter,
        warranty_Filter,
      };
      console.log(newPurchaseOrder);
      const CreateOrder = new PurchaseOrderModel(newPurchaseOrder);
      await CreateOrder.save();

      return {
        success: true,
        code: 200,
        res: {
          msg: "Se ha creaqdo correctamente la orden de Compra",
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

  static getPurchaseOrders = async () => {
    try {
      const result = await PurchaseOrderModel.find();
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
          msg: "Error interno con el Servidor",
        },
      };
    }
  };

  static getPurchaseOrderByUser = async (userClientID: string) => {
    try {
      const result = await PurchaseOrderModel.find({ userClientID });

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
}
