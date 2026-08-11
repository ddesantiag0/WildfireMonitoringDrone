const { test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { createApp } = require("../ground_station/app");

const withServer = async (callback) => {
  const logPath = path.join(os.tmpdir(), `wildfire-telemetry-${Date.now()}-${Math.random()}.ndjson`);
  const server = http.createServer(createApp({ logPath }));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try { await callback(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise((resolve) => server.close(resolve)); }
};

test("health endpoint responds", () => withServer(async (baseUrl) => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
}));

test("valid telemetry is accepted and returned", () => withServer(async (baseUrl) => {
  const telemetry = { latitude: 32.88, longitude: -117.23, temperatureC: 32, humidityPercent: 25, pressureHpa: 1012, objectTemperatureC: 48, ambientTemperatureC: 31 };
  assert.equal((await fetch(`${baseUrl}/api/telemetry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(telemetry) })).status, 202);
  const latest = await (await fetch(`${baseUrl}/api/telemetry/latest`)).json();
  assert.equal(latest.telemetry.latitude, telemetry.latitude);
  assert.ok(latest.telemetry.receivedAt);
}));

test("out-of-range telemetry is rejected", () => withServer(async (baseUrl) => {
  const response = await fetch(`${baseUrl}/api/telemetry`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude: 100 }) });
  assert.equal(response.status, 400);
}));
