# Wildfire Monitoring Drone Communication

## Overview
This repository focuses on establishing reliable communication between a wildfire monitoring drone and a ground station. Using the **ESP8266 Wi-Fi Shield**, the drone transmits real-time environmental data such as GPS coordinates, temperature, and wind speed to a remote ground station for monitoring and analysis.

## Components
- **Arduino UNO/MEGA**: The brain of the drone, collecting sensor data.
- **ESP8266 Wi-Fi Shield**: Facilitates wireless communication between the drone and ground station.
- **Custom Sensors**: GPS, temperature, humidity, and wind sensors.
- **Ground Station**: A server (using Node.js) receives, processes, and displays the data on an interactive map using Leaflet.js or Folium (Python).

## Features
- **Real-Time Data Transmission**: Sends sensor data from the drone to the ground station using Wi-Fi.
- **Interactive Map**: Displays drone position and environmental readings.
- **Data Logging**: Logs environmental data for analysis and future reference.
- **Node.js Server**: Handles communication and data storage.

## How to Set Up
### Hardware Setup
1. **Connect the ESP8266 Wi-Fi Shield** to the Arduino board.
2. **Wire the sensors** (GPS, temperature, wind) to the Arduino.
3. **Power the system** using a suitable battery pack.

### Software Setup
1. Install **Arduino IDE** and **VS Code** with the Arduino extension.
2. Install the required Arduino libraries: `ESP8266WiFi`, `TinyGPS++`, `Adafruit_Sensor`.
3. Upload the code from this repository to the Arduino.

### Ground Station Setup
1. Install **Node.js** and run `npm install` to install dependencies.
2. Start the server by running `node app.js`.
3. Open the browser and navigate to `localhost:3000` to see the map.

## How to Run
1. Power on the drone. It will automatically connect to the ground station’s Wi-Fi.
2. Open the ground station map to view real-time data.
3. View sensor data and drone position on the interactive map.

## Future Enhancements
- Implement more accurate GPS tracking.
- Integrate additional sensors for wildfire risk assessment.
