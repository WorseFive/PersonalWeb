import assert from "node:assert/strict";
import test from "node:test";
import { createAdminSession, isValidAdminSession, passwordMatches } from "../legacy/server-only/lib/auth";
import { MAX_UPLOAD_BYTES, validateCommentInput, validateMagicBytes, validateUploadMetadata } from "../lib/validation";

process.env.ADMIN_PASSWORD = "functional-admin-password";
process.env.SESSION_SECRET = "functional-session-secret-that-is-long-enough";

test("comment input trims text and rejects invalid fields", () => {
  const valid = validateCommentInput({ postSlug: "the-library-is-a-user-interface", authorName: "  Ada  ", body: "  Clear notes matter.  " });
  assert.equal(valid.ok, true);
  if (valid.ok) assert.deepEqual(valid.value, { postSlug: "the-library-is-a-user-interface", authorName: "Ada", body: "Clear notes matter." });
  assert.equal(validateCommentInput({ postSlug: "bad slug", authorName: "Ada", body: "Valid body" }).ok, false);
  assert.equal(validateCommentInput({ postSlug: "the-library-is-a-user-interface", authorName: "A", body: "Valid body" }).ok, false);
  assert.equal(validateCommentInput({ postSlug: "the-library-is-a-user-interface", authorName: "Ada", body: "x" }).ok, false);
});

test("upload metadata and signatures are allowlisted", () => {
  assert.equal(validateUploadMetadata("notes.txt", "text/plain", 12).ok, true);
  assert.equal(validateUploadMetadata("danger.exe", "application/x-msdownload", 12).ok, false);
  assert.equal(validateUploadMetadata("notes.txt", "text/plain", MAX_UPLOAD_BYTES + 1).ok, false);
  assert.equal(validateMagicBytes("application/pdf", new TextEncoder().encode("%PDF-1.7")), true);
  assert.equal(validateMagicBytes("application/pdf", new TextEncoder().encode("not a PDF")), false);
  assert.equal(validateMagicBytes("image/png", new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0])), true);
  assert.equal(validateMagicBytes("image/png", new Uint8Array([0, 0, 0, 0])), false);
  assert.equal(validateMagicBytes("text/plain", new TextEncoder().encode("safe text")), true);
  assert.equal(validateMagicBytes("text/plain", new Uint8Array([65, 0, 66])), false);
});

test("administrator sessions are signed and tamper resistant", () => {
  assert.equal(passwordMatches("functional-admin-password"), true);
  assert.equal(passwordMatches("incorrect"), false);
  const session = createAdminSession();
  assert.ok(session);
  assert.equal(isValidAdminSession(session ?? undefined), true);
  assert.equal(isValidAdminSession(`${session}tampered`), false);
});
