// src/utils/enrichResponse.js
import { enrichUserFieldsDeep } from './enrichUser.js';

/**
 * Utility for controllers:
 *   return sendEnriched(res, data);
 *
 * This keeps controllers simple and prevents code duplication.
 */
export async function sendEnriched(res, payload, statusCode = 200) {
  try {
    const enriched = await enrichUserFieldsDeep(payload);
    if (!res.headersSent) {
      res.status(statusCode).json(enriched);
    }
  } catch (err) {
    console.error('[sendEnriched] Failed to enrich response', err);
    // Fallback – DO NOT break existing API
    if (!res.headersSent) {
      res.status(statusCode).json(payload);
    }
  }
}
