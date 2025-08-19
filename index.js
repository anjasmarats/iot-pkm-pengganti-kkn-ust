// File: backend/server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

const MQTT_BROKER = 'mqtt://localhost:1883';
const MQTT_TOPIC_DATA = 'sensor/data';
const MQTT_TOPIC_CONTROL = 'sensor/control';

const mqttClient = mqtt.connect(MQTT_BROKER);

// MQTT: terhubung ke broker
mqttClient.on('connect', () => {
  console.log('[MQTT] Connected');
  mqttClient.subscribe(MQTT_TOPIC_DATA);
});

// MQTT: menerima data dari perangkat IoT
mqttClient.on('message', (topic, message) => {
  if (topic === MQTT_TOPIC_DATA) {
    const data = message.toString();
    console.log('[MQTT] Data:', data);
    io.emit('sensor_data', JSON.parse(data)); // broadcast ke semua client
  }
});

// WebSocket: client Flutter connect
io.on('connection', (socket) => {
  console.log('[WebSocket] Flutter connected');

  // Flutter kirim perintah
  socket.on('control_command', (cmd) => {
    console.log('[WS] Command from Flutter:', cmd);
    mqttClient.publish(MQTT_TOPIC_CONTROL, JSON.stringify(cmd));
  });

  socket.on('disconnect', () => {
    console.log('[WebSocket] Flutter disconnected');
  });
});

server.listen(3000, () => {
  console.log('[Express] Server running on port 3000');
});
