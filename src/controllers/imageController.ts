import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import { ImageService } from "../services/imageService";
import ProductModel from "../models/productModel";

const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuración para almacenar archivos en una carpeta temporal
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Filtrar solo imágenes
const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Formato de archivo no permitido"), false);
  }
};

// Configuración de multer para máximo 5 imágenes
export const upload = multer({
  storage,
  fileFilter,
  limits: { files: 5, fileSize: 5 * 1024 * 1024 },
}).array("images", 5);

export const uploadImages = async (req: Request, res: Response) => {
  try {
    const { uid } = req.body;
    const files = req.files as Express.Multer.File[]; // Archivos cargados

    // Validar que se hayan cargado archivos y que no superen el límite de 5
    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ message: "Debes cargar al menos una imagen." });
    }
    if (files.length > 5) {
      return res
        .status(400)
        .json({ message: "No puedes cargar más de 5 imágenes." });
    }

    // Extraer las rutas de las imágenes
    const filePaths = files.map((file) => file.path);

    // Subir imágenes y recibir las URLs
    const responseUser = await ImageService.uploadImages(filePaths, uid);

    // Eliminar archivos temporales después de subir
    for (const filePath of filePaths) {
      fs.unlink(filePath, (err) => {});
    }

    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error al cargar las imágenes", error });
  }
};
