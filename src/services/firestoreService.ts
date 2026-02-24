import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    doc,
    query,
    where,
    orderBy,
    writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import { Lesson } from "../types/lesson";
import { UserData } from "../types/user";

const LESSONS_COLLECTION = "lessons";
const USERS_COLLECTION = "users";

export const saveLesson = async (lesson: Partial<Lesson>) => {
    try {
        const docRef = await addDoc(collection(db, LESSONS_COLLECTION), {
            ...lesson,
            createdAt: Date.now()
        });
        return docRef.id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
};

export const getAllLessons = async (): Promise<Lesson[]> => {
    const querySnapshot = await getDocs(
        query(collection(db, LESSONS_COLLECTION), orderBy("createdAt", "desc"))
    );
    return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Lesson));
};

export const getLessonById = async (id: string): Promise<Lesson | null> => {
    const docSnap = await getDoc(doc(db, LESSONS_COLLECTION, id));
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Lesson;
    }
    return null;
};

export const saveUserData = async (userData: UserData) => {
    try {
        await setDoc(doc(db, USERS_COLLECTION, userData.uid), userData, { merge: true });
    } catch (e) {
        console.error("Error saving user data:", e);
        throw e;
    }
};

export const getUserData = async (uid: string): Promise<UserData | null> => {
    const docSnap = await getDoc(doc(db, USERS_COLLECTION, uid));
    if (docSnap.exists()) {
        return docSnap.data() as UserData;
    }
    return null;
};

export const seedLessons = async () => {
    const initialLessons: Partial<Lesson>[] = [
        {
            title: 'Интернэтээр хэрхэн аюулгүй аялах вэ?',
            category: 'Technology',
            summary: 'Аюулгүй байдал бол хамгийн чухал. Энэ хичээлээр та өөрийгөө хамгаалах үндсэн аргуудыг сурна.',
            author: 'System',
            createdAt: Date.now(),
            isPaid: false,
            tags: ['security', 'internet'],
            steps: [
                { id: 's1', title: 'Хүчтэй нууц үг', content: 'Тоо, тэмдэгт оролцуулсан нарийн нууц үг ашиглах.' },
                { id: 's2', title: '2 шатлалт баталгаажуулалт', content: 'Утасны дугаараар баталгаажуулах тохиргоо хийх.' }
            ]
        },
        {
            title: 'Гэртээ кофе хэрхэн зөв найруулах вэ?',
            category: 'Lifestyle',
            summary: 'Өглөөг эрч хүчтэй эхлүүлэхэд туслах амттай кофе бэлтгэх зааварчилгаа.',
            author: 'System',
            createdAt: Date.now() - 10000,
            isPaid: false,
            tags: ['coffee', 'home'],
            steps: [
                { id: 'c1', title: 'Усны температур', content: 'Ус хэт халуун байж болохгүй.' },
                { id: 'c2', title: 'Кофены тун', content: 'Өөрийн таашаалд нийцүүлэн нэмэх.' }
            ]
        },
        {
            title: 'Google Sheets ашиглаж сурах',
            category: 'Education',
            summary: 'Дата мэдээлэлтэй ажиллах анхан шатны мэдлэг олгох хичээл.',
            author: 'System',
            createdAt: Date.now() - 20000,
            isPaid: true,
            price: 5000,
            tags: ['tools', 'spreadsheet'],
            steps: [
                { id: 'g1', title: 'Хүснэгт үүсгэх', content: 'Шинэ файл нээж мэдээллээ оруулах.' },
                { id: 'g2', title: 'Формула ашиглах', content: 'SUM, AVERAGE зэрэг функц сурах.' }
            ]
        }
    ];

    try {
        const batch = writeBatch(db);
        const lessonsRef = collection(db, LESSONS_COLLECTION);

        // Clear existing lessons (optional, but good for seeding)
        // Note: Removing existing lessons requires fetching them first or just adding new ones.
        // For simplicity, we just add them.

        for (const lesson of initialLessons) {
            const newDocRef = doc(lessonsRef);
            batch.set(newDocRef, { ...lesson, id: newDocRef.id });
        }

        await batch.commit();
        console.log("Seeding complete!");
    } catch (e) {
        console.error("Seeding failed:", e);
    }
};
