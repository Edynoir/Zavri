export interface UserProgress {
    lessonId: string;
    completedAt: number;
    score?: number;
}

export interface UserData {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    isAnonymous: boolean;
    createdAt: number;
    lastLoginAt: number;
    lessonProgress: UserProgress[];
    xp: number;
    gems: number;
    streak: number;
}
