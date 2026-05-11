/**
 * AMB-020 — 50-VU load smoke for the cutoff endpoint.
 *
 * Goal: prove the deployed BE + Supabase Postgres handle 50
 * concurrent users polling `GET /api/events/{id}/cutoff` for one
 * minute with p95 latency under 500ms and zero HTTP errors. The
 * cutoff endpoint is the hottest path during the 45min networking
 * session — every active client calls it once per page mount, and
 * the FE countdown hook caches the response per session.
 *
 * Prerequisites:
 *   - Install k6 (`brew install k6` on macOS).
 *   - The target deployment must be reachable from the runner.
 *   - The target event must exist (idempotent seed via AMB-014).
 *
 * Run:
 *   BASE_URL=https://<preview>.vercel.app EVENT_ID=3 \
 *     k6 run scripts/load_test.k6.js
 *
 * Pass criteria (built-in thresholds — see `options.thresholds`):
 *   - http_req_failed rate < 1%
 *   - http_req_duration p(95) < 500ms
 *
 * If either threshold is breached, the run exits non-zero so CI
 * (or the operator) can react. The smoke is intentionally tiny —
 * 50 VU is the actual meetup head-count, not a stress test.
 */
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 50,
  duration: "60s",
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500"],
  },
};

const BASE_URL = __ENV.BASE_URL;
const EVENT_ID = __ENV.EVENT_ID;

if (!BASE_URL || !EVENT_ID) {
  throw new Error(
    "BASE_URL and EVENT_ID env vars are required. Example: " +
      "BASE_URL=https://preview.vercel.app EVENT_ID=3 k6 run scripts/load_test.k6.js",
  );
}

export default function () {
  const res = http.get(`${BASE_URL}/api/events/${EVENT_ID}/cutoff`);
  check(res, {
    "status is 200": (r) => r.status === 200,
    "has cutoff_at field": (r) => {
      try {
        const body = r.json();
        return body !== null && Object.prototype.hasOwnProperty.call(body, "cutoff_at");
      } catch {
        return false;
      }
    },
  });
  // Match the FE countdown hook's polling cadence (one fetch per
  // mount; the hook does not re-fetch). Sleeping 1s per VU per
  // iteration approximates the steady state when participants are
  // arriving + reloading throughout the session.
  sleep(1);
}
