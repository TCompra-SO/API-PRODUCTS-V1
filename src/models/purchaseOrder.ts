import mongoose, { Schema } from "mongoose";
import ShortUniqueId from "short-unique-id";
import { PurchaseOrderI } from "../interfaces/purchaseOrder.interface";

const uid = new ShortUniqueId({ length: 20 });

const PurchaseOrderSchema = new Schema<PurchaseOrderI>({
  uid: {
    type: String,
    required: true,
    unique: true,
    default: () => uid.rnd(),
  },
  type: {
    type: Number,
    required: true,
  },
  userClientID: {
    type: String,
    required: true,
  },
  userNameClient: {
    type: String,
    required: true,
  },
  addressClient: {
    type: String,
    required: true,
  },
  documentClient: {
    type: String,
    required: true,
  },
  subUserClientID: {
    type: String,
    required: false,
  },
  nameSubUserClient: {
    type: String,
    required: false,
  },
  createDate: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
    required: true,
  },
  requerimentID: {
    type: String,
    required: true,
  },
  requerimentTitle: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  subtotal: {
    type: Number,
    required: true,
  },
  totaligv: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  igv: {
    type: Number,
    required: true,
  },
  userProviderID: {
    type: String,
    required: true,
  },
  nameUserProvider: {
    type: String,
    required: true,
  },
  subUserProviderID: {
    type: String,
    required: false,
  },
  nameSubUserProvider: {
    type: String,
    required: false,
  },
  addressProvider: {
    type: String,
    required: true,
  },
  documentProvider: {
    type: String,
    required: true,
  },
  emailProvider: {
    type: String,
    required: true,
  },
  state: {
    type: Number,
    required: true,
  },
  offerID: {
    type: String,
    required: true,
  },
  offerTitle: {
    type: String,
    required: true,
  },
  price_Filter: {
    type: Number,
    required: false,
  },
  deliveryTime_Filter: {
    type: Number,
    required: false,
  },
  location_Filter: {
    type: Number,
    required: false,
  },
  warranty_Filter: {
    type: Number,
    required: false,
  },
});

const PurchaseOrderModel = mongoose.model<PurchaseOrderI>(
  "PurchaseOrderProducts",
  PurchaseOrderSchema
);

export default PurchaseOrderModel;
