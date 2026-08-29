import assert from "node:assert/strict";

const baseUrl = (process.env.PORTAL_TEST_BASE_URL || "").replace(/\/$/, "");
const password = process.env.PORTAL_TEST_ADMIN_PASSWORD || "";
assert.ok(/^https:\/\//.test(baseUrl), "PORTAL_TEST_BASE_URL must be an HTTPS production URL.");
assert.ok(password, "PORTAL_TEST_ADMIN_PASSWORD is required.");

function originHeaders(headers = {}) {
  return { Origin: baseUrl, ...headers };
}

function cookieOf(response) {
  const value = response.headers.get("set-cookie");
  assert.ok(value, "Expected a session cookie.");
  return value.split(";")[0];
}

const testName = `Production test ${new Date().toISOString()}`;
let cookie = "";
let commentId = "";
let resourceId = "";

try {
  const health = await fetch(`${baseUrl}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok", adapter: "supabase" });

  for (const pathname of ["/", "/about", "/blog", "/library", "/robots.txt", "/sitemap.xml"]) {
    const response = await fetch(`${baseUrl}${pathname}`);
    assert.equal(response.status, 200, `${pathname} should be reachable`);
  }

  const rejectedCrossOrigin = await fetch(`${baseUrl}/api/comments`, {
    method: "POST",
    headers: originHeaders({ "Content-Type": "application/json", Origin: "https://untrusted.example" }),
    body: JSON.stringify({ postSlug: "the-library-is-a-user-interface", authorName: "Cross origin", body: "This must be rejected." })
  });
  assert.equal(rejectedCrossOrigin.status, 403);

  const commentResponse = await fetch(`${baseUrl}/api/comments`, {
    method: "POST",
    headers: originHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ postSlug: "the-library-is-a-user-interface", authorName: "Production test", body: "A temporary comment created by the deployment verification." })
  });
  assert.equal(commentResponse.status, 201);
  commentId = (await commentResponse.json()).comment.id;

  assert.equal((await fetch(`${baseUrl}/api/admin/comments`)).status, 401);
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: originHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ password })
  });
  assert.equal(login.status, 200);
  cookie = cookieOf(login);

  const pending = await fetch(`${baseUrl}/api/admin/comments`, { headers: { Cookie: cookie } });
  assert.equal(pending.status, 200);
  assert.equal((await pending.json()).comments.some((comment) => comment.id === commentId), true);
  const published = await fetch(`${baseUrl}/api/admin/comments/${commentId}`, {
    method: "PATCH",
    headers: originHeaders({ "Content-Type": "application/json", Cookie: cookie }),
    body: JSON.stringify({ status: "published" })
  });
  assert.equal(published.status, 200);
  const visible = await fetch(`${baseUrl}/api/comments?post=the-library-is-a-user-interface`);
  assert.equal((await visible.json()).comments.some((comment) => comment.id === commentId), true);

  const form = new FormData();
  form.set("title", testName);
  form.set("description", "Temporary object-storage upload created by the deployment verification.");
  form.set("file", new File(["production object storage test\n"], "production-check.txt", { type: "text/plain" }));
  const upload = await fetch(`${baseUrl}/api/admin/uploads`, { method: "POST", headers: originHeaders({ Cookie: cookie }), body: form });
  assert.equal(upload.status, 201);
  resourceId = (await upload.json()).resource.id;
  const download = await fetch(`${baseUrl}/api/library/${resourceId}/download`);
  assert.equal(download.status, 200);
  assert.equal(await download.text(), "production object storage test\n");

  console.log("PASS: live public routes, origin defense, moderated comment lifecycle, admin boundary, and private-storage upload/download.");
} finally {
  if (cookie && resourceId) {
    const removal = await fetch(`${baseUrl}/api/admin/resources/${resourceId}`, { method: "DELETE", headers: originHeaders({ Cookie: cookie }) });
    assert.equal(removal.status, 200, "Temporary production resource cleanup failed.");
  }
  if (cookie && commentId) {
    const rejection = await fetch(`${baseUrl}/api/admin/comments/${commentId}`, {
      method: "PATCH",
      headers: originHeaders({ "Content-Type": "application/json", Cookie: cookie }),
      body: JSON.stringify({ status: "rejected" })
    });
    assert.equal(rejection.status, 200, "Temporary production comment cleanup failed.");
  }
  if (cookie) await fetch(`${baseUrl}/api/auth/logout`, { method: "POST", headers: originHeaders({ Cookie: cookie }) });
}
