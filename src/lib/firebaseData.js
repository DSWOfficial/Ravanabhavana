import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit as limitQuery,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase.js';

const tableConfig = {
  admins: { collection: 'admins', idField: 'email' },
  videos: {
    collection: 'videos',
    fields: {
      youtube_url: 'youtubeUrl',
      video_id: 'videoId',
      thumbnail_url: 'thumbnailUrl',
      video_number: 'videoNumber',
      is_latest: 'isLatest',
      is_active: 'isActive',
      display_order: 'order',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
    },
  },
  sessions: {
    collection: 'sessions',
    fields: {
      zoom_url: 'zoomUrl',
      session_date: 'sessionDate',
      start_time: 'startTime',
      end_time: 'endTime',
      is_active: 'isActive',
      expires_at: 'expiresAt',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
    },
  },
  weekly_schedule: {
    collection: 'weeklySchedule',
    singleton: 'main',
    fields: { start_time: 'startTime', end_time: 'endTime', is_active: 'isActive', updated_at: 'updatedAt' },
  },
  banners: {
    collection: 'banners',
    fields: {
      button_text: 'buttonText',
      button_url: 'buttonUrl',
      start_date: 'startDate',
      end_date: 'endDate',
      is_active: 'isActive',
      created_at: 'createdAt',
      updated_at: 'updatedAt',
    },
  },
  site_settings: {
    collection: 'siteSettings',
    singleton: 'main',
    fields: {
      whatsapp_number: 'whatsappNumber',
      display_whatsapp_number: 'displayWhatsappNumber',
      whatsapp_group_url: 'whatsappGroupUrl',
      youtube_channel_url: 'youtubeChannelUrl',
      facebook_page_url: 'facebookPageUrl',
      phone_number: 'phoneNumber',
      hero_title: 'heroTitle',
      hero_subtitle: 'heroSubtitle',
      hero_description: 'heroDescription',
      zoom_fallback_text: 'zoomFallbackText',
      updated_at: 'updatedAt',
    },
  },
  donation_settings: {
    collection: 'donationSettings',
    singleton: 'main',
    fields: {
      organization_name: 'organizationName',
      account_holder_name: 'accountHolderName',
      bank_name: 'bankName',
      account_number: 'accountNumber',
      updated_at: 'updatedAt',
    },
  },
  donation_submissions: {
    collection: 'donationSubmissions',
    fields: { user_id: 'userId', is_guest: 'isGuest', created_at: 'createdAt' },
  },
  profiles: {
    collection: 'users',
    fields: { full_name: 'displayName', created_at: 'createdAt', last_login_at: 'lastLoginAt' },
  },
  user_video_progress: {
    collection: 'userVideoProgress',
    fields: {
      user_id: 'userId',
      video_id: 'videoDocId',
      watched_at: 'watchedAt',
      completed_at: 'completedAt',
      saved_at: 'savedAt',
      updated_at: 'updatedAt',
    },
  },
  user_session_joins: {
    collection: 'userSessionJoins',
    fields: {
      user_id: 'userId',
      session_id: 'sessionId',
      session_title: 'sessionTitle',
      session_date: 'sessionDate',
      joined_at: 'joinedAt',
    },
  },
};

function toDateString(value) {
  if (!value) return value;
  if (typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return value;
}

function outward(table, data, id) {
  const config = tableConfig[table] || { fields: {} };
  const reverse = Object.fromEntries(Object.entries(config.fields || {}).map(([snake, camel]) => [camel, snake]));
  const output = { id };
  Object.entries(data || {}).forEach(([key, value]) => {
    output[reverse[key] || key] = toDateString(value);
  });
  return output;
}

function inward(table, data) {
  const config = tableConfig[table] || { fields: {} };
  const output = {};
  Object.entries(data || {}).forEach(([key, value]) => {
    if (key === 'id') return;
    output[config.fields?.[key] || key] = value;
  });
  return output;
}

function mapField(table, field) {
  return tableConfig[table]?.fields?.[field] || field;
}

class FirebaseTableQuery {
  constructor(table) {
    this.table = table;
    this.config = tableConfig[table] || { collection: table };
    this.filters = [];
    this.orderField = null;
    this.orderAscending = true;
    this.rowLimit = null;
    this.operation = 'select';
    this.payload = null;
  }

  select() { return this; }
  eq(field, value) { this.filters.push([field, '==', value]); return this; }
  neq(field, value) { this.filters.push([field, '!=', value]); return this; }
  order(field, options = {}) { this.orderField = field; this.orderAscending = options.ascending !== false; return this; }
  limit(count) { this.rowLimit = count; return this; }
  insert(payload) { this.operation = 'insert'; this.payload = payload; return this; }
  update(payload) { this.operation = 'update'; this.payload = payload; return this; }
  upsert(payload) { this.operation = 'upsert'; this.payload = payload; return this; }
  delete() { this.operation = 'delete'; return this; }
  maybeSingle() { return this.execute(true); }
  throwOnError() { return this.execute(false, true); }
  then(resolve, reject) { return this.execute().then(resolve, reject); }

  async execute(single = false, shouldThrow = false) {
    try {
      if (this.operation === 'insert') return await this.runInsert();
      if (this.operation === 'update') return await this.runUpdate();
      if (this.operation === 'upsert') return await this.runUpsert();
      if (this.operation === 'delete') return await this.runDelete();
      return await this.runSelect(single);
    } catch (error) {
      if (shouldThrow) throw error;
      return { data: single ? null : [], error };
    }
  }

  async runSelect(single) {
    if (this.config.singleton) {
      const snap = await getDoc(doc(db, this.config.collection, this.config.singleton));
      const row = snap.exists() ? outward(this.table, snap.data(), snap.id) : null;
      return { data: single ? row : row ? [row] : [], error: null };
    }
    const constraints = this.filters.map(([field, op, value]) => where(mapField(this.table, field), op, value));
    if (this.orderField) constraints.push(orderBy(mapField(this.table, this.orderField), this.orderAscending ? 'asc' : 'desc'));
    if (this.rowLimit) constraints.push(limitQuery(this.rowLimit));
    const snap = await getDocs(query(collection(db, this.config.collection), ...constraints));
    const rows = snap.docs.map((item) => outward(this.table, item.data(), item.id));
    return { data: single ? rows[0] || null : rows, error: null };
  }

  async runInsert() {
    const payload = inward(this.table, this.payload);
    if (!payload.createdAt) payload.createdAt = new Date();
    if (!payload.updatedAt) payload.updatedAt = new Date();
    const id = this.config.idField ? payload[this.config.idField] : null;
    if (id) {
      await setDoc(doc(db, this.config.collection, id), payload, { merge: true });
      return { data: { id, ...this.payload }, error: null };
    }
    const ref = await addDoc(collection(db, this.config.collection), payload);
    return { data: { id: ref.id, ...this.payload }, error: null };
  }

  async matchingRefs() {
    if (this.config.singleton) return [doc(db, this.config.collection, this.config.singleton)];
    if (this.filters.length === 1 && this.filters[0][0] === 'id') return [doc(db, this.config.collection, this.filters[0][2])];
    const constraints = this.filters.map(([field, op, value]) => where(mapField(this.table, field), op, value));
    const snap = await getDocs(query(collection(db, this.config.collection), ...constraints));
    return snap.docs.map((item) => item.ref);
  }

  async runUpdate() {
    const refs = await this.matchingRefs();
    const payload = inward(this.table, this.payload);
    await Promise.all(refs.map((ref) => updateDoc(ref, payload)));
    return { data: null, error: null };
  }

  async runUpsert() {
    const payload = inward(this.table, this.payload);
    const ref = this.config.singleton
      ? doc(db, this.config.collection, this.config.singleton)
      : doc(db, this.config.collection, this.payload.id && this.payload.id !== 1 ? this.payload.id : crypto.randomUUID());
    await setDoc(ref, payload, { merge: true });
    return { data: { id: ref.id, ...this.payload }, error: null };
  }

  async runDelete() {
    const refs = await this.matchingRefs();
    await Promise.all(refs.map((ref) => deleteDoc(ref)));
    return { data: null, error: null };
  }
}

export const firebaseData = {
  from(table) {
    return new FirebaseTableQuery(table);
  },
};
