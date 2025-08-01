export enum RequirementState {
  PUBLISHED = 1,
  SELECTED = 2,
  FINISHED = 3,
  // DESERTED = 4,
  EXPIRED = 5,
  CANCELED = 6,
  ELIMINATED = 7,
  DISPUTE = 4,
}

export enum OfferState {
  ACTIVE = 1,
  WINNER = 2,
  FINISHED = 3,
  DISPUTE = 4,
  CANCELED = 5,
  ELIMINATED = 7,
}

export enum PurchaseOrderState {
  PENDING = 1,
  CANCELED = 2,
  FINISHED = 3,
  DISPUTE = 4,
  ELIMINATED = 7,
}

export enum TypeUser {
  ADMIN = 1,
}

export enum TypeEntity {
  COMPANY = "Company",
  USER = "User",
  SUBUSER = "SubUser",
  MASTER = "Master",
}
export enum OrderType {
  ASC = 1,
  DESC = 2,
}

export enum TypeSocket {
  CREATE = 0,
  UPDATE = 1,
  DELETE = 2,
  UPDATE_FIELD = 4,
}

export enum NameAPI {
  NAME = "Product",
}

export enum NotificationAction {
  VIEW_REQUIREMENT = 25,
  VIEW_CERTIFICATION = 40,
  VIEW_HISTORY = 15,
  VIEW_OFFER = 26,
  DOWNLOAD_PURCHASE_ORDER = 12,
  CULMINATE = 4,
  FINISH_REQUIREMENT = 44,
  FINISH_OFFER = 45,
}

export enum RequirementType {
  GOOD = 1,
  SERVICE = 2,
  SALE = 3,
}

export enum NotificationType {
  DIRECT = 0,
  BROADCAST = 1,
}
