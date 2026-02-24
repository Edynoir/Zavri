import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
const firebaseConfig = {
    apiKey: "AIzaSyCTuiAjykfqlqTxIhlOJ1ABI2YG64TWg0o",
    authDomain: "zavri-25a4e.firebaseapp.com",
    projectId: "zavri-25a4e",
    storageBucket: "zavri-25a4e.firebasestorage.app",
    messagingSenderId: "1036284594411",
    appId: "1:1036284594411:web:b2495a71c38ee3980996ae",
    measurementId: "G-TXECBQJ16D"
};
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
