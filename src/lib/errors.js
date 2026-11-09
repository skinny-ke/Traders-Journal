export class AppError extends Error {
  constructor(message, { code = "APP_ERROR", cause = null, retryable = false } = {}) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.cause = cause;
    this.retryable = retryable;
  }
}

export function toUserError(error, fallback = "Something went wrong. Please try again.") {
  if (!error) return fallback;
  if (error instanceof AppError) return error.message;

  const message = String(error.message || fallback);
  const lower = message.toLowerCase();

  if (lower.includes("failed to fetch") || lower.includes("network")) {
    return "Network interruption. Check your connection and try again.";
  }
  if (lower.includes("jwt") || lower.includes("not authenticated") || lower.includes("unauthorized")) {
    return "You must be signed in to use cloud storage. Authentication will be added in the next stage.";
  }
  if (lower.includes("row-level security") || lower.includes("rls") || lower.includes("42501")) {
    return "This action is not authorized. Cloud records are protected until you sign in.";
  }
  if (lower.includes("relation") && lower.includes("does not exist")) {
    return "The trades table is missing. Run the SQL migrations in the Supabase SQL editor.";
  }
  if (lower.includes("bucket") && lower.includes("not found")) {
    return "The screenshot storage bucket is missing. Run the storage migration in Supabase.";
  }

  return message || fallback;
}

export function logDiagnostic(scope, error) {
  if (import.meta.env.DEV) {
    console.warn(`[${scope}]`, error);
  }
}
