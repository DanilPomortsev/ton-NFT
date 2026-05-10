import { FetchError, ResponseError } from '@/shared/api/generated';

export class ApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const normalizeApiError = async (error: unknown): Promise<ApiError> => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof ResponseError) {
    let message = `Request failed with status ${error.response.status}`;

    try {
      const parsedBody = (await error.response.clone().json()) as unknown;

      if (typeof parsedBody === 'string' && parsedBody.trim().length > 0) {
        message = parsedBody;
      } else if (typeof parsedBody === 'object' && parsedBody !== null) {
        const responseBody = parsedBody as { message?: string; error?: string };
        message = responseBody.message ?? responseBody.error ?? message;
      }
    } catch {
      try {
        const textBody = await error.response.clone().text();
        if (textBody.trim().length > 0) {
          message = textBody;
        }
      } catch {
        // fallback to default message
      }
    }

    return new ApiError(message, error.response.status);
  }

  if (error instanceof FetchError) {
    return new ApiError(error.message);
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError('Unknown API error');
};
