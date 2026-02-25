import React, { useEffect, useState } from 'react';
import { ChevronLeft, Info, HelpCircle, ArrowRight } from 'lucide-react';
import { Lesson } from '../types/lesson';

interface LessonViewProps {
    lesson: Lesson;
    onBack: () => void;
}

export const LessonView: React.FC<LessonViewProps> = ({ lesson, onBack }) => {
    const [scrollPercent, setScrollPercent] = useState(0);

    useEffect(() => {
        window.scrollTo(0, 0);

        const handleScroll = () => {
            const h = document.documentElement;
            const b = document.body;
            const st = 'scrollTop';
            const sh = 'scrollHeight';
            const percent = (h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100;
            setScrollPercent(percent);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="animate-fade-in text-slate-900 dark:text-white">
            {/* Scroll Progress Indicator */}
            <div
                className="fixed top-0 left-0 h-1 bg-primary-500 z-[60] transition-all duration-150"
                style={{ width: `${scrollPercent}%` }}
            ></div>

            <button
                onClick={onBack}
                className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8 font-medium group"
            >
                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                Буцах
            </button>

            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-12 animate-slide-up">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-bold uppercase tracking-widest border border-primary-100 dark:border-primary-900/30">
                            {lesson.category}
                        </span>
                        <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">{new Date(lesson.createdAt).toLocaleDateString('mn-MN', { year: 'numeric', month: 'long' })}</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-6xl font-display font-extrabold mb-6 sm:mb-8 leading-[1.15]">
                        {lesson.title}
                    </h1>
                    <div className="flex flex-wrap gap-2 mb-10">
                        {lesson.tags.map(tag => (
                            <span key={tag} className="tag-badge px-3 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-medium">#{tag}</span>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="relative mb-12 sm:mb-16 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="absolute -top-3 -left-3 sm:-top-4 sm:-left-4 w-10 h-10 sm:w-12 sm:h-12 bg-primary-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <Info size={20} className="sm:w-6 sm:h-6" />
                    </div>
                    <p className="text-base sm:text-lg md:text-xl text-slate-600 dark:text-slate-400 italic leading-relaxed">
                        {lesson.summary}
                    </p>
                </div>

                {/* Steps */}
                <div className="content-section animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <h2 className="!mb-12 dark:text-white">Хичээлийн алхмууд</h2>

                    <div className="space-y-16">
                        {lesson.steps.map((step, index) => (
                            <div key={step.id} className="group">
                                <h3 className="flex items-center gap-4 dark:text-white">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    {step.title}
                                </h3>
                                <p className="pl-10 sm:pl-12 text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                                    {step.content}
                                </p>

                                {step.imageUrl && (
                                    <div className="ml-10 sm:ml-12 mt-6 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <img src={step.imageUrl} alt={step.title} className="w-full h-auto object-cover max-h-[400px]" />
                                    </div>
                                )}

                                {step.tips && step.tips.length > 0 && (
                                    <div className="ml-10 sm:ml-12 mt-6 bg-slate-50 dark:bg-slate-800/50 border-l-4 border-primary-400 p-6 sm:p-8 rounded-r-2xl">
                                        <h4 className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                                            <HelpCircle size={16} className="text-primary-500" />
                                            Зөвлөгөө
                                        </h4>
                                        <ul className="space-y-3 !pl-0">
                                            {step.tips.map((tip, i) => (
                                                <li key={i} className="list-none flex items-start gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                                                    <ArrowRight size={14} className="mt-1 flex-shrink-0 text-primary-300 dark:text-primary-700" />
                                                    {tip}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Final Remark */}
                <div className="mt-24 pt-12 border-t border-slate-200 dark:border-slate-800 text-center animate-slide-up">
                    <p className="text-xl text-slate-800 dark:text-white font-medium mb-8">
                        Баяр хүргэе! Та хичээлийг амжилттай судалж дууслаа.
                    </p>
                    <div className="p-8 bg-primary-50 dark:bg-primary-900/10 rounded-[2rem] flex flex-col items-center">
                        <p className="text-primary-900 dark:text-primary-400 font-bold text-lg mb-6">Одоо та дараагийн хичээл рүүгээ шилжихэд бэлэн боллоо.</p>
                        <button
                            onClick={onBack}
                            className="px-10 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary-500/25 active:scale-95 flex items-center gap-2"
                        >
                            Дараагийн хичээл рүү буцах
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
