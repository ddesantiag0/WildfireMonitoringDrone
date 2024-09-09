#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>  // BME280 sensor
#include <Adafruit_MLX90614.h>  // MLX90614 IR temperature sensor
#include <TinyGPS++.h>  // GPS sensor
#include <SoftwareSerial.h>
#include <ESP8266WiFi.h>

// Sensor objects
Adafruit_BME280 bme;  // BME280 object
Adafruit_MLX90614 mlx = Adafruit_MLX90614();  // MLX90614 object
TinyGPSPlus gps;  // GPS object
SoftwareSerial gpsSerial(4, 3);  // GPS Serial (RX, TX)
SoftwareSerial esp8266(8, 9);  // ESP8266 Serial (RX, TX)

// WiFi credentials
const char* ssid = "your_SSID";  // Replace with your public Wi-Fi or personal hotspot SSID
const char* password = "";  // If public Wi-Fi doesn't have a password, leave this empty

void setup() {
  Serial.begin(115200);
  esp8266.begin(9600);
  gpsSerial.begin(9600);  // Start GPS module communication

  // Connect to Wi-Fi
  esp8266.println("AT+RST");  // Reset ESP8266
  delay(2000);
  esp8266.println("AT+CWMODE=1");  // Set Wi-Fi mode to station (client mode)
  delay(1000);

  // Connect to Wi-Fi
  if (password[0] == '\0') {
    // If there's no password, use this format
    esp8266.print("AT+CWJAP=\"");
    esp8266.print(ssid);
    esp8266.println("\"");
  } else {
    // If there is a password, use this format
    esp8266.print("AT+CWJAP=\"");
    esp8266.print(ssid);
    esp8266.print("\",\"");
    esp8266.print(password);
    esp8266.println("\"");
  }

  delay(5000);  // Wait for connection

  // Initialize BME280
  if (!bme.begin(0x76)) {
    Serial.println("Could not find a valid BME280 sensor, check wiring!");
    while (1);
  }

  // Initialize MLX90614
  mlx.begin();
}

void loop() {
  // Collect sensor data
  float temperature = bme.readTemperature();
  float humidity = bme.readHumidity();
  float pressure = bme.readPressure() / 100.0F;  // Pressure in hPa
  float objectTemp = mlx.readObjectTempC();
  float ambientTemp = mlx.readAmbientTempC();

  // GPS data
  if (gpsSerial.available()) {
    gps.encode(gpsSerial.read());
  }

  if (gps.location.isUpdated()) {
    String sensorData = "latitude=" + String(gps.location.lat(), 6) +
                        "&longitude=" + String(gps.location.lng(), 6) +
                        "&temp=" + String(temperature, 2) +
                        "&humidity=" + String(humidity, 2) +
                        "&pressure=" + String(pressure, 2) +
                        "&objectTemp=" + String(objectTemp, 2) +
                        "&ambientTemp=" + String(ambientTemp, 2);

    // Send the data to the server
    sendDataToServer(sensorData);
  }

  delay(5000);  // Send data every 5 seconds
}

void sendDataToServer(String data) {
  esp8266.print("AT+CIPSTART=\"TCP\",\"your_server_IP\",3000\r\n");  // Replace with your server's IP
  delay(2000);
  esp8266.print("AT+CIPSEND=");
  esp8266.println(data.length());
  delay(100);
  esp8266.println(data);
  delay(500);
  esp8266.println("AT+CIPCLOSE");
}
