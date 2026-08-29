import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_STORAGE_BUCKET", "SUPABASE_ANON_KEY"];
for (const key of required) assert.ok(process.env[key], `${key} is required for this production contract test.`);

const url = process.env.SUPABASE_URL;
const bucket = process.env.SUPABASE_STORAGE_BUCKET;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const objectKey = `contract-tests/${randomUUID()}.txt`;
const requestHash = randomUUID().replaceAll("-", "").slice(0, 64);

try {
  const directTableRead = await fetch(`${url}/rest/v1/resources?select=id&limit=1`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` }
  });
  if (directTableRead.ok) {
    assert.deepEqual(await directTableRead.json(), [], "Anonymous REST access must not reveal resource records.");
  } else {
    assert.ok([401, 403].includes(directTableRead.status), `Unexpected anonymous table status: ${directTableRead.status}`);
  }

  const { data: bucketInfo, error: bucketError } = await admin.storage.getBucket(bucket);
  assert.ifError(bucketError);
  assert.equal(bucketInfo.public, false, "The resource bucket must be private.");
  assert.equal(bucketInfo.file_size_limit, 5 * 1024 * 1024, "The bucket limit must be 5 MB.");

  const results = [];
  for (let index = 0; index < 3; index += 1) {
    const { data, error } = await admin.rpc("take_comment_allowance", { p_request_hash: requestHash });
    assert.ifError(error);
    results.push(data);
  }
  const { data: rejected, error: rejectedError } = await admin.rpc("take_comment_allowance", { p_request_hash: requestHash });
  assert.ifError(rejectedError);
  assert.deepEqual(results, [true, true, true]);
  assert.equal(rejected, false, "The fourth request in a one-minute window must be rejected.");

  const payload = new TextEncoder().encode("private storage contract payload\n");
  const { error: uploadError } = await admin.storage.from(bucket).upload(objectKey, payload, { contentType: "text/plain", upsert: false });
  assert.ifError(uploadError);
  const { data: downloaded, error: downloadError } = await admin.storage.from(bucket).download(objectKey);
  assert.ifError(downloadError);
  assert.equal(await downloaded.text(), "private storage contract payload\n");
  const { error: removeError } = await admin.storage.from(bucket).remove([objectKey]);
  assert.ifError(removeError);

  console.log("PASS: Supabase RLS boundary, private bucket policy, atomic comment rate limit, and object storage upload/download/removal.");
} finally {
  await admin.storage.from(bucket).remove([objectKey]);
}
