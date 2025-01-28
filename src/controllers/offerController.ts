import { Request, Response } from "express";
import { OfferService } from "../services/offerService";
import { transformOffersData } from "../middlewares/offer.front.interface";
import { JwtPayload } from "jsonwebtoken";
import { RequestExt } from "../interfaces/req-ext";

const CreateOfferController = async ({ body }: Request, res: Response) => {
  try {
    const responseUser = await OfferService.CreateOffer(body);
    if (responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en CreateOfferController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const GetDetailOfferController = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;

    const responseUser = await OfferService.GetDetailOffer(uid);

    if (responseUser.success) {
      res.status(responseUser.code).send(
        transformOffersData(
          responseUser as {
            success: boolean;
            code: number;
            data: any[];
            res: any;
          }
        )
      );
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en GetDatailOfferController");
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

const GetOffersController = async (req: RequestExt, res: Response) => {
  try {
    const { page, pageSize } = req.params;
    const responseUser = await OfferService.GetOffers(
      Number(page),
      Number(pageSize)
    );
    const { uid } = req.user as JwtPayload;
    console.log(req.user);
    if (responseUser && responseUser.success) {
      if (responseUser.data) {
        res.status(responseUser.code).send(transformOffersData(responseUser));
      } else {
        // Si 'data' es undefined, puedes devolver un mensaje de error o manejarlo como prefieras
        res.status(404).send({
          success: false,
          msg: "No se encontraron requerimientos",
        });
      }
    }
  } catch (error) {
    console.error("Error en GetOffersController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

const GetOffersByEntityController = async (req: Request, res: Response) => {
  const { uid, page, pageSize } = req.params;
  try {
    const responseUser = await OfferService.getOffersByEntity(
      uid,
      Number(page),
      Number(pageSize)
    );
    if (responseUser && responseUser.success) {
      if (responseUser.data) {
        res.status(responseUser.code).send(transformOffersData(responseUser));
      } else {
        // Si 'data' es undefined, puedes devolver un mensaje de error o manejarlo como prefieras
        res.status(404).send({
          success: false,
          msg: "No se encontraron requerimientos",
        });
      }
    }
  } catch (error) {
    console.error("Error en GetOffersByEntityController");
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

const GetOffersBySubUserController = async (req: Request, res: Response) => {
  const { uid, page, pageSize } = req.params;
  try {
    const responseUser = await OfferService.getOffersBySubUser(
      uid,
      Number(page),
      Number(pageSize)
    );
    if (responseUser && responseUser.success) {
      if (responseUser.data) {
        res.status(responseUser.code).send(transformOffersData(responseUser));
      } else {
        // Si 'data' es undefined, puedes devolver un mensaje de error o manejarlo como prefieras
        res.status(404).send({
          success: false,
          msg: "No se encontraron requerimientos",
        });
      }
    }
  } catch (error) {
    console.error("Error en GetOffersBySubUserController");
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

const GetOffersByRequerimentController = async (
  req: Request,
  res: Response
) => {
  try {
    const { requerimentID, page, pageSize } = req.params;
    const responseUser = await OfferService.getOffersByRequeriment(
      requerimentID,
      Number(page),
      Number(pageSize)
    );
    if (responseUser && responseUser.success) {
      if (responseUser.data) {
        res.status(responseUser.code).send(transformOffersData(responseUser));
      } else {
        // Si 'data' es undefined, puedes devolver un mensaje de error o manejarlo como prefieras
        res.status(404).send({
          success: false,
          msg: "No se encontraron requerimientos",
        });
      }
    }
  } catch (error) {
    console.error("Error en GetOffersByRequerimentController");
    res.status(500).send({
      success: false,
      msg: "Error interno en el servidor",
    });
  }
};

const getbasicRateDataController = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    console.log(uid);
    const responseUser = await OfferService.BasicRateData(uid);
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en BasicRateDataController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const deleteController = async (req: Request, res: Response) => {
  try {
    const { uid } = req.params;
    const responseUser = await OfferService.deleteOffer(uid);
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en deleteController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const culminateController = async (req: Request, res: Response) => {
  try {
    const { offerID, delivered, score, comments } = req.body;
    const responseUser = await OfferService.culminate(
      offerID,
      delivered,
      score,
      comments
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en culminateController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const getValidationController = async (req: Request, res: Response) => {
  try {
    const { userID, requerimentID } = req.params;
    const responseUser = await OfferService.getValidation(
      userID,
      requerimentID
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en getValidationController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const canceledController = async (req: Request, res: Response) => {
  try {
    const { offerID, reason, canceledByCreator } = req.body;
    const responseUser = await OfferService.canceled(
      offerID,
      reason,
      canceledByCreator
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(responseUser);
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en canceledController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

const searchOffersByUserController = async (req: Request, res: Response) => {
  try {
    const {
      keyWords,
      userId,
      typeUser,
      page,
      pageSize,
      fieldName,
      orderType,
      filterColumn,
      filterData,
    } = req.body;
    const responseUser = await OfferService.searchOffersByUser(
      keyWords,
      userId,
      typeUser,
      Number(page),
      Number(pageSize),
      fieldName,
      Number(orderType),
      filterColumn,
      filterData
    );
    if (responseUser && responseUser.success) {
      res.status(responseUser.code).send(transformOffersData(responseUser));
    } else {
      res.status(responseUser.code).send(responseUser.error);
    }
  } catch (error) {
    console.error("Error en searchOffersByUserController", error);
    res.status(500).send({
      success: false,
      msg: "Error interno del Servidor",
    });
  }
};

export {
  CreateOfferController,
  GetDetailOfferController,
  GetOffersController,
  GetOffersByRequerimentController,
  getbasicRateDataController,
  GetOffersByEntityController,
  GetOffersBySubUserController,
  deleteController,
  culminateController,
  getValidationController,
  canceledController,
  searchOffersByUserController,
};
