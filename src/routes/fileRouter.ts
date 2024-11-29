import { Router } from "express";
import {
  upload,
  uploadDocumentsOffer,
  uploadDocumentsRequeriment,
} from "../controllers/fileController";
export class FileRouter {
  private static instance: FileRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post(
      "/uploadDocumentsRequeriment",
      upload,
      uploadDocumentsRequeriment
    );

    this.router.post("/uploadDocumentsOffer", upload, uploadDocumentsOffer);
  }

  static getRouter(): Router {
    if (!FileRouter.instance) {
      FileRouter.instance = new FileRouter();
    }
    return FileRouter.instance.router;
  }
}
