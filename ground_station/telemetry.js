const FIELDS = ["latitude", "longitude", "temperatureC", "humidityPercent", "pressureHpa", "objectTemperatureC", "ambientTemperatureC"];

const validateTelemetry = (input) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) return { error: "Telemetry body must be a JSON object" };
  const telemetry = {};
  for (const field of FIELDS) {
    const value = Number(input[field]);
    if (!Number.isFinite(value)) return { error: `${field} must be a finite number` };
    telemetry[field] = value;
  }
  if (telemetry.latitude < -90 || telemetry.latitude > 90) return { error: "latitude must be between -90 and 90" };
  if (telemetry.longitude < -180 || telemetry.longitude > 180) return { error: "longitude must be between -180 and 180" };
  if (telemetry.humidityPercent < 0 || telemetry.humidityPercent > 100) return { error: "humidityPercent must be between 0 and 100" };
  return { value: { ...telemetry, receivedAt: new Date().toISOString() } };
};

module.exports = { validateTelemetry };
