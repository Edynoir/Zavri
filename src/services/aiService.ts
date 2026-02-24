import { Lesson, LessonStep } from '../types/lesson';

/**
 * Service to interact with AI (e.g., Gemini) to generate lesson content.
 */
export const generateLessonWithAI = async (title: string, category: string, summary: string): Promise<Partial<Lesson>> => {
    console.log(`Generating lesson for: ${title} in ${category}...`);

    // In a real implementation, this would call an API like Gemini.
    // For now, we simulate the AI response with a delay and mock content.
    await new Promise(resolve => setTimeout(resolve, 2000));

    const mockSteps: LessonStep[] = [
        {
            id: 'step-1',
            title: `${title} - Алхам 1`,
            content: `Эхний ээлжинд та ${title} хийх бэлтгэлээ хангах хэрэгтэй. Үүний тулд шаардлагатай багаж хэрэгсэл болон материалаа базаагаарай.`,
            tips: ['Багаж хэрэгслээ цэвэрлэх', 'Төлөвлөгөө гаргах']
        },
        {
            id: 'step-2',
            title: `${title} - Алхам 2`,
            content: `Дараагийн алхамд та үндсэн үйлдлээ гүйцэтгэнэ. Анхааралтай байж, зааврын дагуу хийгээрэй.`,
            tips: ['Яарахгүй байх', 'Дахин шалгах']
        },
        {
            id: 'step-3',
            title: 'Дүгнэлт',
            content: `Ингээд та ${title}-ийг амжилттай хийж дуусгалаа. Одоо та үр дүнгээ шалгаж, бусадтай хуваалцах боломжтой.`,
        }
    ];

    return {
        title,
        category,
        summary,
        steps: mockSteps,
        tags: [category.toLowerCase(), 'заавар', 'монгол'],
        createdAt: Date.now(),
    };
};
