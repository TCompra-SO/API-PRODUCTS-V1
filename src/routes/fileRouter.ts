import { Router } from "express";
import { upload, uploadDocuments } from "../controllers/fileController";
export class FileRouter {
  private static instance: FileRouter;
  private router: Router;

  private constructor() {
    this.router = Router();
    this.router.post("/upload-documents", upload, uploadDocuments);
  }

  static getRouter(): Router {
    if (!FileRouter.instance) {
      FileRouter.instance = new FileRouter();
    }
    return FileRouter.instance.router;
  }
}
