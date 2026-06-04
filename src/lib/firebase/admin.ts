import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { env } from '../env';

function initAdmin() {
    if (getApps().length > 0) {
        return getApp();
    }

    return initializeApp({
        credential: cert({
            projectId: env.admin.projectId,
            clientEmail: env.admin.clientEmail,
            privateKey: env.admin.privateKey,
        }),
    });
}

export const adminApp = initAdmin();
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
