import { RequerimentI } from "../interfaces/requeriment.interface";
import ProductModel from "../models/productModel";

export class RequerimentServices {
  static CreateRequeriment = async (data: RequerimentI) => {
    const {
      name,
      description,
      categoryID,
      cityID,
      budget,
      currencyID,
      payment_methodID,
      completion_date,
      submission_dateID,
      warranty,
      duration,
      allowed_bidersID,
      userID,
    } = data;
    try {
      const newRequeriment = new ProductModel({
        name,
        description,
        categoryID,
        cityID,
        budget,
        currencyID,
        payment_methodID,
        completion_date,
        submission_dateID,
        warranty,
        duration,
        allowed_bidersID,
        userID,
        publish_date: new Date(),
        number_offerts: 0,
        stateID: 1,
      });
      const savedRequeriment = await newRequeriment.save();
      if (!savedRequeriment) {
        return {
          success: false,
          code: 500,
          error: {
            msg: "Se ha producido un error al crear el Requerimiento",
          },
        };
      }
      return {
        success: true,
        code: 200,
        res: {
          msg: "Se ha creado correctamente el requerimiento",
        },
      };
    } catch (error) {
      console.log(error);
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno en el Servidor",
        },
      };
    }
  };

  static getRequeriments = async () => {
    try {
      const requeriments = await ProductModel.find();
      if (!requeriments) {
        return {
          success: false,
          code: 404,
          res: {
            msg: "Ha ocurrido un error al listar los Requerimientos",
          },
        };
      }

      return {
        success: true,
        code: 200,
        data: requeriments,
      };
    } catch (error) {
      return {
        success: false,
        code: 500,
        error: {
          msg: "Error interno en el Servidor",
        },
      };
    }
  };
}
