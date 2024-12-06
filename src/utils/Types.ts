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
}
