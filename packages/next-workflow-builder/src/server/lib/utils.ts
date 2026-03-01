/**
 * Extract a meaningful error message from various error types.
 * Handles Error instances, objects with message/error properties, strings,
 * and nested error structures common in AI SDKs.
 * Note: This is synchronous - use getErrorMessageAsync for Promise errors.
 */
export function getErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (error === null || error === undefined) {
    return "Unknown error";
  }

  // Handle Error instances (and their subclasses)
  if (error instanceof Error) {
    // Some errors have a cause property with more details
    if (error.cause && error.cause instanceof Error) {
      return `${ error.message }: ${ error.cause.message }`;
    }
    return error.message;
  }

  // Handle strings
  if (typeof error === "string") {
    return error;
  }

  // Handle objects
  if (typeof error === "object") {
    const obj = error as Record<string, unknown>;

    // Check for common error message properties
    if (typeof obj.message === "string" && obj.message) {
      return obj.message;
    }

    // AI SDK often wraps errors in responseBody or data
    if (obj.responseBody && typeof obj.responseBody === "object") {
      const body = obj.responseBody as Record<string, unknown>;
      if (typeof body.error === "string") {
        return body.error;
      }
      if (
        body.error &&
        typeof body.error === "object" &&
        typeof (body.error as Record<string, unknown>).message === "string"
      ) {
        return (body.error as Record<string, unknown>).message as string;
      }
    }

    // Check for nested error property
    if (typeof obj.error === "string" && obj.error) {
      return obj.error;
    }
    if (obj.error && typeof obj.error === "object") {
      const nestedError = obj.error as Record<string, unknown>;
      if (typeof nestedError.message === "string") {
        return nestedError.message;
      }
    }

    // Check for data.error pattern (common in API responses)
    if (obj.data && typeof obj.data === "object") {
      const data = obj.data as Record<string, unknown>;
      if (typeof data.error === "string") {
        return data.error;
      }
      if (typeof data.message === "string") {
        return data.message;
      }
    }

    // Check for reason property (common in some error types)
    if (typeof obj.reason === "string" && obj.reason) {
      return obj.reason;
    }

    // Check for statusText (HTTP errors)
    if (typeof obj.statusText === "string" && obj.statusText) {
      const status = typeof obj.status === "number" ? ` (${ obj.status })` : "";
      return `${ obj.statusText }${ status }`;
    }

    // Try to stringify the error object (but avoid [object Object])
    try {
      const stringified = JSON.stringify(error, null, 0);
      if (stringified && stringified !== "{}" && stringified.length < 500) {
        return stringified;
      }
    } catch {
      // Ignore stringify errors
    }

    // Last resort: use Object.prototype.toString
    const toString = Object.prototype.toString.call(error);
    if (toString !== "[object Object]") {
      return toString;
    }
  }

  return "Unknown error";
}
