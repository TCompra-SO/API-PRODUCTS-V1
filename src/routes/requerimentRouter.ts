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
  searchProductsByUserController,
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
      "/getRequerimentsByEntity/:uid/:page/:pageSize/:fieldName/:orderType",
      getRequerimentsByEntityController
    );
    this.router.get(
      "/getRequerimentsBySubUser/:uid/:page/:pageSize/:fieldName/:orderType",
      getRequerimentsBySubUserController
    );

    this.router.get("/delete/:uid", deleteController);
    this.router.post("/canceled", canceledController);
    this.router.post("/republish", republishController);
    this.router.post("/culminate", culminateController);
    this.router.post("/searchMainFilters", searchMainFiltersController);
    this.router.post("/searchProductsByUser", searchProductsByUserController);
  }

  static getRouter(): Router {
    if (!RequerimentRouter.instance) {
      RequerimentRouter.instance = new RequerimentRouter();
    }
    return RequerimentRouter.instance.router;
  }
}
