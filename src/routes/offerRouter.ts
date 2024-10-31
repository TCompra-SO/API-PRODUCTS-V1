import { Router } from "express";
import {
  CreateOfferController,
  getbasicRateDataController,
  GetDetailOfferController,
  GetOffersByRequerimentController,
  GetOffersController,
} from "../controllers/offerController";
export class OfferRouter {
  private static instance: OfferRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/create", CreateOfferController);

    this.router.get("/getDetailOffer/:uid", GetDetailOfferController);
    this.router.get("/getOffers", GetOffersController);
    this.router.get(
      "/getOffersByRequeriment/:requerimentID",
      GetOffersByRequerimentController
    );
    this.router.get("/getBasicRateData/:uid", getbasicRateDataController);
  }

  static getRouter(): Router {
    if (!OfferRouter.instance) {
      OfferRouter.instance = new OfferRouter();
    }
    return OfferRouter.instance.router;
  }
}
