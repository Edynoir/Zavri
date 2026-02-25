import { GoogleGenerativeAI } from '@google/generative-ai';
import { Lesson, LessonStep } from '../types/lesson';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

interface WikiHowTopic {
    title: string;
    category: string;
    sourceUrl: string;
}

/**
 * Curated list of popular wikiHow topics to import as Mongolian lessons.
 */
const WIKIHOW_TOPICS: WikiHowTopic[] = [
    // Technology
    { title: 'Компьютерийн нууц үгийг хэрхэн хүчтэй болгох вэ', category: 'Technology', sourceUrl: 'https://www.wikihow.com/Create-a-Strong-Password' },
    { title: 'Wi-Fi сүлжээнд хэрхэн холбогдох вэ', category: 'Technology', sourceUrl: 'https://www.wikihow.com/Connect-to-WiFi' },
    { title: 'Gmail хаяг хэрхэн нээх вэ', category: 'Technology', sourceUrl: 'https://www.wikihow.com/Create-a-Gmail-Account' },
    { title: 'Фэйсбүүк хаягаа хэрхэн хамгаалах вэ', category: 'Technology', sourceUrl: 'https://www.wikihow.com/Secure-Your-Facebook-Account' },
    { title: 'Скриншот хэрхэн авах вэ', category: 'Technology', sourceUrl: 'https://www.wikihow.com/Take-a-Screenshot' },
    { title: 'VPN гэж юу вэ, хэрхэн ашиглах вэ', category: 'Technology', sourceUrl: 'https://www.wikihow.com/Use-a-VPN' },
    { title: 'PDF файл хэрхэн үүсгэх вэ', category: 'Technology', sourceUrl: 'https://www.wikihow.com/Create-a-PDF' },
    { title: 'Утасны санах ойг хэрхэн чөлөөлөх вэ', category: 'Technology', sourceUrl: 'https://www.wikihow.com/Free-Up-Space-on-Your-Phone' },

    // Cooking
    { title: 'Өндөгийг хэрхэн зөв чанах вэ', category: 'Cooking', sourceUrl: 'https://www.wikihow.com/Boil-an-Egg' },
    { title: 'Гэртээ пицца хэрхэн хийх вэ', category: 'Cooking', sourceUrl: 'https://www.wikihow.com/Make-Pizza' },
    { title: 'Будаа хэрхэн зөв чанах вэ', category: 'Cooking', sourceUrl: 'https://www.wikihow.com/Cook-Rice' },
    { title: 'Банштай шөл хэрхэн хийх вэ', category: 'Cooking', sourceUrl: 'https://www.wikihow.com/Make-Dumplings' },
    { title: 'Хуурга хэрхэн хийх вэ', category: 'Cooking', sourceUrl: 'https://www.wikihow.com/Stir-Fry' },

    // Lifestyle
    { title: 'Өглөө эрт босох зуршлыг хэрхэн тогтоох вэ', category: 'Lifestyle', sourceUrl: 'https://www.wikihow.com/Wake-Up-Early' },
    { title: 'Стрессийг хэрхэн бууруулах вэ', category: 'Lifestyle', sourceUrl: 'https://www.wikihow.com/Reduce-Stress' },
    { title: 'Гэрээ хэрхэн цэвэрхэн байлгах вэ', category: 'Lifestyle', sourceUrl: 'https://www.wikihow.com/Keep-Your-House-Clean' },
    { title: 'Цагийг хэрхэн зөв зохицуулах вэ', category: 'Lifestyle', sourceUrl: 'https://www.wikihow.com/Manage-Your-Time' },
    { title: 'Сайн унтах зуршлыг хэрхэн бий болгох вэ', category: 'Lifestyle', sourceUrl: 'https://www.wikihow.com/Sleep-Better' },

    // Education
    { title: 'Англи хэлний үгийн сангаа хэрхэн нэмэгдүүлэх вэ', category: 'Education', sourceUrl: 'https://www.wikihow.com/Improve-Your-Vocabulary' },
    { title: 'Шалгалтанд хэрхэн бэлдэх вэ', category: 'Education', sourceUrl: 'https://www.wikihow.com/Study-for-an-Exam' },
    { title: 'Эссэ хэрхэн бичих вэ', category: 'Education', sourceUrl: 'https://www.wikihow.com/Write-an-Essay' },
    { title: 'Ном уншиж дуусгах зуршлыг хэрхэн бий болгох вэ', category: 'Education', sourceUrl: 'https://www.wikihow.com/Read-More-Books' },

    // Health
    { title: 'Гэртээ дасгал хэрхэн хийх вэ', category: 'Health', sourceUrl: 'https://www.wikihow.com/Exercise-at-Home' },
    { title: 'Эрүүл хооллолтын зуршлыг хэрхэн бий болгох вэ', category: 'Health', sourceUrl: 'https://www.wikihow.com/Eat-Healthy' },
    { title: 'Ус хангалттай уух зуршлыг хэрхэн тогтоох вэ', category: 'Health', sourceUrl: 'https://www.wikihow.com/Drink-More-Water' },

    // Finance
    { title: 'Мөнгөө хэрхэн зөв хэмнэх вэ', category: 'Finance', sourceUrl: 'https://www.wikihow.com/Save-Money' },
    { title: 'Хувийн төсвийг хэрхэн төлөвлөх вэ', category: 'Finance', sourceUrl: 'https://www.wikihow.com/Make-a-Budget' },
];

/**
 * Uses Gemini AI to generate a full Mongolian lesson from a topic.
 */
const generateLessonFromTopic = async (topic: WikiHowTopic): Promise<Partial<Lesson> | null> => {
    if (!API_KEY) {
        console.warn('No Gemini API key — generating mock lesson for:', topic.title);
        return getMockWikiHowLesson(topic);
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            You are an expert educator creating lessons inspired by wikiHow's step-by-step format.
            Create a detailed lesson in MONGOLIAN for the following topic:

            Topic: ${topic.title}
            Category: ${topic.category}

            Requirements:
            - Write a clear summary (2-3 sentences in Mongolian)
            - Create 4-5 logical steps
            - Each step should have: a concise title, detailed content (3-4 sentences), and 2-3 practical tips
            - Content must be entirely in Mongolian (Cyrillic script)
            - Make it practical and easy to follow

            Return ONLY a valid JSON object:
            {
                "summary": "Brief summary in Mongolian",
                "steps": [
                    {
                        "title": "Step title in Mongolian",
                        "content": "Detailed content in Mongolian",
                        "tips": ["Tip 1 in Mongolian", "Tip 2 in Mongolian"]
                    }
                ],
                "tags": ["tag1", "tag2", "tag3"]
            }

            IMPORTANT: Output ONLY the JSON. No markdown, no explanation.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(jsonStr);

        const steps: LessonStep[] = data.steps.map((step: any, index: number) => ({
            id: `step-${index + 1}`,
            title: step.title,
            content: step.content,
            tips: step.tips
        }));

        return {
            title: topic.title,
            category: topic.category,
            summary: data.summary,
            author: 'WikiHow / AI',
            steps,
            tags: data.tags || [topic.category.toLowerCase()],
            isPaid: false,
            sourceUrl: topic.sourceUrl,
        };
    } catch (error) {
        console.error(`Error generating lesson for "${topic.title}":`, error);
        return getMockWikiHowLesson(topic);
    }
};

const getMockWikiHowLesson = (topic: WikiHowTopic): Partial<Lesson> => ({
    title: topic.title,
    category: topic.category,
    summary: `${topic.title} - энэ хичээлээр та алхам алхмаар суралцах болно.`,
    author: 'WikiHow / AI',
    steps: [
        { id: 'step-1', title: 'Бэлтгэл', content: 'Эхлээд шаардлагатай зүйлсээ бэлтгэнэ.', tips: ['Тайван байх', 'Бэлтгэлтэй байх'] },
        { id: 'step-2', title: 'Үндсэн алхам', content: 'Зааврын дагуу үйлдлээ гүйцэтгэнэ.', tips: ['Анхааралтай байх'] },
        { id: 'step-3', title: 'Дүгнэлт', content: 'Үр дүнгээ шалгаж, дахин давтана.', tips: ['Тогтмол давтах'] },
    ],
    tags: [topic.category.toLowerCase(), 'wikihow'],
    isPaid: false,
    sourceUrl: topic.sourceUrl,
});

/**
 * Generate all WikiHow-style lessons using Gemini AI.
 * Returns the generated lessons (not yet saved to Firestore).
 */
export const generateAllWikiHowLessons = async (
    onProgress?: (done: number, total: number, currentTitle: string) => void
): Promise<Partial<Lesson>[]> => {
    const lessons: Partial<Lesson>[] = [];
    const total = WIKIHOW_TOPICS.length;

    for (let i = 0; i < total; i++) {
        const topic = WIKIHOW_TOPICS[i];
        onProgress?.(i, total, topic.title);

        const lesson = await generateLessonFromTopic(topic);
        if (lesson) {
            lessons.push(lesson);
        }

        // Small delay to avoid rate limiting
        if (API_KEY && i < total - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    onProgress?.(total, total, 'Дууссан!');
    return lessons;
};

export const getWikiHowTopicCount = () => WIKIHOW_TOPICS.length;
