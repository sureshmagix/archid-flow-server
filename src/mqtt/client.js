import mqtt from "mqtt";
import { config } from "../config/env.js";
import { topics } from "../utils/topics.js";
import Device from "../models/Device.js";
import Telemetry from "../models/Telemetry.js";

let client;

export function getMqttClient() {
  if (client) return client;

  client = mqtt.connect(config.mqttUrl, {
    reconnectPeriod: 3000,
    clean: true,
    clientId: `archidflow_api_${Math.random().toString(16).slice(2)}`,
  });

  client.on("connect", () => {
    console.log(`✅ MQTT connected: ${config.mqttUrl}`);
    const sub = `${config.namespace}/devices/+/telemetry`;
    client.subscribe(sub, (err) => {
      if (err) console.error("MQTT subscribe error:", err.message);
      else console.log("📡 Subscribed:", sub);
    });
  });

  client.on("message", async (topic, payloadBuf) => {
    try {
      const payload = JSON.parse(payloadBuf.toString());
      const parts = topic.split("/");
      const deviceId = parts[2];
      await Telemetry.create({ deviceId, payload });
      await Device.updateOne(
        { deviceId },
        { $set: { status: "online", lastSeenAt: new Date() } }
      );
    } catch (err) {
      console.error("MQTT message error:", err.message);
    }
  });

  client.on("error", (err) => console.error("MQTT error:", err.message));
  client.on("close", () => console.warn("MQTT connection closed"));

  return client;
}

export function publishToDevice(deviceId, messageObj) {
  const c = getMqttClient();
  const t = topics.command(deviceId);
  c.publish(t, JSON.stringify(messageObj), { qos: 0 });
}
