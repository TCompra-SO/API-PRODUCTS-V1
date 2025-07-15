import axios from "axios";
import { timeNotificationNewRequirements } from "../globals";
import { RequerimentI } from "../interfaces/requeriment.interface";
import ProductModel from "../models/productModel";
import { RequirementState, RequirementType } from "../utils/Types";

export const getNotificationForLastCreatedRequirements = async () => {
  const xMinutesAgo = new Date(
    Date.now() - timeNotificationNewRequirements * 60 * 1000
  );
  const groupedRecords = await ProductModel.aggregate<RequerimentI>([
    {
      $match: {
        publish_date: { $gte: xMinutesAgo },
        stateID: RequirementState.PUBLISHED,
      },
    },
    { $group: { _id: "$categoryID", count: { $sum: 1 } } },
  ]);

  if (groupedRecords.length === 0) {
    console.log(
      `No hubo nuevos registros en los últimos ${timeNotificationNewRequirements} minutos.`
    );
    return;
  }

  await axios.post(
    `${process.env.API_USER}/v1/notification/sendLastRequirementsNotification/${RequirementType.GOOD}`,
    groupedRecords
  );
};
