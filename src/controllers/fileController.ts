import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response } from "express";
import { FileService } from "../services/fileService"; // Asegúrate de que el servicio esté importado correctamente

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

// Filtrar solo archivos PDF
const fileFilter = (req: Request, file: Express.Multer.File, cb: any) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(
      new Error("Formato de archivo no permitido. Solo se permiten PDF"),
      false
    );
  }
};

// Configuración de multer para máximo 5 documentos PDF
export const upload = multer({
  storage,
  fileFilter,
  limits: { files: 5, fileSize: 5 * 1024 * 1024 },
}).array("documents", 5);

export const uploadDocumentsRequeriment = async (
  req: Request,
  res: Response
) => {
  try {
    const { uid } = req.body;
    const files = req.files as Express.Multer.File[]; // Archivos cargados

    // Validar que se hayan cargado archivos y que no superen el límite de 5
    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ message: "Debes cargar al menos un documento PDF." });
    }
    if (files.length > 5) {
      return res
        .status(400)
        .json({ message: "No puedes cargar más de 5 documentos PDF." });
    }

    // Extraer las rutas de los documentos
    const filePaths = files.map((file) => file.path);

    // Subir documentos y recibir las URLs
    const responseUser = await FileService.uploadDocumentsRequeriment(
      filePaths,
      uid
    );

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
    res.status(500).json({ message: "Error al cargar los documentos", error });
  }
};

export const uploadDocumentsOffer = async (req: Request, res: Response) => {
  try {
    const { uid } = req.body;
    const files = req.files as Express.Multer.File[]; // Archivos cargados

    // Validar que se hayan cargado archivos y que no superen el límite de 5
    if (!files || files.length === 0) {
      return res
        .status(400)
        .json({ message: "Debes cargar al menos un documento PDF." });
    }
    if (files.length > 5) {
      return res
        .status(400)
        .json({ message: "No puedes cargar más de 5 documentos PDF." });
    }

    // Extraer las rutas de los documentos
    const filePaths = files.map((file) => file.path);

    // Subir documentos y recibir las URLs
    const responseUser = await FileService.uploadDocumentsOffer(filePaths, uid);

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
    res.status(500).json({ message: "Error al cargar los documentos", error });
  }
};
