const endpoint = process.env.TELEMETRY_URL || "http://localhost:3000/api/telemetry";
const sample = {
  latitude: 32.8801 + (Math.random() - 0.5) * 0.01,
  longitude: -117.2340 + (Math.random() - 0.5) * 0.01,
  temperatureC: 31.4,
  humidityPercent: 28.2,
  pressureHpa: 1011.8,
  objectTemperatureC: 46.7,
  ambientTemperatureC: 31.1
};

fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sample) })
  .then(async (response) => {
    console.log(response.status, await response.text());
    if (!response.ok) process.exitCode = 1;
  })
  .catch((error) => { console.error(error.message); process.exitCode = 1; });
