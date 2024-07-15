import { StatusCodes } from "http-status-codes";

export interface IErrorResponse {
  message: string;
  statusCode: number;
  serializeErrors(): IError;
}

export interface IError {
  message: string;
}

export abstract class CustomError extends Error {
  abstract statusCode: number;
  constructor(message: string) {
    super(message);
  }
  serializeErrors(): IError {
    return {
      message: this.message,
    };
  }
}

export class BadRequestError extends CustomError {
  statusCode: number = StatusCodes.BAD_REQUEST;

  constructor(public message: string) {
    super(message);
  }
}

export class NotAuthorizedError extends CustomError {
  statusCode: number = StatusCodes.UNAUTHORIZED;

  constructor() {
    super("Not Authorized");
  }
}

export class NotFoundError extends CustomError {
  statusCode: number = StatusCodes.NOT_FOUND;

  constructor() {
    super("Route not found");
  }
}

export class PermissionError extends CustomError {
  statusCode: number = StatusCodes.FORBIDDEN;

  constructor(message?: string) {
    super(message || "Permission denied");
  }
}

export class RedisError extends CustomError {
  statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR;

  constructor(public message: string, statusCode: number) {
    super(message);
  }
}
