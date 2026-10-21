/**
 * Host half of dsh-ui-scale.
 *
 * The browser half owns the sidebar action and the stylesheet. This half owns
 * one thing the browser cannot: a durable preference file in the Harness home,
 * served over a loopback-only route. The desktop page's origin can change
 * between launches, so localStorage is only a fast cache; this file is the
 * authority that makes the chosen scale survive a restart.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/** Loader identity. */
export const name = "dsh-ui-scale";

/** Required host services. */
export const inject = ["webServer"];

/** Same-origin route the browser half calls. */
const ROUTE = "/ui-scale/api";

/** The only factors the UI offers. */
const LEVELS = [1, 1.25, 1.5, 1.75, 2];

/** Upper bound for the tiny JSON body. */
const MAX_BODY_BYTES = 4096;

/** Loopback hostnames accepted in the Host header. */
const LOOPBACK_HOSTNAMES = new Set(["127.0.0.1", "localhost", "::1"]);

/** Harness home: the desktop process exports DSH_HOME; fall back to ~/.dsh. */
function harnessHome() {
  const configured = process.env.DSH_HOME;
  return configured !== undefined && configured.trim() !== "" ? configured : join(homedir(), ".dsh");
}

/** Absolute path of the preference file. */
function preferencePath() {
  return join(harnessHome(), "ui-scale.json");
}

/** Read the persisted factor, defaulting to native size on any failure. */
function readPreference() {
  try {
    const parsed = JSON.parse(readFileSync(preferencePath(), "utf8"));
    const scale = Number(parsed?.scale);
    return LEVELS.includes(scale) ? scale : 1;
  } catch {
    return 1;
  }
}

/** Persist the factor atomically so a crash cannot leave half a JSON file. */
function writePreference(scale) {
  const directory = harnessHome();
  mkdirSync(directory, { recursive: true });
  const target = preferencePath();
  const temporary = `${target}.${String(process.pid)}.tmp`;
  writeFileSync(temporary, `${JSON.stringify({ scale })}\n`, "utf8");
  renameSync(temporary, target);
}

/** True for loopback peer addresses. */
function isLoopback(address) {
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1";
}

/** Hostname part of a Host header, without the port or IPv6 brackets. */
function hostNameOf(host) {
  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    return end >= 0 ? host.slice(1, end) : host;
  }
  return host.split(":")[0] ?? "";
}

/** True when the request's Host header names a loopback host. */
function isLoopbackHost(host) {
  return host !== undefined && LOOPBACK_HOSTNAMES.has(hostNameOf(host).toLowerCase());
}

/** Write one JSON envelope. */
function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
  });
  res.end(JSON.stringify(body));
}

/** Collect and parse a bounded JSON object body. */
async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > MAX_BODY_BYTES) throw new Error("request body is too large");
    chunks.push(buffer);
  }
  const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("request body must be a JSON object");
  }
  return parsed;
}

/**
 * Register the loopback-only preference route.
 * @param ctx - host plugin context; `webServer` is injected.
 */
export function apply(ctx) {
  const webServer = ctx.get("webServer");
  ctx.effect(
    () =>
      webServer.register({
        kind: "exact",
        path: ROUTE,
        handler: async (req, res) => {
          if (!isLoopback(req.socket.remoteAddress) || !isLoopbackHost(req.headers.host)) {
            json(res, 403, { ok: false, error: "loopback-only" });
            return;
          }
          if (req.method === "GET") {
            json(res, 200, { ok: true, value: { scale: readPreference() } });
            return;
          }
          if (req.method !== "POST") {
            json(res, 405, { ok: false, error: "method not allowed" });
            return;
          }
          let body;
          try {
            body = await readBody(req);
          } catch (error) {
            json(res, 400, {
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            });
            return;
          }
          const scale = Number(body.scale);
          if (!LEVELS.includes(scale)) {
            json(res, 400, { ok: false, error: "invalid scale" });
            return;
          }
          try {
            writePreference(scale);
            json(res, 200, { ok: true, value: { scale } });
          } catch (error) {
            json(res, 500, {
              ok: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        },
      }),
    "ui-scale: preference route",
  );
}
