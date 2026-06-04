import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { env } from '../env';

const firebaseConfig = {
    apiKey: env.firebase.apiKey,
    authDomain: env.firebase.authDomain,
    projectId: env.firebase.projectId,
    storageBucket: env.firebase.storageBucket,
    messagingSenderId: env.firebase.messagingSenderId,
    appId: env.firebase.appId,
};

// Initialize Firebase
const app: FirebaseApp = !getApps().length
    ? initializeApp(firebaseConfig)
    : getApp();

export { app };
