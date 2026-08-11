const fs = require("node:fs");
const path = require("node:path");
const { validateTelemetry } = require("./telemetry");

const publicDirectory = path.join(__dirname, "public");
const contentTypes = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };

const sendJson = (response, status, value) => {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(value));
};

const readJson = (request, limit = 16_384) => new Promise((resolve, reject) => {
  let body = "";
  request.setEncoding("utf8");
  request.on("data", (chunk) => {
    body += chunk;
    if (body.length > limit) reject(Object.assign(new Error("Request body is too large"), { status: 413 }));
  });
  request.on("end", () => {
    try { resolve(JSON.parse(body)); } catch { reject(Object.assign(new Error("Request body must contain valid JSON"), { status: 400 })); }
  });
  request.on("error", reject);
});

const createApp = ({ logPath = path.join(__dirname, "..", "data", "telemetry.ndjson") } = {}) => {
  let latestTelemetry = null;
  return async (request, response) => {
    try {
      const url = new URL(request.url, "http://localhost");
      if (request.method === "GET" && url.pathname === "/api/health") return sendJson(response, 200, { status: "ok" });
      if (request.method === "GET" && url.pathname === "/api/telemetry/latest") return sendJson(response, 200, { telemetry: latestTelemetry });
      if (request.method === "POST" && url.pathname === "/api/telemetry") {
        const validation = validateTelemetry(await readJson(request));
        if (validation.error) return sendJson(response, 400, { error: validation.error });
        latestTelemetry = validation.value;
        await fs.promises.mkdir(path.dirname(logPath), { recursive: true });
        await fs.promises.appendFile(logPath, `${JSON.stringify(latestTelemetry)}\n`, "utf8");
        return sendJson(response, 202, { telemetry: latestTelemetry });
      }

      const requestedPath = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      const filePath = path.resolve(publicDirectory, requestedPath);
      if (!filePath.startsWith(`${publicDirectory}${path.sep}`) && filePath !== path.join(publicDirectory, "index.html")) return sendJson(response, 404, { error: "Not found" });
      try {
        const file = await fs.promises.readFile(filePath);
        response.writeHead(200, { "Content-Type": contentTypes[path.extname(filePath)] || "application/octet-stream" });
        return response.end(file);
      } catch (error) {
        if (error.code === "ENOENT") return sendJson(response, 404, { error: "Not found" });
        throw error;
      }
    } catch (error) {
      return sendJson(response, error.status || 500, { error: error.status ? error.message : "Internal server error" });
    }
  };
};

module.exports = { createApp };
