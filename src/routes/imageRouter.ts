import { Router } from "express";
import { upload, uploadImages } from "../controllers/imageController";
export class ImageRouter {
  private static instance: ImageRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/upload-images", upload, uploadImages);
  }

  static getRouter(): Router {
    if (!ImageRouter.instance) {
      ImageRouter.instance = new ImageRouter();
    }
    return ImageRouter.instance.router;
  }
}
