import {
    signInAnonymously as firebaseSignInAnonymously,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    sendPasswordResetEmail,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import { getUserData, saveUserData } from "./firestoreService";
import { UserData } from "../types/user";

export const signInAnonymously = async () => {
    try {
        const credential = await firebaseSignInAnonymously(auth);
        const user = credential.user;

        // Check if user data already exists
        let userData = await getUserData(user.uid);
        if (!userData) {
            userData = {
                uid: user.uid,
                email: null,
                displayName: "Anonymous Learner",
                photoURL: null,
                isAnonymous: true,
                createdAt: Date.now(),
                lastLoginAt: Date.now(),
                lessonProgress: [],
                xp: 0,
                gems: 0,
                streak: 0
            };
            await saveUserData(userData);
        }
        return userData;
    } catch (error) {
        console.error("Error signing in anonymously:", error);
        throw error;
    }
};

export const signUp = async (email: string, pass: string, name: string) => {
    try {
        const credential = await createUserWithEmailAndPassword(auth, email, pass);
        const user = credential.user;

        const userData: UserData = {
            uid: user.uid,
            email: user.email,
            displayName: name,
            photoURL: null,
            isAnonymous: false,
            createdAt: Date.now(),
            lastLoginAt: Date.now(),
            lessonProgress: [],
            xp: 0,
            gems: 0,
            streak: 0
        };
        await saveUserData(userData);
        return userData;
    } catch (error) {
        console.error("Error signing up:", error);
        throw error;
    }
};

export const signIn = async (email: string, pass: string) => {
    try {
        const credential = await signInWithEmailAndPassword(auth, email, pass);
        const user = credential.user;
        const userData = await getUserData(user.uid);
        if (userData) {
            await saveUserData({ ...userData, lastLoginAt: Date.now() });
        }
        return userData;
    } catch (error: any) {
        console.error("Error signing in:", error);
        if (error.code === 'permission-denied') {
            throw new Error('Firestore permission denied. Please check your security rules.');
        }
        throw error;
    }
};

export const signInWithGoogle = async () => {
    try {
        const credential = await signInWithPopup(auth, googleProvider);
        const user = credential.user;

        let userData = await getUserData(user.uid);
        if (!userData) {
            userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || 'Learner',
                photoURL: user.photoURL,
                isAnonymous: false,
                createdAt: Date.now(),
                lastLoginAt: Date.now(),
                lessonProgress: [],
                xp: 0,
                gems: 0,
                streak: 0
            };
            await saveUserData(userData);
        } else {
            await saveUserData({ ...userData, lastLoginAt: Date.now() });
        }
        return userData;
    } catch (error) {
        console.error("Error signing in with Google:", error);
        throw error;
    }
};

export const sendPasswordReset = async (email: string) => {
    try {
        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        console.error("Error sending password reset:", error);
        throw error;
    }
};

export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Error signing out:", error);
        throw error;
    }
};

export const subscribeToAuthChanges = (callback: (user: UserData | null) => void) => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            try {
                const userData = await getUserData(firebaseUser.uid);
                callback(userData);
            } catch (err) {
                console.error("Error fetching user data in auth change:", err);
                // Fallback or specific error handling if permissions are missing
                callback(null);
            }
        } else {
            callback(null);
        }
    });
};
