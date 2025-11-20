// ==============================================
// 🔹 MQTT Enriched Publisher — Central Wrapper
// ==============================================

import { enrichUserFieldsDeep } from "../utils/enrichUser.js";
import { getMqttClient } from "./client.js";

/**
 * Publish a message to MQTT with user-enriched data.
 *
 * This ensures fields like:
 *   lastChangedBy, requestedBy, changedBy, updatedBy
 * become:
 *   { userId, name }
 */
export async function publishEnriched(topic, payload, options = {}) {
    const client = getMqttClient();

    try {
        // 🔥 Enrich nested user-related fields
        const enriched = await enrichUserFieldsDeep(payload);

        const message =
            typeof enriched === "string" ? enriched : JSON.stringify(enriched);

        client.publish(topic, message, options);

        console.log(`📤 MQTT → ${topic}`, message);
    } catch (err) {
        console.error("[publishEnriched] Failed enrichment:", err);

        // Fallback: publish raw payload (never break IoT device)
        const fallback =
            typeof payload === "string" ? payload : JSON.stringify(payload);

        client.publish(topic, fallback, options);
    }
}
