import { Firestore, CollectionReference, WithFieldValue, Query, Filter, Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { BaseEntity } from '@/types';
import { NotFoundError } from '@/lib/errors';

export abstract class BaseRepository<T extends BaseEntity> {
    protected collectionName: string;
    protected db: Firestore;

    constructor(collectionName: string) {
        this.collectionName = collectionName;
        this.db = adminDb;
    }

    protected get collection(): CollectionReference<T> {
        return this.db.collection(this.collectionName) as CollectionReference<T>;
    }

    /**
     * Create a new document with auto-generated ID and timestamps
     */
    async create(data: Omit<T, keyof BaseEntity>): Promise<T> {
        const now = new Date().toISOString();
        const docRef = this.collection.doc();

        const newRecord = {
            ...data,
            id: docRef.id,
            created_at: now,
            updated_at: now,
            soft_delete: false,
        } as T;

        await docRef.set(newRecord);
        return newRecord;
    }

    /**
     * Find document by ID, respecting soft_delete
     */
    async findById(id: string): Promise<T | null> {
        const docSnap = await this.collection.doc(id).get();

        if (!docSnap.exists) {
            return null;
        }

        const data = docSnap.data() as T;
        if (data.soft_delete) {
            return null;
        }

        return data;
    }

    /**
     * Find all documents, respecting soft_delete.
     * Can accept optional filters.
     */
    async findAll(filters?: Record<string, any>): Promise<T[]> {
        let query: Query<T> = this.collection.where('soft_delete', '==', false);

        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                query = query.where(key, '==', value);
            });
        }

        const snapshot = await query.get();
        return snapshot.docs.map(doc => doc.data());
    }

    /**
     * Update a document by ID. Auto-updates 'updated_at'.
     */
    async update(id: string, data: Partial<Omit<T, keyof BaseEntity>>): Promise<T> {
        const docRef = this.collection.doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            throw new NotFoundError(`${this.collectionName} with ID ${id}`);
        }

        const currentData = docSnap.data() as T;
        if (currentData.soft_delete) {
            throw new NotFoundError(`${this.collectionName} with ID ${id} (deleted)`);
        }

        const updates = {
            ...data,
            updated_at: new Date().toISOString(),
        };

        await docRef.update(updates as any);

        // Return fresh data
        const updatedSnap = await docRef.get();
        return updatedSnap.data() as T;
    }

    /**
     * Soft delete a document by ID
     */
    async softDelete(id: string): Promise<void> {
        const docRef = this.collection.doc(id);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            throw new NotFoundError(`${this.collectionName} with ID ${id}`);
        }

        await docRef.update({
            soft_delete: true,
            updated_at: new Date().toISOString(),
        } as any);
    }

    /**
     * Permanently delete (Hard Delete) - Use carefully!
     */
    async hardDelete(id: string): Promise<void> {
        await this.collection.doc(id).delete();
    }
}
