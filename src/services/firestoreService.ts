import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    writeBatch
} from "firebase/firestore";
import { db } from "../firebase";
import { Lesson } from "../types/lesson";
import { UserData, UserRole } from "../types/user";

const LESSONS_COLLECTION = "lessons";
const USERS_COLLECTION = "users";
const REPORTS_COLLECTION = "reports";

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

export const saveLessonIfNotDuplicate = async (lesson: Partial<Lesson>): Promise<string | null> => {
    try {
        const q = query(collection(db, LESSONS_COLLECTION), where("title", "==", lesson.title));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            console.log(`Skipping duplicate: "${lesson.title}"`);
            return null;
        }
        return await saveLesson(lesson);
    } catch (e) {
        console.error("Error saving lesson with dedup:", e);
        throw e;
    }
};

export const getAllLessons = async (): Promise<Lesson[]> => {
    try {
        const querySnapshot = await getDocs(
            query(collection(db, LESSONS_COLLECTION), orderBy("createdAt", "desc"))
        );
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Lesson));
    } catch (error: any) {
        console.error("Error fetching lessons:", error);
        if (error.code === 'permission-denied') {
            throw new Error('Firestore permission denied for lessons. Please check your security rules.');
        }
        throw error;
    }
};

export const getLessonById = async (id: string): Promise<Lesson | null> => {
    const docSnap = await getDoc(doc(db, LESSONS_COLLECTION, id));
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Lesson;
    }
    return null;
};

export const updateLesson = async (id: string, data: Partial<Lesson>) => {
    try {
        const ref = doc(db, LESSONS_COLLECTION, id);
        await updateDoc(ref, data as any);
    } catch (e) {
        console.error("Error updating lesson:", e);
        throw e;
    }
};

export const deleteLesson = async (id: string) => {
    try {
        await deleteDoc(doc(db, LESSONS_COLLECTION, id));
    } catch (e) {
        console.error("Error deleting lesson:", e);
        throw e;
    }
};

export const bulkSaveLessons = async (lessons: Partial<Lesson>[], onProgress?: (done: number, total: number) => void): Promise<number> => {
    // Get all existing titles for dedup
    const existing = await getAllLessons();
    const existingTitles = new Set(existing.map(l => l.title.toLowerCase().trim()));

    const toAdd = lessons.filter(l => !existingTitles.has((l.title || '').toLowerCase().trim()));
    let saved = 0;

    for (const lesson of toAdd) {
        try {
            await addDoc(collection(db, LESSONS_COLLECTION), {
                ...lesson,
                createdAt: Date.now() - (toAdd.length - saved) * 1000 // offset timestamps for ordering
            });
            saved++;
            onProgress?.(saved, toAdd.length);
        } catch (e) {
            console.error(`Failed to save: ${lesson.title}`, e);
        }
    }

    console.log(`Bulk save complete: ${saved}/${toAdd.length} new lessons (${lessons.length - toAdd.length} duplicates skipped)`);
    return saved;
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
    try {
        const docSnap = await getDoc(doc(db, USERS_COLLECTION, uid));
        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        }
        return null;
    } catch (error: any) {
        console.error("Error fetching user data:", error);
        if (error.code === 'permission-denied') {
            throw new Error('Firestore permission denied for user data. Please check your security rules.');
        }
        throw error;
    }
};

export const getAllUsers = async (): Promise<UserData[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, USERS_COLLECTION));
        return querySnapshot.docs.map(doc => doc.data() as UserData);
    } catch (error) {
        console.error("Error fetching all users:", error);
        throw error;
    }
};

export const updateUserRole = async (uid: string, role: UserRole) => {
    try {
        const userRef = doc(db, USERS_COLLECTION, uid);
        await updateDoc(userRef, { role });
    } catch (error) {
        console.error("Error updating user role:", error);
        throw error;
    }
};

export const seedLessons = async () => {
    const initialLessons: Partial<Lesson>[] = [
        {
            title: 'Интернэтээр хэрхэн аюулгүй аялах вэ?',
            category: 'Technology',
            summary: 'Аюулгүй байдал бол хамгийн чухал. Энэ хичээлээр та өөрийгөө хамгаалах үндсэн аргуудыг сурна.',
            author: 'System',
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
        const saved = await bulkSaveLessons(initialLessons);
        console.log(`Seeding complete! ${saved} new lessons added.`);
    } catch (e) {
        console.error("Seeding failed:", e);
    }
};


export const reportLesson = async (lessonId: string, userId: string, reason: string) => {
    try {
        await addDoc(collection(db, REPORTS_COLLECTION), {
            lessonId,
            userId,
            reason,
            status: 'pending',
            createdAt: Date.now()
        });
    } catch (e) {
        console.error("Error reporting lesson:", e);
        throw e;
    }
};

export const getReportedLessons = async () => {
    try {
        const snapshot = await getDocs(query(collection(db, REPORTS_COLLECTION), orderBy("createdAt", "desc")));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("Error fetching reports:", e);
        throw e;
    }
};

export const updateReportStatus = async (reportId: string, status: 'approved' | 'declined') => {
    try {
        await updateDoc(doc(db, REPORTS_COLLECTION, reportId), { status });
    } catch (e) {
        console.error("Error updating report status:", e);
        throw e;
    }
};
