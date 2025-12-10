import type { ValidationErrorResponse } from "../types";

/**
 * Custom error class for API errors with status code and response body
 */
export class ApiError extends Error {
  status: number;
  code?: string;
  details?: Record<string, string>;

  constructor(message: string, status: number, body?: ValidationErrorResponse) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = body?.code;
    this.details = body?.details;
  }

  isValidationError(): boolean {
    return this.status === 400 || this.status === 422;
  }

  isNotFound(): boolean {
    return this.status === 404;
  }
}
