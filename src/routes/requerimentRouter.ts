import { Router } from "express";
import {
  createRequerimentController,
  culminateController,
  deleteController,
  expiredController,
  getbasicRateDataController,
  getRequerimentIDController,
  getRequerimentsByEntityController,
  getRequerimentsBySubUserController,
  getRequerimentsController,
  republishController,
  selectOfferController,
  canceledController,
} from "../controllers/requerimentController";

export class RequerimentRouter {
  private static instance: RequerimentRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/create", createRequerimentController);
    this.router.post("/selectOffer", selectOfferController);

    this.router.get("/getRequeriments", getRequerimentsController);
    this.router.get("/getRequeriment/:uid", getRequerimentIDController);
    this.router.get("/getBasicRateData/:uid", getbasicRateDataController);
    this.router.get("/expired", expiredController);

    this.router.get(
      "/getRequerimentsByEntity/:uid",
      getRequerimentsByEntityController
    );
    this.router.get(
      "/getRequerimentsBySubUser/:uid",
      getRequerimentsBySubUserController
    );

    this.router.get("/delete/:uid", deleteController);
    this.router.get("/canceled/:requerimentID", canceledController);
    this.router.post("/republish", republishController);
    this.router.post("/culminate", culminateController);
  }

  static getRouter(): Router {
    if (!RequerimentRouter.instance) {
      RequerimentRouter.instance = new RequerimentRouter();
    }
    return RequerimentRouter.instance.router;
  }
}
