import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { once } from "node:events";

const root = resolve(import.meta.dirname, "..");
const port = 3217;
const productionMode = process.argv.includes("--production");
const baseUrl = `http://127.0.0.1:${port}`;
const dataDir = await mkdtemp(join(tmpdir(), "personalweb-functional-"));
const nextCli = resolve(root, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextCli, productionMode ? "start" : "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: root,
  env: { ...process.env, PORTAL_DATA_DIR: dataDir, ADMIN_PASSWORD: "functional-admin", SESSION_SECRET: "functional-session-secret-at-least-thirty-two-chars" },
  stdio: ["ignore", "pipe", "pipe"]
});

let serverLog = "";
child.stdout.on("data", (chunk) => { serverLog += chunk.toString(); });
child.stderr.on("data", (chunk) => { serverLog += chunk.toString(); });

async function waitForServer() {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch { /* Server is still starting. */ }
    await new Promise((resolveWait) => setTimeout(resolveWait, 300));
  }
  throw new Error(`Server did not start.\n${serverLog}`);
}

function cookieOf(response) {
  const value = response.headers.get("set-cookie");
  assert.ok(value, "Expected a session cookie.");
  return value.split(";")[0];
}

try {
  await waitForServer();
  const health = await fetch(`${baseUrl}/api/health`);
  assert.deepEqual(await health.json(), { status: "ok", adapter: "local-file" });

  const publicHome = await fetch(`${baseUrl}/`);
  assert.equal(publicHome.status, 200);
  assert.match(await publicHome.text(), /WorseFive&apos;s Cabinet|WorseFive's Cabinet/);

  const comment = await fetch(`${baseUrl}/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.17" },
    body: JSON.stringify({ postSlug: "the-library-is-a-user-interface", authorName: "Functional test", body: "This should wait for moderation." })
  });
  assert.equal(comment.status, 201);
  const createdComment = (await comment.json()).comment;
  assert.equal(createdComment.status, "pending");

  const crossOriginComment = await fetch(`${baseUrl}/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://untrusted.example", "X-Forwarded-For": "203.0.113.17" },
    body: JSON.stringify({ postSlug: "the-library-is-a-user-interface", authorName: "Cross origin", body: "This must not be accepted." })
  });
  assert.equal(crossOriginComment.status, 403);

  for (const index of [2, 3]) {
    const additionalComment = await fetch(`${baseUrl}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.17" },
      body: JSON.stringify({ postSlug: "the-library-is-a-user-interface", authorName: `Rate test ${index}`, body: `Accepted test comment ${index}.` })
    });
    assert.equal(additionalComment.status, 201);
  }
  const rateLimitedComment = await fetch(`${baseUrl}/api/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.17" },
    body: JSON.stringify({ postSlug: "the-library-is-a-user-interface", authorName: "Rate test 4", body: "This must be rate limited." })
  });
  assert.equal(rateLimitedComment.status, 429);

  const invalidComment = await fetch(`${baseUrl}/api/comments`, { method: "POST", headers: { "Content-Type": "application/json", "X-Forwarded-For": "203.0.113.18" }, body: JSON.stringify({ postSlug: "bad slug", authorName: "A", body: "x" }) });
  assert.equal(invalidComment.status, 400);

  assert.equal((await fetch(`${baseUrl}/api/admin/comments`)).status, 401);
  const failedLogin = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "wrong" }) });
  assert.equal(failedLogin.status, 401);
  const login = await fetch(`${baseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: "functional-admin" }) });
  assert.equal(login.status, 200);
  const cookie = cookieOf(login);

  const queue = await fetch(`${baseUrl}/api/admin/comments`, { headers: { Cookie: cookie } });
  assert.equal(queue.status, 200);
  assert.equal((await queue.json()).comments.some((entry) => entry.id === createdComment.id), true);

  const approval = await fetch(`${baseUrl}/api/admin/comments/${createdComment.id}`, { method: "PATCH", headers: { "Content-Type": "application/json", Cookie: cookie }, body: JSON.stringify({ status: "published" }) });
  assert.equal(approval.status, 200);
  const published = await fetch(`${baseUrl}/api/comments?post=the-library-is-a-user-interface`);
  assert.equal((await published.json()).comments.some((entry) => entry.id === createdComment.id), true);

  const deniedUploadForm = new FormData();
  deniedUploadForm.set("title", "Denied file"); deniedUploadForm.set("description", "This should be rejected without a session."); deniedUploadForm.set("file", new File(["blocked"], "blocked.txt", { type: "text/plain" }));
  assert.equal((await fetch(`${baseUrl}/api/admin/uploads`, { method: "POST", body: deniedUploadForm })).status, 401);

  const badUploadForm = new FormData();
  badUploadForm.set("title", "Unsafe executable"); badUploadForm.set("description", "This should fail allowlist validation."); badUploadForm.set("file", new File(["MZ"], "danger.exe", { type: "application/x-msdownload" }));
  assert.equal((await fetch(`${baseUrl}/api/admin/uploads`, { method: "POST", headers: { Cookie: cookie }, body: badUploadForm })).status, 400);

  const spoofedPdfForm = new FormData();
  spoofedPdfForm.set("title", "Spoofed PDF"); spoofedPdfForm.set("description", "This must fail the server-side signature check."); spoofedPdfForm.set("file", new File(["not a PDF"], "spoofed.pdf", { type: "application/pdf" }));
  assert.equal((await fetch(`${baseUrl}/api/admin/uploads`, { method: "POST", headers: { Cookie: cookie }, body: spoofedPdfForm })).status, 400);

  const uploadForm = new FormData();
  uploadForm.set("title", "Functional field notes"); uploadForm.set("description", "A text file created by the end-to-end test."); uploadForm.set("file", new File(["tested local resource\n"], "field-notes.txt", { type: "text/plain" }));
  const upload = await fetch(`${baseUrl}/api/admin/uploads`, { method: "POST", headers: { Cookie: cookie }, body: uploadForm });
  assert.equal(upload.status, 201);
  const resource = (await upload.json()).resource;
  const adminResources = await fetch(`${baseUrl}/api/admin/resources`, { headers: { Cookie: cookie } });
  assert.equal(adminResources.status, 200);
  assert.equal((await adminResources.json()).resources.some((entry) => entry.id === resource.id), true);
  const download = await fetch(`${baseUrl}/api/library/${resource.id}/download`);
  assert.equal(download.status, 200);
  assert.equal(download.headers.get("x-content-type-options"), "nosniff");
  assert.equal(await download.text(), "tested local resource\n");
  const removal = await fetch(`${baseUrl}/api/admin/resources/${resource.id}`, { method: "DELETE", headers: { Cookie: cookie } });
  assert.equal(removal.status, 200);
  assert.equal((await fetch(`${baseUrl}/api/library/${resource.id}/download`)).status, 404);

  const logout = await fetch(`${baseUrl}/api/auth/logout`, { method: "POST", headers: { Cookie: cookie } });
  assert.equal(logout.status, 200);
  assert.equal((await fetch(`${baseUrl}/api/admin/comments`, { headers: { Cookie: cookieOf(logout) } })).status, 401);
  console.log(`PASS (${productionMode ? "production" : "development"}): public routes, cross-origin and rate-limit comment defenses, moderation, administrator boundary, rejected uploads, accepted upload, server-mediated download, object deletion, and logout.`);
} finally {
  if (!child.killed) child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), new Promise((resolveWait) => setTimeout(resolveWait, 5_000))]);
  await rm(dataDir, { recursive: true, force: true });
}
