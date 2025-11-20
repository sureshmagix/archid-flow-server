// src/utils/enrichUser.js
import User from '../models/User.js';

/**
 * Fields that should be enriched from "<id>" → { userId, name }
 */
export const USER_ID_FIELDS = new Set([
  'lastChangedBy',
  'requestedBy',
  'changedBy',
  'updatedBy',
]);

/**
 * Safely enrich a single userId into { userId, name }.
 * Never throws – always returns something usable.
 */
export async function enrichUser(userId) {
  const id = userId ? String(userId) : null;

  if (!id) {
    return { userId: null, name: 'Unknown' };
  }

  try {
    const user = await User.findById(id).select('name').lean().exec();

    if (!user) {
      return { userId: id, name: 'Unknown' };
    }

    return { userId: id, name: user.name || 'Unknown' };
  } catch (err) {
    console.error('[enrichUser] Failed to load user', { userId: id, err });
    return { userId: id, name: 'Unknown' };
  }
}

/**
 * Is this already in enriched shape?
 */
function isEnrichedUserObject(value) {
  return (
    value &&
    typeof value === 'object' &&
    'userId' in value &&
    typeof value.userId !== 'undefined'
  );
}

/**
 * Internal helper to normalise a *single* field value which is supposed
 * to represent a user.
 *
 * – If it’s already { userId, name }, it’s left as-is (but we can fill missing name).
 * – If it’s a string/ObjectId, we enrich it.
 * – If it’s null/undefined, returns null.
 */
async function normaliseUserField(raw, cache) {
  if (raw == null) return null;

  // Already enriched object
  if (isEnrichedUserObject(raw)) {
    // If name is missing/empty, try to fill it
    if (!raw.name) {
      const enriched = await getCachedEnrichedUser(raw.userId, cache);
      return { userId: enriched.userId, name: enriched.name };
    }
    return raw;
  }

  // Else: treat as a plain user id
  return getCachedEnrichedUser(raw, cache);
}

/**
 * Simple per-call memoization
 */
async function getCachedEnrichedUser(userId, cache) {
  const id = userId ? String(userId) : null;
  if (!id) return { userId: null, name: 'Unknown' };

  if (cache.has(id)) return cache.get(id);

  const enriched = await enrichUser(id);
  cache.set(id, enriched);
  return enriched;
}

/**
 * Deeply walk an object/array and enrich all known user-id fields.
 *
 * This is *pure* – it returns a new structure and does not mutate
 * the original input.
 */
export async function enrichUserFieldsDeep(value, cache = new Map()) {
  // Arrays
  if (Array.isArray(value)) {
    const out = [];
    for (const item of value) {
      out.push(await enrichUserFieldsDeep(item, cache));
    }
    return out;
  }

  // Non-object primitives
  if (!value || typeof value !== 'object') {
    return value;
  }

  // Plain object (including Mongoose docs converted via toObject)
  const out = Array.isArray(value) ? [] : {};
  for (const [key, val] of Object.entries(value)) {
    if (USER_ID_FIELDS.has(key)) {
      out[key] = await normaliseUserField(val, cache);
    } else {
      out[key] = await enrichUserFieldsDeep(val, cache);
    }
  }

  return out;
}
