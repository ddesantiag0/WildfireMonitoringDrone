#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Adafruit_MLX90614.h>
#include <TinyGPS++.h>
#include <SoftwareSerial.h>
#include "config.h"

Adafruit_BME280 bme;
Adafruit_MLX90614 mlx;
TinyGPSPlus gps;
SoftwareSerial gpsSerial(4, 3);
SoftwareSerial espSerial(8, 9);

bool waitForResponse(const char* expected, unsigned long timeoutMs) {
  String response;
  const unsigned long startedAt = millis();
  while (millis() - startedAt < timeoutMs) {
    while (espSerial.available()) {
      response += static_cast<char>(espSerial.read());
      if (response.indexOf(expected) >= 0) return true;
      if (response.indexOf("ERROR") >= 0 || response.indexOf("FAIL") >= 0) return false;
    }
  }
  return false;
}

bool sendCommand(const String& command, const char* expected, unsigned long timeoutMs) {
  espSerial.listen();
  while (espSerial.available()) espSerial.read();
  espSerial.println(command);
  return waitForResponse(expected, timeoutMs);
}

bool connectWifi() {
  if (!sendCommand("AT", "OK", 2000)) return false;
  if (!sendCommand("AT+CWMODE=1", "OK", 3000)) return false;
  const String join = String("AT+CWJAP=\"") + WIFI_SSID + "\",\"" + WIFI_PASSWORD + "\"";
  return sendCommand(join, "OK", 20000);
}

bool postTelemetry(const String& json) {
  const String start = String("AT+CIPSTART=\"TCP\",\"") + GROUND_STATION_HOST + "\"," + GROUND_STATION_PORT;
  if (!sendCommand(start, "OK", 8000) && !waitForResponse("ALREADY CONNECTED", 1000)) return false;

  const String request = String("POST /api/telemetry HTTP/1.1\r\nHost: ") + GROUND_STATION_HOST +
    "\r\nContent-Type: application/json\r\nConnection: close\r\nContent-Length: " + json.length() +
    "\r\n\r\n" + json;
  if (!sendCommand(String("AT+CIPSEND=") + request.length(), ">", 4000)) return false;
  espSerial.print(request);
  const bool sent = waitForResponse("SEND OK", 8000);
  sendCommand("AT+CIPCLOSE", "OK", 2000);
  return sent;
}

void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600);
  espSerial.begin(9600);

  if (!bme.begin(0x76)) {
    Serial.println("BME280 not found; check wiring and I2C address.");
    while (true) delay(1000);
  }
  if (!mlx.begin()) {
    Serial.println("MLX90614 not found; check wiring.");
    while (true) delay(1000);
  }
  if (!connectWifi()) Serial.println("Wi-Fi connection failed; telemetry will retry on the next reading.");
}

void loop() {
  gpsSerial.listen();
  const unsigned long gpsWindowStartedAt = millis();
  while (millis() - gpsWindowStartedAt < 1000) {
    while (gpsSerial.available()) gps.encode(gpsSerial.read());
  }

  if (!gps.location.isValid() || !gps.location.isUpdated()) return;

  const String json = String("{\"latitude\":") + String(gps.location.lat(), 6) +
    ",\"longitude\":" + String(gps.location.lng(), 6) +
    ",\"temperatureC\":" + String(bme.readTemperature(), 2) +
    ",\"humidityPercent\":" + String(bme.readHumidity(), 2) +
    ",\"pressureHpa\":" + String(bme.readPressure() / 100.0F, 2) +
    ",\"objectTemperatureC\":" + String(mlx.readObjectTempC(), 2) +
    ",\"ambientTemperatureC\":" + String(mlx.readAmbientTempC(), 2) + "}";

  if (!postTelemetry(json)) {
    Serial.println("Telemetry upload failed; reconnecting Wi-Fi.");
    connectWifi();
  } else {
    Serial.println("Telemetry uploaded.");
  }
  delay(4000);
}
