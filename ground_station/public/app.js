const map = L.map("map").setView([37.5, -120], 5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap contributors", maxZoom: 19 }).addTo(map);
let marker;

const setText = (id, value) => { document.getElementById(id).textContent = value; };
const refresh = async () => {
  try {
    const response = await fetch("/api/telemetry/latest", { cache: "no-store" });
    if (!response.ok) throw new Error("Ground station unavailable");
    const { telemetry } = await response.json();
    if (!telemetry) return;
    setText("temperature", `${telemetry.temperatureC.toFixed(1)} °C`);
    setText("object-temperature", `${telemetry.objectTemperatureC.toFixed(1)} °C`);
    setText("humidity", `${telemetry.humidityPercent.toFixed(1)}%`);
    setText("pressure", `${telemetry.pressureHpa.toFixed(1)} hPa`);
    setText("status", `Updated ${new Date(telemetry.receivedAt).toLocaleTimeString()}`);
    const position = [telemetry.latitude, telemetry.longitude];
    marker = marker ? marker.setLatLng(position) : L.marker(position).addTo(map);
    map.setView(position, 14);
  } catch { setText("status", "Connection unavailable"); }
};

refresh();
setInterval(refresh, 3000);
