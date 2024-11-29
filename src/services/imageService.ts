import cloudinary from "cloudinary";
import dotenv from "dotenv";
import ProductModel from "../models/productModel";
import { RequerimentService } from "./requerimentService";
import { OfferService } from "./offerService";
import { OfferModel } from "../models/offerModel";
dotenv.config();

// Configurar Cloudinary con las credenciales desde .env
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class ImageService {
  static uploadImagesRequeriment = async (filePaths: string[], uid: string) => {
    const imageUrls: string[] = [];
    let num = 1;

    try {
      // Obtener información de requerimiento
      const resultData = await RequerimentService.getRequerimentById(uid);
      const uidData = resultData.data?.[0].uid;

      if (!uidData) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "UID no encontrado en los datos de requerimiento",
          },
        };
      }

      // Obtener imágenes actuales de la base de datos
      const existingProduct = await ProductModel.findOne({ uid: uidData });
      const existingImages = existingProduct?.images || [];

      // Eliminar las imágenes existentes en Cloudinary
      for (const imageUrl of existingImages) {
        // Extraer el public_id de la URL
        const publicId = imageUrl
          .split("/")
          .slice(-2) // Tomar las dos últimas partes de la URL
          .join("/") // Volver a unirlas
          .replace(".jpg", "") // Remover la extensión del archivo
          .replace(".png", ""); // Opcional: manejar también PNG si es necesario

        // Eliminar la imagen de Cloudinary
        await cloudinary.v2.uploader.destroy(publicId);
      }

      // Limitar las imágenes a un máximo de 5
      const limitedFilePaths = filePaths.slice(0, 5);

      // Eliminar imágenes existentes en la base de datos
      await ProductModel.findOneAndUpdate(
        { uid: uidData },
        { $set: { images: [] } }
      );

      // Subir nuevas imágenes a Cloudinary y guardar sus URLs
      for (const path of limitedFilePaths) {
        const result = await cloudinary.v2.uploader.upload(path, {
          folder: `products`,
          public_id: `${uidData}ProductImage${num}`,
        });
        imageUrls.push(result.secure_url);
        num++;
      }

      // Guardar las nuevas URLs en la base de datos
      await ProductModel.findOneAndUpdate(
        { uid: uidData },
        { $set: { images: imageUrls } },
        { new: true }
      );

      return {
        success: true,
        code: 200,
        url: imageUrls,
        res: {
          msg: "Se han cargado las nuevas imágenes correctamente",
        },
      };
    } catch (error) {
      console.error("Error al subir las imágenes:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Hubo un error con el servidor",
        },
      };
    }
  };

  static uploadImagesOffer = async (filePaths: string[], uid: string) => {
    const imageUrls: string[] = [];
    let num = 1;

    try {
      // Obtener información de requerimiento
      const resultData = await OfferService.GetDetailOffer(uid);
      const uidData = resultData.data?.[0].uid;

      if (!uidData) {
        return {
          success: false,
          code: 404,
          error: {
            msg: "UID no encontrado en los datos de requerimiento",
          },
        };
      }

      // Obtener imágenes actuales de la base de datos
      const existingOffer = await OfferModel.findOne({ uid: uidData });
      const existingImages = existingOffer?.images || [];

      // Eliminar las imágenes existentes en Cloudinary
      for (const imageUrl of existingImages) {
        // Extraer el public_id de la URL
        const publicId = imageUrl
          .split("/")
          .slice(-2) // Tomar las dos últimas partes de la URL
          .join("/") // Volver a unirlas
          .replace(".jpg", "") // Remover la extensión del archivo
          .replace(".png", ""); // Opcional: manejar también PNG si es necesario

        // Eliminar la imagen de Cloudinary
        await cloudinary.v2.uploader.destroy(publicId);
      }

      // Limitar las imágenes a un máximo de 5
      const limitedFilePaths = filePaths.slice(0, 5);

      // Eliminar imágenes existentes en la base de datos
      await OfferModel.findOneAndUpdate(
        { uid: uidData },
        { $set: { images: [] } }
      );

      // Subir nuevas imágenes a Cloudinary y guardar sus URLs
      for (const path of limitedFilePaths) {
        const result = await cloudinary.v2.uploader.upload(path, {
          folder: `products-image-offer`,
          public_id: `${uidData}ProductImageOffer${num}`,
        });
        imageUrls.push(result.secure_url);
        num++;
      }

      // Guardar las nuevas URLs en la base de datos
      await OfferModel.findOneAndUpdate(
        { uid: uidData },
        { $set: { images: imageUrls } },
        { new: true }
      );

      return {
        success: true,
        code: 200,
        url: imageUrls,
        res: {
          msg: "Se han cargado las nuevas imágenes correctamente",
        },
      };
    } catch (error) {
      console.error("Error al subir las imágenes:", error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Hubo un error con el servidor",
        },
      };
    }
  };
}
