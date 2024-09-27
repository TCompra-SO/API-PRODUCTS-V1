import mongoose, { Schema } from "mongoose";
import { RequerimentI } from "../interfaces/requeriment.interface";

import ShortUniqueId from "short-unique-id";

const uid = new ShortUniqueId({ length: 20 });

const ProductSchema = new Schema<RequerimentI>(
  {
    uid: {
      type: String,
      required: true,
      unique: true,
      default: () => uid.rnd(),
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    categoryID: {
      type: Number,
      required: true,
    },
    cityID: {
      type: Number,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
    },
    currencyID: {
      type: Number,
      required: true,
    },
    payment_methodID: {
      type: Number,
      required: true,
    },
    completion_date: {
      type: Date,
      required: true,
    },
    submission_dateID: {
      type: Number,
      required: true,
    },
    warranty: {
      type: Number,
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    allowed_bidersID: {
      type: Number,
      required: true,
    },
    userID: {
      type: String,
      required: true,
    },

    publish_date: {
      type: Date,
      required: true,
    },
    stateID: {
      type: Number,
      required: true,
    },
    number_offerts: {
      type: Number,
      required: true,
    },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const ProductModel = mongoose.model<RequerimentI>("Products", ProductSchema);
export default ProductModel;
