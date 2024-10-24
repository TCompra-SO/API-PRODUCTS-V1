import { Router } from "express";
import { RequerimentRouter } from "./requerimentRouter";
import { OfferRouter } from "./offerRouter";
export class RootRouter {
  private static instance: RootRouter;
  private router: Router;

  constructor() {
    this.router = Router();
    this.router.use("/v1/requeriments/", RequerimentRouter.getRouter());
    this.router.use("/v1/offers/", OfferRouter.getRouter());
  }

  static getRouter(): Router {
    if (!RootRouter.instance) {
      RootRouter.instance = new RootRouter();
    }
    return RootRouter.instance.router;
  }
}
