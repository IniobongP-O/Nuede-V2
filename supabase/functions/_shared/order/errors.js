export class OrderError extends Error {
  constructor(code, message, { status = 422, stage = "validation", cause, details } = {}) {
    super(message, { cause });
    this.name = "OrderError";
    this.code = code;
    this.status = status;
    this.stage = stage;
    this.details = details;
  }
}

export function publicErrorBody(error) {
  if (error instanceof OrderError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    };
  }

  return {
    error: {
      code: "ORDER_CREATION_FAILED",
      message: "The order could not be created. Please try again.",
    },
  };
}
