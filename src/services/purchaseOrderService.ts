import axios from "axios";
import {
  PurchaseOrderI,
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
    offerID: string
  ) => {
    try {
      const offerBasicData = OfferService.BasicRateData(offerID);
      const offerData = OfferService.GetDetailOffer(offerID);
      const userID = (await offerBasicData).data?.[0].userId;
      const subUserID = (await offerBasicData).data?.[0].subUserId;
      const requerimentBasicData =
        RequerimentService.BasicRateData(requerimentID);
      const requerimentData =
        RequerimentService.getRequerimentById(requerimentID);
      console.log(userID + " / " + subUserID);

      const userData = await axios.get(
        `${API_USER}/getBaseDataUser/${subUserID}`
      );
      console.log(userData.data);
      if (userID === subUserID) {
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
      //Continuar aqui
      //const userBasicData =
      let price = (await offerData).data?.[0].budget;
      let subTotal = price;
      let total, totalIgv;
      if (!(await offerData).data?.[0].includesIGV) {
        console.log("el igv es: " + igv);
        totalIgv = ((await offerData).data?.[0].budget * igv) / 100;
        total = subTotal + totalIgv;
      } else {
        subTotal = price / (1 + igv / 100);
        subTotal = parseFloat(subTotal.toFixed(2));
        totalIgv = price - subTotal;
        total = price;
      }
      const newPurchaseOrder = {
        type: TypeRequeriment.PRODUCTS,
        userClientID: userID,
        userNameClient: (await requerimentBasicData).data?.[0].userName,
        addressClient: "",
        documentClient: userData.data.data?.[0].document,
        subUserClientID: subUserID,
        nameSubUserClient: (await offerBasicData).data?.[0].subUserName,
        createDate: new Date(),
        deliveryDate: "",
        requerimentTitle: (await offerData).data?.[0].requerimentTitle,
        price: price,
        subtotal: subTotal,
        igv: totalIgv,
        total: total,
        userProviderID: userID,
        nameUserProvider: (await offerBasicData).data?.[0].userName,
        subUserProviderID: subUserID,
        nameSubUserProvider: (await offerBasicData).data?.[0].subUserName,
      };
      console.log(newPurchaseOrder);
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
          msg: "Error interno en el Servidor",
        },
      };
    }
  };
}
