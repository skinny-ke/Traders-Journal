import { supabase, isSupabaseConfigured, getCurrentUserId } from "../lib/supabaseClient.js";
import { AppError, logDiagnostic, toUserError } from "../lib/errors.js";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_SCREENSHOT_SIZE,
  SCREENSHOT_BUCKET,
  SIGNED_URL_EXPIRES_IN,
} from "../lib/constants.js";
import {
  saveScreenshot as saveLocalScreenshot,
  getScreenshot as getLocalScreenshot,
  deleteScreenshot as deleteLocalScreenshot,
} from "../lib/storage.js";

function validateFile(file) {
  if (!file) {
    throw new AppError("No screenshot file was selected.", { code: "NO_FILE" });
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new AppError("Unsupported image type. Use PNG, JPG, or WEBP.", { code: "INVALID_TYPE" });
  }
  if (file.size > MAX_SCREENSHOT_SIZE) {
    throw new AppError("Screenshot file too large (max 5 MB).", { code: "FILE_TOO_LARGE" });
  }
}

function extensionFor(file) {
  const fromName = String(file.name || "").split(".").pop()?.toLowerCase();
  if (fromName && ["png", "jpg", "jpeg", "webp"].includes(fromName)) return fromName;
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/png") return "png";
  return "jpg";
}

function uniqueName(file) {
  const id = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
  return `${id}.${extensionFor(file)}`;
}

export async function uploadScreenshot(file, userId, tradeId = "unassigned") {
  validateFile(file);

  if (!isSupabaseConfigured() || !userId) {
    const localId = `${tradeId || "local"}_${Date.now()}`;
    await saveLocalScreenshot(localId, file);
    return {
      path: null,
      id: localId,
      name: file.name,
      type: file.type,
      size: file.size,
      storage: "local",
    };
  }

  const ownerId = userId || (await getCurrentUserId());
  if (!ownerId) {
    throw new AppError("Sign in is required to upload screenshots to cloud storage.", {
      code: "UNAUTHENTICATED",
    });
  }

  const path = `${ownerId}/${tradeId}/${uniqueName(file)}`;
  const { error } = await supabase.storage.from(SCREENSHOT_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });

  if (error) {
    logDiagnostic("uploadScreenshot", error);
    throw new AppError(toUserError(error, "Failed to upload screenshot."), {
      code: "UPLOAD_FAILED",
      cause: error,
    });
  }

  return {
    path,
    id: path,
    name: file.name,
    type: file.type,
    size: file.size,
    storage: "cloud",
  };
}

export async function getScreenshotUrl(path) {
  if (!path) return null;

  if (!isSupabaseConfigured() || !path.includes("/")) {
    return null;
  }

  const { data, error } = await supabase.storage
    .from(SCREENSHOT_BUCKET)
    .createSignedUrl(path, SIGNED_URL_EXPIRES_IN);

  if (error) {
    logDiagnostic("getScreenshotUrl", error);
    throw new AppError(toUserError(error, "Failed to retrieve screenshot."), {
      code: "SIGNED_URL_FAILED",
      cause: error,
    });
  }

  return data?.signedUrl || null;
}

export async function deleteScreenshot(path) {
  if (!path) return { deleted: false };

  if (!isSupabaseConfigured() || !path.includes("/")) {
    await deleteLocalScreenshot(path);
    return { deleted: true, storage: "local" };
  }

  const { error } = await supabase.storage.from(SCREENSHOT_BUCKET).remove([path]);
  if (error) {
    logDiagnostic("deleteScreenshot", error);
    throw new AppError(toUserError(error, "Failed to delete screenshot."), {
      code: "DELETE_SCREENSHOT_FAILED",
      cause: error,
    });
  }

  return { deleted: true, storage: "cloud" };
}

export async function resolveScreenshotDisplay(screenshot) {
  if (!screenshot) return { url: null, objectUrl: false };

  if (screenshot.path && screenshot.path.includes("/")) {
    const url = await getScreenshotUrl(screenshot.path);
    return { url, objectUrl: false };
  }

  const localId = screenshot.id || screenshot.path;
  if (!localId) return { url: null, objectUrl: false };

  const file = await getLocalScreenshot(localId);
  if (!file) return { url: null, objectUrl: false };
  return { url: URL.createObjectURL(file), objectUrl: true };
}
