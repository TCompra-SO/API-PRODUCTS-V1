import { Router } from "express";
import { CreatePurchaseOrderController,getPurchaseOrderByUser, getPurchaseOrderIDController, getPurchaseOrdersController, getPurchaseOrderPDFController } from "../controllers/purchaseOrderController";

export class PurchaseOrderRouter {
    private static instance: PurchaseOrderRouter;
    private router: Router;
  
    private constructor() {
      this.router = Router();

        // ORDEN DE COMPRA
    this.router.post("/createPurchaseOrder", CreatePurchaseOrderController);
     
      this.router.get("/getPurchaseOrders", getPurchaseOrdersController);
      this.router.get("/getPurchaseOrderByUser/:userClientID", getPurchaseOrderByUser);
      this.router.get("/getpurchaseOrderID/:uid", getPurchaseOrderIDController);
      this.router.get("/getpurchaseOrderPDF/:uid", getPurchaseOrderPDFController)
    }
  
    static getRouter(): Router {
      if (!PurchaseOrderRouter.instance) {
        PurchaseOrderRouter.instance = new PurchaseOrderRouter();
      }
      return PurchaseOrderRouter.instance.router;
    }
}