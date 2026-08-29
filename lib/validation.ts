const allowedUploads = {
  ".txt": "text/plain",
  ".pdf": "application/pdf",
  ".png": "image/png"
} as const;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type AllowedMediaType = (typeof allowedUploads)[keyof typeof allowedUploads];

function cleanText(value: string) {
  return value.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
}

export function validateCommentInput(input: unknown) {
  if (typeof input !== "object" || input === null) {
    return { ok: false as const, error: "Comment data must be an object." };
  }

  const record = input as Record<string, unknown>;
  const postSlug = cleanText(String(record.postSlug ?? ""));
  const authorName = cleanText(String(record.authorName ?? ""));
  const body = cleanText(String(record.body ?? ""));

  if (!/^[a-z0-9-]{3,100}$/i.test(postSlug)) {
    return { ok: false as const, error: "The article reference is invalid." };
  }
  if (authorName.length < 2 || authorName.length > 40) {
    return { ok: false as const, error: "Name must contain 2 to 40 characters." };
  }
  if (body.length < 2 || body.length > 1200) {
    return { ok: false as const, error: "Comment must contain 2 to 1200 characters." };
  }

  return { ok: true as const, value: { postSlug, authorName, body } };
}

export function validateUploadMetadata(name: string, mediaType: string, size: number) {
  const extension = name.slice(name.lastIndexOf(".")).toLowerCase();
  const expectedType = allowedUploads[extension as keyof typeof allowedUploads];
  if (!expectedType || expectedType !== mediaType) {
    return { ok: false as const, error: "Only TXT, PDF, and PNG files with matching media types are allowed." };
  }
  if (!Number.isFinite(size) || size < 1 || size > MAX_UPLOAD_BYTES) {
    return { ok: false as const, error: "File size must be between 1 byte and 5 MB." };
  }
  return { ok: true as const, mediaType: expectedType };
}

export function validateMagicBytes(mediaType: AllowedMediaType, bytes: Uint8Array) {
  if (mediaType === "application/pdf") {
    return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
  }
  if (mediaType === "image/png") {
    return [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte);
  }
  return !bytes.includes(0);
}
