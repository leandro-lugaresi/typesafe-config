import { isAbsolute, join } from 'path';

type ErrorWithMessage = {
  message: string;
  stack?: string;
};

export function getEnvOrDefault(key: string, defaultValue: string) {
  const value = process.env[key];
  if (value === undefined) {
    return defaultValue;
  }
  return value;
}

export function toAbsolutePath(path: string) {
  if (isAbsolute(path)) {
    return path;
  }
  return join(process.cwd(), path);
}

export function errorHaveCode(error: unknown): error is Error & { code: string } {
  return error instanceof Error && 'code' in error;
}

function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>)['message'] === 'string'
  );
}

export function toError(maybeError: unknown): Error {
  if (maybeError instanceof Error) return maybeError;
  if (isErrorWithMessage(maybeError)) return maybeError as Error;
  if (typeof maybeError === 'string') return new Error(maybeError);

  try {
    return new Error(JSON.stringify(maybeError));
  } catch {
    // fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError));
  }
}
