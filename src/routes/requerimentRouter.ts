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
  searchMainFiltersController,
} from "../controllers/requerimentController";

export class RequerimentRouter {
  private static instance: RequerimentRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/create", createRequerimentController);
    this.router.post("/selectOffer", selectOfferController);

    this.router.get(
      "/getRequeriments/:page/:pageSize",
      getRequerimentsController
    );
    this.router.get("/getRequeriment/:uid", getRequerimentIDController);
    this.router.get("/getBasicRateData/:uid", getbasicRateDataController);
    this.router.get("/expired", expiredController);

    this.router.get(
      "/getRequerimentsByEntity/:uid/:page/:pageSize",
      getRequerimentsByEntityController
    );
    this.router.get(
      "/getRequerimentsBySubUser/:uid/:page/:pageSize",
      getRequerimentsBySubUserController
    );

    this.router.get("/delete/:uid", deleteController);
    this.router.post("/canceled", canceledController);
    this.router.post("/republish", republishController);
    this.router.post("/culminate", culminateController);
    this.router.post("/searchMainFilters", searchMainFiltersController);
  }

  static getRouter(): Router {
    if (!RequerimentRouter.instance) {
      RequerimentRouter.instance = new RequerimentRouter();
    }
    return RequerimentRouter.instance.router;
  }
}
