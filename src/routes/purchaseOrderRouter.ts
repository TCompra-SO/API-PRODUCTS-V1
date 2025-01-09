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
  canceledController,
  searchPurchaseOrdersByProviderController,
  searchPurchaseOrdersByClientController,
} from "../controllers/purchaseOrderController";

export class PurchaseOrderRouter {
  private static instance: PurchaseOrderRouter;
  private router: Router;

  private constructor() {
    this.router = Router();

    // ORDEN DE COMPRA
    this.router.post("/createPurchaseOrder", CreatePurchaseOrderController);
    this.router.post(
      "/searchPurchaseOrdersByProvider",
      searchPurchaseOrdersByProviderController
    );
    this.router.post(
      "/searchPurchaseOrdersByClient",
      searchPurchaseOrdersByClientController
    );
    this.router.get(
      "/getPurchaseOrders/:page/:pageSize",
      getPurchaseOrdersController
    );
    this.router.get(
      "/getPurchaseOrdersClient/:userClientID/:page/:pageSize",
      getPurchaseOrdersClientController
    );
    this.router.get(
      "/getPurchaseOrdersProvider/:userProviderID/:page/:pageSize",
      getPurchaseOrdersProviderController
    );

    this.router.get("/getpurchaseOrderID/:uid", getPurchaseOrderIDController);
    this.router.get("/getpurchaseOrderPDF/:uid", getPurchaseOrderPDFController);
    this.router.get(
      "/getpurchaseOrdersByProvider/:uid/:typeUser/:page/:pageSize",
      getPurchaseOrdersByProvider
    );
    this.router.get(
      "/getpurchaseOrdersByClient/:uid/:typeUser/:page/:pageSize",
      getPurchaseOrdersByClient
    );

    this.router.get("/canceled/:purchaseOrderID", canceledController);
  }

  static getRouter(): Router {
    if (!PurchaseOrderRouter.instance) {
      PurchaseOrderRouter.instance = new PurchaseOrderRouter();
    }
    return PurchaseOrderRouter.instance.router;
  }
}
