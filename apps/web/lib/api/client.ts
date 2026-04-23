export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly details?: Record<string, string>
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}
