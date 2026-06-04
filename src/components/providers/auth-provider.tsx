'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
    User,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendSignInLinkToEmail,
    isSignInWithEmailLink,
    signInWithEmailLink,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/auth';
import { useRouter } from 'next/navigation';
import { setCookie, deleteCookie } from 'cookies-next';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ error?: string }>;
    signUp: (email: string, password: string, displayName?: string) => Promise<{ error?: string }>;
    signInWithGoogle: () => Promise<{ error?: string }>;
    signOut: () => Promise<void>;
    sendPasswordlessLink: (email: string) => Promise<{ error?: string }>;
    completePasswordlessSignIn: (email: string) => Promise<{ error?: string }>;
    isEmailLinkSignIn: boolean;
}

const FIREBASE_ERROR_MAP: Record<string, string> = {
    'auth/invalid-credential': 'Invalid email or password. Please try again.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Please use a stronger password.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/operation-not-allowed': 'This sign-in method is not enabled.',
    'auth/configuration-not-found': 'Firebase is not configured. Check your .env.local file.',
    'auth/popup-closed-by-user': 'Sign-in popup was closed before completion.',
};

function getFirebaseErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'code' in error) {
        const code = (error as { code: string }).code;
        return FIREBASE_ERROR_MAP[code] || `Authentication error: ${code}`;
    }
    return 'An unexpected error occurred. Please try again.';
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signIn: async () => ({}),
    signUp: async () => ({}),
    signInWithGoogle: async () => ({}),
    signOut: async () => { },
    sendPasswordlessLink: async () => ({}),
    completePasswordlessSignIn: async () => ({}),
    isEmailLinkSignIn: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEmailLinkSignIn, setIsEmailLinkSignIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                const token = await firebaseUser.getIdToken();
                setCookie('session', token, { maxAge: 60 * 60 * 24 * 5 });
            } else {
                deleteCookie('session');
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Auto-detect email link sign-in callback
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isLink = isSignInWithEmailLink(auth, window.location.href);
            setIsEmailLinkSignIn(isLink);

            if (isLink) {
                let email = window.localStorage.getItem('emailForSignIn');
                if (!email) {
                    email = window.prompt('Please confirm your email address:');
                }
                if (email) {
                    signInWithEmailLink(auth, email, window.location.href)
                        .then(() => {
                            window.localStorage.removeItem('emailForSignIn');
                            router.push('/dashboard');
                        })
                        .catch(() => {
                            // Silently handle — user can retry manually
                        });
                }
            }
        }
    }, [router]);

    const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/dashboard');
            return {};
        } catch (err) {
            return { error: getFirebaseErrorMessage(err) };
        }
    };

    const signUp = async (email: string, password: string, displayName?: string): Promise<{ error?: string }> => {
        try {
            const credential = await createUserWithEmailAndPassword(auth, email, password);
            if (displayName && credential.user) {
                await updateProfile(credential.user, { displayName });
                // Force user state update locally to reflect immediately
                setUser({ ...credential.user, displayName });
            }
            router.push('/dashboard');
            return {};
        } catch (err) {
            return { error: getFirebaseErrorMessage(err) };
        }
    };

    const signInWithGoogle = async (): Promise<{ error?: string }> => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
            router.push('/dashboard');
            return {};
        } catch (err) {
            return { error: getFirebaseErrorMessage(err) };
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        deleteCookie('session');
        router.push('/login');
    };

    const sendPasswordlessLink = async (email: string): Promise<{ error?: string }> => {
        try {
            const actionCodeSettings = {
                url: typeof window !== 'undefined'
                    ? `${window.location.origin}/login`
                    : 'http://localhost:3000/login',
                handleCodeInApp: true,
            };
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
            return {};
        } catch (err) {
            return { error: getFirebaseErrorMessage(err) };
        }
    };

    const completePasswordlessSignIn = async (email: string): Promise<{ error?: string }> => {
        try {
            if (typeof window !== 'undefined' && isSignInWithEmailLink(auth, window.location.href)) {
                await signInWithEmailLink(auth, email, window.location.href);
                window.localStorage.removeItem('emailForSignIn');
                router.push('/dashboard');
                return {};
            }
            return { error: 'Invalid sign-in link.' };
        } catch (err) {
            return { error: getFirebaseErrorMessage(err) };
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                signIn,
                signUp,
                signInWithGoogle,
                signOut,
                sendPasswordlessLink,
                completePasswordlessSignIn,
                isEmailLinkSignIn,
            }}
        >
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
