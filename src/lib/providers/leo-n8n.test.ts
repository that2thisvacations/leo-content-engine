import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { validateLeoEpisodeJob } from "./leo-n8n";
import { verifyLeoWebhook } from "./leo-n8n-signature";

const secret = "a".repeat(48);
const payload = {
  episodeId: "leo-japan-001",
  topic: "Leo explores Kyoto",
  durationSeconds: 60,
  aspectRatio: "9:16",
  canonicalCharacterReferenceUrl: "https://example.org/leo-reference.png",
  requireApproval: true,
};
function signed(body: string, timestamp: number, id: string) {
  const sig = createHmac("sha256", secret).update(timestamp + "." + body).digest("hex");
  return new Headers({"x-leo-timestamp": String(timestamp), "x-leo-signature": sig, "x-leo-idempotency-key": id});
}
describe("Leo episode orchestration security", () => {
  it("accepts a valid episode brief", () => {
    assert.equal(validateLeoEpisodeJob(payload).episodeId, "leo-japan-001");
  });
  it("rejects episode briefs without approval", () => {
    assert.throws(() => validateLeoEpisodeJob({...payload, requireApproval: false}));
  });
  it("rejects insecure reference URLs", () => {
    assert.throws(() => validateLeoEpisodeJob({...payload, canonicalCharacterReferenceUrl: "http://example.org/leo.png"}));
  });
  it("accepts a correctly signed webhook", () => {
    const now = 1792500000;
    const id = "7c3e18b2-34b0-4a7a-a930-a20414d82c09";
    const body = JSON.stringify({version:1,jobId:id,type:"leo-episode",payload,creativeDirection:{}});
    assert.equal(verifyLeoWebhook(body,signed(body,now,id),secret,now).jobId,id);
  });
  it("rejects tampered content", () => {
    const now = 1792500000;
    const id = "7c3e18b2-34b0-4a7a-a930-a20414d82c09";
    const body = JSON.stringify({version:1,jobId:id,type:"leo-episode",payload,creativeDirection:{}});
    assert.throws(()=>verifyLeoWebhook(body+" ",signed(body,now,id),secret,now));
  });
  it("rejects expired timestamps", () => {
    const now = 1792500000;
    const id = "7c3e18b2-34b0-4a7a-a930-a20414d82c09";
    const body = JSON.stringify({version:1,jobId:id,type:"leo-episode",payload,creativeDirection:{}});
    assert.throws(()=>verifyLeoWebhook(body,signed(body,now-301,id),secret,now));
  });
});
