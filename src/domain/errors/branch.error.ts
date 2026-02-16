

export class BranchNotFoundError extends Error {
  constructor(
    readonly message: string,
    readonly statusCode: number = 404
  ) {
    super(message)
  }
}

export class BranchAssignManagerError extends Error {
  constructor(
    readonly message: string,
    readonly statusCode: number = 400
  ) {
    super(message)
  }
}

export class ManagerNotAssignedError extends Error {
  constructor(
    readonly branchId: string,
    readonly statusCode: number = 400
  ) {
    super(`No hay manager asignado a la sucursal ${branchId}`);
  }
}