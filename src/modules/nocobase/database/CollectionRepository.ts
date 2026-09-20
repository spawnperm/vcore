import { Collection, CollectionField, CollectionRecord, CollectionQueryParams } from './types';
import { INITIAL_COLLECTIONS, INITIAL_RECORDS } from './seedCollections';
import { nats } from '../../../services/nats/natsService';

const STORAGE_KEY_COLLECTIONS = 'mirovizor_custom_collections_v1';
const STORAGE_KEY_RECORDS = 'mirovizor_custom_records_v1';

export class CollectionRepository {
  private collections: Map<string, Collection> = new Map();
  private records: Map<string, CollectionRecord[]> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
  }

  // --- PERSISTENCE & INIT ---

  private loadState(): void {
    let loadedCols: Collection[] | null = null;
    let loadedRecs: Record<string, CollectionRecord[]> | null = null;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedCols = localStorage.getItem(STORAGE_KEY_COLLECTIONS);
        if (storedCols) loadedCols = JSON.parse(storedCols);

        const storedRecs = localStorage.getItem(STORAGE_KEY_RECORDS);
        if (storedRecs) loadedRecs = JSON.parse(storedRecs);
      }
    } catch (e) {
      console.warn('[CollectionRepository] Failed to read from localStorage:', e);
    }

    // Initialize collections
    const collectionsToUse = loadedCols && loadedCols.length > 0 ? loadedCols : INITIAL_COLLECTIONS;
    collectionsToUse.forEach((c) => this.collections.set(c.name, c));

    // Initialize records
    if (loadedRecs && Object.keys(loadedRecs).length > 0) {
      Object.entries(loadedRecs).forEach(([colName, recs]) => {
        this.records.set(colName, recs);
      });
    } else {
      Object.entries(INITIAL_RECORDS).forEach(([colName, recs]) => {
        this.records.set(colName, recs);
      });
    }

    // Mirror to NATS KV Store
    this.syncToNatsKv();
  }

  private saveState(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const colsArray = Array.from(this.collections.values());
        localStorage.setItem(STORAGE_KEY_COLLECTIONS, JSON.stringify(colsArray));

        const recsObj: Record<string, CollectionRecord[]> = {};
        this.records.forEach((recs, name) => {
          recsObj[name] = recs;
        });
        localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(recsObj));
      }
    } catch (e) {
      console.warn('[CollectionRepository] Failed to save to localStorage:', e);
    }

    this.notifyListeners();
  }

  private syncToNatsKv(): void {
    try {
      this.collections.forEach((col) => {
        nats.kvPut('portal_schemas', `schema.${col.name}`, {
          name: col.name,
          title: col.title,
          fieldsCount: col.fields.length,
          updatedAt: col.updatedAt,
        });
      });
    } catch {
      // safe fallback
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => l());
  }

  // --- COLLECTION (SCHEMA) MANAGEMENT ---

  public getCollections(): Collection[] {
    return Array.from(this.collections.values());
  }

  public getCollection(name: string): Collection | undefined {
    return this.collections.get(name);
  }

  public createCollection(data: Omit<Collection, 'createdAt' | 'updatedAt'>): Collection {
    const now = new Date().toISOString();
    const newCollection: Collection = {
      ...data,
      name: data.name.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_'),
      createdAt: now,
      updatedAt: now,
      fields: [
        { name: 'id', title: 'ID', type: 'string', isSystem: true },
        ...data.fields.filter((f) => f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt'),
        { name: 'createdAt', title: 'Дата создания', type: 'datetime', isSystem: true },
        { name: 'updatedAt', title: 'Дата обновления', type: 'datetime', isSystem: true },
      ],
    };

    this.collections.set(newCollection.name, newCollection);
    this.records.set(newCollection.name, []);
    this.saveState();

    // Broadcast over NATS JetStream
    nats.publish('schema.v1.collection.created', {
      collection: newCollection.name,
      title: newCollection.title,
      fieldsCount: newCollection.fields.length,
      timestamp: now,
    });
    nats.kvPut('portal_schemas', `schema.${newCollection.name}`, newCollection);

    return newCollection;
  }

  public updateCollection(name: string, patch: Partial<Omit<Collection, 'name' | 'createdAt'>>): Collection {
    const existing = this.collections.get(name);
    if (!existing) {
      throw new Error(`Collection "${name}" not found`);
    }

    const now = new Date().toISOString();
    const updated: Collection = {
      ...existing,
      ...patch,
      updatedAt: now,
    };

    this.collections.set(name, updated);
    this.saveState();

    nats.publish('schema.v1.collection.updated', {
      collection: name,
      title: updated.title,
      timestamp: now,
    });
    nats.kvPut('portal_schemas', `schema.${name}`, updated);

    return updated;
  }

  public deleteCollection(name: string): boolean {
    const deleted = this.collections.delete(name);
    if (deleted) {
      this.records.delete(name);
      this.saveState();

      nats.publish('schema.v1.collection.deleted', {
        collection: name,
        timestamp: new Date().toISOString(),
      });
    }
    return deleted;
  }

  public addField(collectionName: string, field: CollectionField): Collection {
    const col = this.collections.get(collectionName);
    if (!col) throw new Error(`Collection "${collectionName}" not found`);

    if (col.fields.some((f) => f.name === field.name)) {
      throw new Error(`Field "${field.name}" already exists in collection "${collectionName}"`);
    }

    const updatedFields = [...col.fields, field];
    return this.updateCollection(collectionName, { fields: updatedFields });
  }

  public removeField(collectionName: string, fieldName: string): Collection {
    const col = this.collections.get(collectionName);
    if (!col) throw new Error(`Collection "${collectionName}" not found`);

    const updatedFields = col.fields.filter((f) => f.name !== fieldName);
    return this.updateCollection(collectionName, { fields: updatedFields });
  }

  // --- RECORD (DATA) CRUD OPERATIONS ---

  public getRecords(collectionName: string, params: CollectionQueryParams = {}): {
    records: CollectionRecord[];
    total: number;
  } {
    const all = this.records.get(collectionName) || [];
    let filtered = [...all];

    // Search filter across text fields
    if (params.search && params.search.trim()) {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter((rec) => {
        return Object.values(rec).some((val) => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(q);
        });
      });
    }

    // Specific field filter
    if (params.filterField && params.filterValue !== undefined && params.filterValue !== 'ALL') {
      filtered = filtered.filter((rec) => rec[params.filterField!] === params.filterValue);
    }

    // Sorting
    if (params.sortField) {
      const field = params.sortField;
      const order = params.sortOrder === 'desc' ? -1 : 1;
      filtered.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        return valA > valB ? order : -order;
      });
    }

    const total = filtered.length;

    // Pagination
    if (params.page && params.pageSize) {
      const start = (params.page - 1) * params.pageSize;
      filtered = filtered.slice(start, start + params.pageSize);
    }

    return { records: filtered, total };
  }

  public getRecord(collectionName: string, id: string): CollectionRecord | undefined {
    const list = this.records.get(collectionName) || [];
    return list.find((r) => r.id === id);
  }

  public createRecord(collectionName: string, data: Record<string, any>): CollectionRecord {
    const col = this.collections.get(collectionName);
    if (!col) throw new Error(`Collection "${collectionName}" not found`);

    const now = new Date().toISOString();
    const id = data.id || `rec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    const newRecord: CollectionRecord = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const currentRecords = this.records.get(collectionName) || [];
    this.records.set(collectionName, [newRecord, ...currentRecords]);
    this.saveState();

    // Broadcast Record Event to NATS JetStream
    nats.publish(`records.v1.${collectionName}.created`, {
      collection: collectionName,
      recordId: id,
      record: newRecord,
      data: newRecord,
      timestamp: now,
    });

    return newRecord;
  }

  public updateRecord(collectionName: string, id: string, patch: Record<string, any>): CollectionRecord {
    const currentRecords = this.records.get(collectionName) || [];
    const index = currentRecords.findIndex((r) => r.id === id);
    if (index === -1) throw new Error(`Record "${id}" not found in collection "${collectionName}"`);

    const now = new Date().toISOString();
    const updated: CollectionRecord = {
      ...currentRecords[index],
      ...patch,
      updatedAt: now,
    };

    currentRecords[index] = updated;
    this.records.set(collectionName, [...currentRecords]);
    this.saveState();

    // Broadcast to NATS JetStream
    nats.publish(`records.v1.${collectionName}.updated`, {
      collection: collectionName,
      recordId: id,
      changes: Object.keys(patch),
      timestamp: now,
    });

    return updated;
  }

  public deleteRecord(collectionName: string, id: string): boolean {
    const currentRecords = this.records.get(collectionName) || [];
    const filtered = currentRecords.filter((r) => r.id !== id);
    if (filtered.length === currentRecords.length) return false;

    this.records.set(collectionName, filtered);
    this.saveState();

    // Broadcast to NATS JetStream
    nats.publish(`records.v1.${collectionName}.deleted`, {
      collection: collectionName,
      recordId: id,
      timestamp: new Date().toISOString(),
    });

    return true;
  }

  public resetToDefault(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(STORAGE_KEY_COLLECTIONS);
        localStorage.removeItem(STORAGE_KEY_RECORDS);
      }
    } catch (e) {
      console.warn(e);
    }
    this.collections.clear();
    this.records.clear();
    this.loadState();
    this.notifyListeners();
  }
}

export const collectionRepository = new CollectionRepository();
