export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_STATE"
  | "UNSUPPORTED_FILE"
  | "FILE_TOO_LARGE"
  | "INTERNAL_ERROR";

export interface ApiError {
  error: string;
  code: ApiErrorCode;
  details?: unknown;
}

export class AppError extends Error {
  constructor(
    message: string,
    readonly code: ApiErrorCode,
    readonly status: number,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}
