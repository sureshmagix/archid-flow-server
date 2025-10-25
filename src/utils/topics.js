import { config } from "../config/env.js";

export const topics = {
  telemetry: (deviceId) => `${config.namespace}/devices/${deviceId}/telemetry`,
  command: (deviceId) => `${config.namespace}/devices/${deviceId}/cmd`,
  broadcast: `${config.namespace}/devices/broadcast/cmd`,
};
