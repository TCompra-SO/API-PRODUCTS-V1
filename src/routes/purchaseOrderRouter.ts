import { Router } from "express";
import {
  CreatePurchaseOrderController,
  getPurchaseOrdersClientController,
  getPurchaseOrdersProviderController,
  getPurchaseOrderIDController,
  getPurchaseOrdersController,
  getPurchaseOrderPDFController,
  getPurchaseOrdersByProvider,
  getPurchaseOrdersByClient,
} from "../controllers/purchaseOrderController";

export class PurchaseOrderRouter {
  private static instance: PurchaseOrderRouter;
  private router: Router;

  private constructor() {
    this.router = Router();

    // ORDEN DE COMPRA
    this.router.post("/createPurchaseOrder", CreatePurchaseOrderController);

    this.router.get("/getPurchaseOrders", getPurchaseOrdersController);
    this.router.get(
      "/getPurchaseOrdersClient/:userClientID",
      getPurchaseOrdersClientController
    );
    this.router.get(
      "/getPurchaseOrdersProvider/:userProviderID",
      getPurchaseOrdersProviderController
    );

    this.router.get("/getpurchaseOrderID/:uid", getPurchaseOrderIDController);
    this.router.get("/getpurchaseOrderPDF/:uid", getPurchaseOrderPDFController);
    this.router.get(
      "/getpurchaseOrdersByProvider/:uid/:typeUser",
      getPurchaseOrdersByProvider
    );
    this.router.get(
      "/getpurchaseOrdersByClient/:uid/:typeUser",
      getPurchaseOrdersByClient
    );
  }

  static getRouter(): Router {
    if (!PurchaseOrderRouter.instance) {
      PurchaseOrderRouter.instance = new PurchaseOrderRouter();
    }
    return PurchaseOrderRouter.instance.router;
  }
}
