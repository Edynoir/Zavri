import {
    signInAnonymously as firebaseSignInAnonymously,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser
} from "firebase/auth";
import { auth } from "../firebase";
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
    } catch (error) {
        console.error("Error signing in:", error);
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
            const userData = await getUserData(firebaseUser.uid);
            callback(userData);
        } else {
            callback(null);
        }
    });
};
