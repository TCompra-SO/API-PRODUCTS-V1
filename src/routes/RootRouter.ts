import { Router } from "express";
import { RequerimentRouter } from "./requerimentRouter";
import { OfferRouter } from "./offerRouter";
import { ImageRouter } from "./imageRouter";
import { FileRouter } from "./fileRouter";
export class RootRouter {
  private static instance: RootRouter;
  private router: Router;

  constructor() {
    this.router = Router();
    this.router.use("/v1/requeriments/", RequerimentRouter.getRouter());
    this.router.use("/v1/offers/", OfferRouter.getRouter());
    this.router.use("/v1/images/", ImageRouter.getRouter());
    this.router.use("/v1/documents/", FileRouter.getRouter());
  }

  static getRouter(): Router {
    if (!RootRouter.instance) {
      RootRouter.instance = new RootRouter();
    }
    return RootRouter.instance.router;
  }
}
