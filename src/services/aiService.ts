import { GoogleGenerativeAI } from '@google/generative-ai';
import { Lesson, LessonStep } from '../types/lesson';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Service to interact with AI (Gemini) to generate lesson content.
 */
export const generateLessonWithAI = async (title: string, category: string, summary: string): Promise<Partial<Lesson>> => {
    console.log(`Generating lesson for: ${title} in ${category}...`);

    if (!API_KEY) {
        console.warn('VITE_GEMINI_API_KEY is missing. Using mock content.');
        return getMockLesson(title, category, summary);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
            You are an expert educator. Create a detailed lesson in Mongolian for the following topic:
            Title: ${title}
            Category: ${category}
            Summary: ${summary}

            The lesson should have a clear structure with 3-5 logical steps.
            For each step, provide:
            - A concise title
            - Detailed instructional content (at least 2-3 sentences)
            - 2-3 practical tips or "good to know" points

            Return the response as a valid JSON object with the following structure:
            {
                "steps": [
                    {
                        "title": "Step Title",
                        "content": "Detailed instructional content in Mongolian.",
                        "tips": ["Tip 1", "Tip 2"]
                    }
                ],
                "tags": ["tag1", "tag2"]
            }

            IMPORTANT: Output ONLY the JSON object. Do not include any markdown formatting or meta-talk.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean the response if it contains markdown code blocks
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        const steps: LessonStep[] = data.steps.map((step: any, index: number) => ({
            id: `step-${index + 1}`,
            title: step.title,
            content: step.content,
            tips: step.tips
        }));

        return {
            title,
            category,
            summary,
            steps,
            tags: data.tags || [category.toLowerCase(), 'заавар', 'монгол'],
            createdAt: Date.now(),
        };
    } catch (error) {
        console.error('Error generating lesson with Gemini:', error);
        return getMockLesson(title, category, summary);
    }
};

const getMockLesson = (title: string, category: string, summary: string): Partial<Lesson> => {
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
