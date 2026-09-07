import { getDb } from "@/lib/mongodb";
import { randomUUID } from "node:crypto";
import type { Db, Filter, Sort, Document } from "mongodb";

// Polyfill Firestore Timestamp compatibility on native Date
if (typeof Date !== "undefined") {
  if (!(Date.prototype as any).toDate) {
    (Date.prototype as any).toDate = function () {
      return this;
    };
  }
  if (!(Date.prototype as any).toMillis) {
    (Date.prototype as any).toMillis = function () {
      return this.getTime();
    };
  }
}

export type MongoFieldValueType =
  | "increment"
  | "serverTimestamp"
  | "delete"
  | "arrayUnion"
  | "arrayRemove";

export class MongoFieldValue {
  readonly type: MongoFieldValueType;
  readonly value?: any;

  constructor(type: MongoFieldValueType, value?: any) {
    this.type = type;
    this.value = value;
  }

  static increment(n: number): MongoFieldValue {
    return new MongoFieldValue("increment", n);
  }

  static serverTimestamp(): MongoFieldValue {
    return new MongoFieldValue("serverTimestamp");
  }

  static delete(): MongoFieldValue {
    return new MongoFieldValue("delete");
  }

  /** Appends values to an array, skipping any already present — Mongo's $addToSet. */
  static arrayUnion(...values: any[]): MongoFieldValue {
    return new MongoFieldValue("arrayUnion", values);
  }

  /** Removes every occurrence of the given values from an array — Mongo's $pull. */
  static arrayRemove(...values: any[]): MongoFieldValue {
    return new MongoFieldValue("arrayRemove", values);
  }
}

export { MongoFieldValue as FieldValue };

export interface DocumentSnapshot<T = any> {
  id: string;
  exists: boolean;
  data(): T | undefined;
  /**
   * The document this snapshot came from.
   *
   * Firestore snapshots carry one, and server code leans on it heavily — the
   * password, unlock and agreement routes all do `snapshot.docs[0].ref.update(...)`
   * after a query rather than rebuilding a reference from the id.
   */
  ref: MongoDocRef;
}

export interface QuerySnapshot<T = any> {
  empty: boolean;
  size: number;
  docs: DocumentSnapshot<T>[];
  forEach(callback: (doc: DocumentSnapshot<T>) => void): void;
}

function processPayloadForMongo(data: Record<string, any>, isUpdate = false) {
  const $set: Record<string, any> = {};
  const $inc: Record<string, number> = {};
  const $unset: Record<string, any> = {};
  const $addToSet: Record<string, any> = {};
  const $pull: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    if (key === "_id" || (key === "id" && isUpdate)) {
      continue;
    }

    if (value instanceof MongoFieldValue) {
      if (value.type === "increment") {
        $inc[key] = value.value;
      } else if (value.type === "serverTimestamp") {
        $set[key] = new Date();
      } else if (value.type === "delete") {
        $unset[key] = "";
      } else if (value.type === "arrayUnion") {
        // $each so a single call can append several values, matching arrayUnion(a, b).
        $addToSet[key] = { $each: value.value || [] };
      } else if (value.type === "arrayRemove") {
        $pull[key] = { $in: value.value || [] };
      }
    } else if (
      value &&
      typeof value === "object" &&
      value.constructor &&
      value.constructor.name === "FieldValue"
    ) {
      // Handles native firebase-admin FieldValue instances if passed
      $set[key] = new Date();
    } else {
      $set[key] = value;
    }
  }

  const updateDoc: Record<string, any> = {};
  if (Object.keys($set).length > 0) updateDoc.$set = $set;
  if (Object.keys($inc).length > 0) updateDoc.$inc = $inc;
  if (Object.keys($unset).length > 0) updateDoc.$unset = $unset;
  if (Object.keys($addToSet).length > 0) updateDoc.$addToSet = $addToSet;
  if (Object.keys($pull).length > 0) updateDoc.$pull = $pull;

  return updateDoc;
}

export class MongoDocRef {
  readonly collectionName: string;
  readonly id: string;
  readonly parentId?: string;

  constructor(collectionName: string, id: string, parentId?: string) {
    this.collectionName = collectionName;
    this.id = id;
    this.parentId = parentId;
  }

  /**
   * The `_id` this document is actually stored under.
   *
   * Every parent's subcollection is flattened into one Mongo collection, but a
   * subcollection's ids are only unique *within* their parent — campaign recipients
   * are numbered r0000001, r0000002 in each campaign independently. Since `_id` must
   * be unique per collection, storing the raw id would let one parent's document
   * overwrite another's. Prefixing with the parent keeps them distinct; `id` stays
   * the logical id everywhere it is read back.
   */
  get storageId(): string {
    return this.parentId ? `${this.parentId}/${this.id}` : this.id;
  }

  get path(): string {
    return this.parentId ? `${this.collectionName}/${this.id}` : `${this.collectionName}/${this.id}`;
  }

  collection(subCollectionName: string): MongoCollectionRef {
    const compoundName = `${this.collectionName}_${subCollectionName}`;
    return new MongoCollectionRef(compoundName, this.id);
  }

  async get(): Promise<DocumentSnapshot> {
    const db = await getDb();
    const filter: Filter<Document> = { _id: this.storageId as any };
    if (this.parentId) {
      filter._parentId = this.parentId;
    }

    const doc = await db.collection(this.collectionName).findOne(filter);
    if (!doc) {
      return {
        id: this.id,
        exists: false,
        data: () => undefined,
        ref: this,
      };
    }

    // `_docId` carries the logical id for a subcollection document, whose `_id` is
    // prefixed with its parent. Callers only ever see the logical one.
    const { _id, _parentId, _docId, ...rest } = doc;
    const logicalId = String(_docId ?? _id);
    return {
      id: logicalId,
      exists: true,
      data: () => ({ ...rest, id: logicalId }),
      ref: this,
    };
  }

  async set(data: any, options?: { merge?: boolean }): Promise<void> {
    const db = await getDb();
    const filter: Filter<Document> = { _id: this.storageId as any };
    if (this.parentId) {
      filter._parentId = this.parentId;
    }

    const operations = processPayloadForMongo(data);
    const $set = operations.$set || {};
    if (this.parentId) {
      $set._parentId = this.parentId;
      $set._docId = this.id;
    }

    if (options?.merge) {
      const updateObj: Record<string, any> = {};
      if (Object.keys($set).length > 0) updateObj.$set = $set;
      if (operations.$inc) updateObj.$inc = operations.$inc;
      if (operations.$unset) updateObj.$unset = operations.$unset;
      if (operations.$addToSet) updateObj.$addToSet = operations.$addToSet;
      if (operations.$pull) updateObj.$pull = operations.$pull;

      await db.collection(this.collectionName).updateOne(
        filter,
        Object.keys(updateObj).length > 0 ? updateObj : { $set: {} },
        { upsert: true }
      );
    } else {
      const fullDoc = { ...$set, _id: this.storageId as any };
      if (this.parentId) {
        (fullDoc as any)._parentId = this.parentId;
        (fullDoc as any)._docId = this.id;
      }
      await db.collection(this.collectionName).replaceOne(filter, fullDoc, { upsert: true });
    }
  }

  async update(data: any): Promise<void> {
    const db = await getDb();
    const filter: Filter<Document> = { _id: this.storageId as any };
    if (this.parentId) {
      filter._parentId = this.parentId;
    }

    const operations = processPayloadForMongo(data, true);
    const updateObj: Record<string, any> = {};
    if (operations.$set) updateObj.$set = operations.$set;
    if (operations.$inc) updateObj.$inc = operations.$inc;
    if (operations.$unset) updateObj.$unset = operations.$unset;
    if (operations.$addToSet) updateObj.$addToSet = operations.$addToSet;
    if (operations.$pull) updateObj.$pull = operations.$pull;

    if (Object.keys(updateObj).length === 0) return;

    await db.collection(this.collectionName).updateOne(filter, updateObj);
  }

  async delete(): Promise<void> {
    const db = await getDb();
    const filter: Filter<Document> = { _id: this.storageId as any };
    if (this.parentId) {
      filter._parentId = this.parentId;
    }
    await db.collection(this.collectionName).deleteOne(filter);
  }
}

export class MongoQuery {
  readonly collectionName: string;
  readonly parentId?: string;
  protected filters: Filter<Document>[] = [];
  protected sorts: Sort = {};
  protected projection: Record<string, 1> = {};
  protected limitCount: number | null = null;
  protected skipCount: number | null = null;
  protected startAfterVal: any = null;

  constructor(collectionName: string, parentId?: string) {
    this.collectionName = collectionName;
    this.parentId = parentId;
    if (this.parentId) {
      this.filters.push({ _parentId: this.parentId });
    }
  }

  where(field: string, opStr: string, value: any): MongoQuery {
    // In a subcollection the caller's id lives in `_docId`; `_id` there is the
    // parent-prefixed composite, which nothing outside this file knows about.
    const queryField = field === "id" ? (this.parentId ? "_docId" : "_id") : field;
    const q = new MongoQuery(this.collectionName, this.parentId);
    q.filters = [...this.filters];
    q.sorts = { ...this.sorts };
    q.projection = { ...this.projection };
    q.limitCount = this.limitCount;
    q.skipCount = this.skipCount;
    q.startAfterVal = this.startAfterVal;

    let mongoFilter: Filter<Document>;
    switch (opStr) {
      case "==":
        mongoFilter = { [queryField]: value };
        break;
      case "!=":
        mongoFilter = { [queryField]: { $ne: value } };
        break;
      case "<":
        mongoFilter = { [queryField]: { $lt: value } };
        break;
      case "<=":
        mongoFilter = { [queryField]: { $lte: value } };
        break;
      case ">":
        mongoFilter = { [queryField]: { $gt: value } };
        break;
      case ">=":
        mongoFilter = { [queryField]: { $gte: value } };
        break;
      case "in":
        mongoFilter = { [queryField]: { $in: Array.isArray(value) ? value : [value] } };
        break;
      case "not-in":
        mongoFilter = { [queryField]: { $nin: Array.isArray(value) ? value : [value] } };
        break;
      case "array-contains":
        mongoFilter = { [queryField]: value };
        break;
      case "array-contains-any":
        mongoFilter = { [queryField]: { $in: Array.isArray(value) ? value : [value] } };
        break;
      default:
        mongoFilter = { [queryField]: value };
    }

    q.filters.push(mongoFilter);
    return q;
  }

  orderBy(field: string, directionStr: "asc" | "desc" = "asc"): MongoQuery {
    const q = new MongoQuery(this.collectionName, this.parentId);
    q.filters = [...this.filters];
    // Must agree with where()/startAfter(): in a subcollection the caller's id is
    // `_docId`, and startAfter compares against a snapshot's logical id.
    const sortField = field === "id" ? (this.parentId ? "_docId" : "_id") : field;
    q.sorts = { ...this.sorts, [sortField]: directionStr === "desc" ? -1 : 1 };
    q.projection = { ...this.projection };
    q.limitCount = this.limitCount;
    q.skipCount = this.skipCount;
    q.startAfterVal = this.startAfterVal;
    return q;
  }

  select(...fields: string[]): MongoQuery {
    const q = new MongoQuery(this.collectionName, this.parentId);
    q.filters = [...this.filters];
    q.sorts = { ...this.sorts };
    q.projection = { ...this.projection };
    for (const f of fields) {
      q.projection[f === "id" ? (this.parentId ? "_docId" : "_id") : f] = 1;
    }
    q.limitCount = this.limitCount;
    q.skipCount = this.skipCount;
    q.startAfterVal = this.startAfterVal;
    return q;
  }

  startAfter(...values: any[]): MongoQuery {
    const q = new MongoQuery(this.collectionName, this.parentId);
    q.filters = [...this.filters];
    q.sorts = { ...this.sorts };
    q.projection = { ...this.projection };
    q.limitCount = this.limitCount;
    q.skipCount = this.skipCount;

    if (values.length > 0) {
      const val = values[0];
      const sortKeys = Object.keys(q.sorts);
      const primarySortField = sortKeys[0] || "_id";
      const sortDirection = q.sorts[primarySortField] === -1 ? -1 : 1;

      let extractedVal = val;
      if (val && typeof val === "object" && typeof val.data === "function") {
        const docData = val.data();
        extractedVal = primarySortField === "_id" ? val.id : docData?.[primarySortField];
      }

      if (extractedVal !== undefined && extractedVal !== null) {
        const operator = sortDirection === 1 ? "$gt" : "$lt";
        q.filters.push({ [primarySortField]: { [operator]: extractedVal } });
      }
    }
    return q;
  }

  limit(limit: number): MongoQuery {
    const q = new MongoQuery(this.collectionName, this.parentId);
    q.filters = [...this.filters];
    q.sorts = { ...this.sorts };
    q.projection = { ...this.projection };
    q.limitCount = limit;
    q.skipCount = this.skipCount;
    q.startAfterVal = this.startAfterVal;
    return q;
  }

  offset(offset: number): MongoQuery {
    const q = new MongoQuery(this.collectionName, this.parentId);
    q.filters = [...this.filters];
    q.sorts = { ...this.sorts };
    q.projection = { ...this.projection };
    q.limitCount = this.limitCount;
    q.skipCount = offset;
    q.startAfterVal = this.startAfterVal;
    return q;
  }

  async get(): Promise<QuerySnapshot> {
    const db = await getDb();
    const finalFilter: Filter<Document> =
      this.filters.length === 0
        ? {}
        : this.filters.length === 1
        ? this.filters[0]
        : { $and: this.filters };

    let cursor = db.collection(this.collectionName).find(finalFilter);

    if (Object.keys(this.projection).length > 0) {
      cursor = cursor.project(this.projection);
    }
    if (Object.keys(this.sorts).length > 0) {
      cursor = cursor.sort(this.sorts);
    }
    if (this.skipCount && this.skipCount > 0) {
      cursor = cursor.skip(this.skipCount);
    }
    if (this.limitCount && this.limitCount > 0) {
      cursor = cursor.limit(this.limitCount);
    }

    const docs = await cursor.toArray();
    const snapshots: DocumentSnapshot[] = docs.map((doc) => {
      // Same as MongoDocRef.get(): a subcollection document's `_id` is prefixed with
      // its parent, and `_docId` is the id the caller knows it by.
      const { _id, _parentId, _docId, ...rest } = doc;
      const logicalId = String(_docId ?? _id);
      return {
        id: logicalId,
        exists: true,
        data: () => ({ ...rest, id: logicalId }),
        // Built from the logical id and the row's own parent, so `doc.ref.update(...)`
        // after a query addresses the same document the query returned.
        ref: new MongoDocRef(
          this.collectionName,
          logicalId,
          _parentId !== undefined ? String(_parentId) : this.parentId
        ),
      };
    });

    return {
      empty: snapshots.length === 0,
      size: snapshots.length,
      docs: snapshots,
      forEach: (callback: (doc: DocumentSnapshot) => void) => {
        snapshots.forEach(callback);
      },
    };
  }
}

export class MongoCollectionRef extends MongoQuery {
  constructor(collectionName: string, parentId?: string) {
    super(collectionName, parentId);
  }

  doc(id?: string): MongoDocRef {
    const docId = id || randomUUID();
    return new MongoDocRef(this.collectionName, docId, this.parentId);
  }

  async add(data: any): Promise<MongoDocRef> {
    const docId = randomUUID();
    const ref = this.doc(docId);
    await ref.set(data);
    return ref;
  }
}

export class MongoBatch {
  private ops: Array<() => Promise<void>> = [];

  set(ref: MongoDocRef, data: any, options?: { merge?: boolean }): MongoBatch {
    this.ops.push(() => ref.set(data, options));
    return this;
  }

  update(ref: MongoDocRef, data: any): MongoBatch {
    this.ops.push(() => ref.update(data));
    return this;
  }

  delete(ref: MongoDocRef): MongoBatch {
    this.ops.push(() => ref.delete());
    return this;
  }

  async commit(): Promise<void> {
    for (const op of this.ops) {
      await op();
    }
    this.ops = [];
  }
}

export class MongoDbAdapter {
  collection(name: string): MongoCollectionRef {
    if (name.includes("/")) {
      const parts = name.split("/").filter(Boolean);
      if (parts.length === 3) {
        const [parentCol, parentId, subCol] = parts;
        return new MongoCollectionRef(`${parentCol}_${subCol}`, parentId);
      }
    }
    return new MongoCollectionRef(name);
  }

  batch(): MongoBatch {
    return new MongoBatch();
  }

  async runTransaction<T>(
    updateFunction: (transaction: {
      get: (ref: MongoDocRef) => Promise<DocumentSnapshot>;
      set: (ref: MongoDocRef, data: any, options?: { merge?: boolean }) => void;
      update: (ref: MongoDocRef, data: any) => void;
      delete: (ref: MongoDocRef) => void;
    }) => Promise<T>
  ): Promise<T> {
    const pendingWrites: Array<() => Promise<void>> = [];

    const txObject = {
      get: (ref: MongoDocRef) => ref.get(),
      set: (ref: MongoDocRef, data: any, options?: { merge?: boolean }) => {
        pendingWrites.push(() => ref.set(data, options));
      },
      update: (ref: MongoDocRef, data: any) => {
        pendingWrites.push(() => ref.update(data));
      },
      delete: (ref: MongoDocRef) => {
        pendingWrites.push(() => ref.delete());
      },
    };

    const result = await updateFunction(txObject);
    for (const write of pendingWrites) {
      await write();
    }
    return result;
  }
}

export const mongoDbAdapter = new MongoDbAdapter();
