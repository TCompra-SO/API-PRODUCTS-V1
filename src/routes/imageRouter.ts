import { Router } from "express";
import {
  upload,
  uploadImagesOffer,
  uploadImagesRequeriment,
} from "../controllers/imageController";
export class ImageRouter {
  private static instance: ImageRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post(
      "/uploadImagesRequeriment",
      upload,
      uploadImagesRequeriment
    );

    this.router.post("/uploadImagesOffer", upload, uploadImagesOffer);
  }

  static getRouter(): Router {
    if (!ImageRouter.instance) {
      ImageRouter.instance = new ImageRouter();
    }
    return ImageRouter.instance.router;
  }
}
