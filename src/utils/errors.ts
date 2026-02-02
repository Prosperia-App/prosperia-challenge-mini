export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (err: unknown) => {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      message: err.message,
    };
  }

  if (err instanceof Error) {
    return {
      statusCode: 500,
      message: err.message || 'Internal Server Error',
    };
  }

  return {
    statusCode: 500,
    message: 'Unknown error occurred',
  };
};
