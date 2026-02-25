export interface LessonStep {
    id: string;
    title: string;
    content: string;
    imageUrl?: string;
    tips?: string[];
}

export interface Lesson {
    id: string;
    title: string;
    category: string;
    summary: string;
    author: string;
    createdAt: number;
    isPaid: boolean;
    price?: number;
    steps: LessonStep[];
    tags: string[];
    thumbnailUrl?: string;
    sourceUrl?: string;
}

export type LessonType = 'Technology' | 'Cooking' | 'Lifestyle' | 'Education';
