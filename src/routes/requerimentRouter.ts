import { Router } from "express";
import {
  createRequerimentController,
  expiredController,
  getbasicRateDataController,
  getRequerimentIDController,
  getRequerimentsController,
  selectOfferController,
} from "../controllers/requerimentController";

import { CreatePurchaseOrderController } from "../controllers/purchaseOrderController";
export class RequerimentRouter {
  private static instance: RequerimentRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/create", createRequerimentController);
    this.router.post("/selectOffer", selectOfferController);

    // ORDEN DE COMPRA
    this.router.post("/createPurchaseOrder", CreatePurchaseOrderController);

    this.router.get("/getRequeriments", getRequerimentsController);
    this.router.get("/getRequeriment/:uid", getRequerimentIDController);
    this.router.get("/getBasicRateData/:uid", getbasicRateDataController);
    this.router.get("/expired", expiredController);
  }

  static getRouter(): Router {
    if (!RequerimentRouter.instance) {
      RequerimentRouter.instance = new RequerimentRouter();
    }
    return RequerimentRouter.instance.router;
  }
}
