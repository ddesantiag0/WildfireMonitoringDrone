# Wildfire Monitoring Drone Telemetry Prototype

An end-to-end prototype for collecting environmental and GPS readings on an Arduino-class controller, forwarding them through an ESP8266 AT-command module, and displaying the latest reading at a local ground station.

This repository demonstrates the telemetry path; it is not a flight controller, certified fire-detection system, or emergency-response tool. The firmware has not been validated on the author's original hardware configuration.

## Implemented scope

- Arduino firmware for BME280, MLX90614, and TinyGPS++-compatible GPS readings
- JSON telemetry delivery as a valid HTTP request through an ESP8266 AT interface
- Dependency-free Node.js ground-station server
- Payload validation, latest-reading endpoint, and newline-delimited JSON logging
- Responsive Leaflet/OpenStreetMap dashboard
- Telemetry simulator for development without hardware
- Automated ground-station API tests

Wind sensing, drone flight control, remote deployment, historical charts, alerting, authentication, and TLS are not implemented.

## Architecture

```text
BME280 + MLX90614 + GPS
          │
          ▼
 Arduino firmware ── ESP8266 / HTTP POST ──► Ground-station API
                                                   ├─ telemetry.ndjson log
                                                   └─ browser map dashboard
```

## Run the ground station

Requires Node.js 18 or newer. There are no runtime packages to install.

```bash
npm start
```

Open `http://localhost:3000`. In a second terminal, submit a sample reading:

```bash
npm run simulate
```

Run the tests with `npm test`.

## Telemetry API

`POST /api/telemetry` accepts:

```json
{
  "latitude": 32.8801,
  "longitude": -117.234,
  "temperatureC": 31.4,
  "humidityPercent": 28.2,
  "pressureHpa": 1011.8,
  "objectTemperatureC": 46.7,
  "ambientTemperatureC": 31.1
}
```

`GET /api/telemetry/latest` returns the most recently accepted reading. Accepted readings are appended to `data/telemetry.ndjson`, which is intentionally ignored by Git.

## Firmware setup

1. Install `Adafruit BME280`, `Adafruit MLX90614`, `TinyGPSPlus`, and their dependencies in the Arduino IDE.
2. Copy `arduino_code/config.example.h` to `arduino_code/config.h`.
3. Set the Wi-Fi credentials and the ground station's LAN IP address in `config.h`.
4. Confirm the I2C address and serial pins match the actual hardware.
5. Open `arduino_code/drone_comm.ino`, select the target Arduino board, compile, and upload.

`config.h` is ignored so network credentials are not committed. An Arduino Uno has limited memory and only one software serial receiver can listen at a time; the sketch explicitly switches between GPS and ESP8266 communication. Hardware behavior, power stability, module firmware compatibility, and radio range must be tested on the actual assembly.

## Responsible use

Do not use this prototype for wildfire detection, emergency decisions, navigation, or autonomous flight. Any real deployment requires calibrated sensors, authenticated and encrypted transport, resilient storage, health monitoring, regulatory review, and extensive field testing.
