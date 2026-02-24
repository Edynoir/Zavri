import React from 'react';
import { CreditCard, Sparkles, Clock, User } from 'lucide-react';
import { Lesson } from '../types/lesson';

interface LessonCardProps {
    lesson: Lesson;
    onClick: (lesson: Lesson) => void;
}

export const LessonCard: React.FC<LessonCardProps> = ({ lesson, onClick }) => {
    return (
        <div
            onClick={() => onClick(lesson)}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:shadow-slate-300/50 dark:hover:bg-slate-800/80 transition-all cursor-pointer group animate-slide-up"
        >
            <div className="h-48 bg-slate-50 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden text-slate-200 dark:text-slate-700">
                {lesson.thumbnailUrl ? (
                    <img src={lesson.thumbnailUrl} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                        <Sparkles className="current" size={48} />
                    </div>
                )}
                {lesson.isPaid && (
                    <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-sm text-slate-900 dark:text-white text-[10px] font-bold px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                        <CreditCard size={12} className="text-primary-500" />
                        {lesson.price ? `${lesson.price}₮` : 'PAID'}
                    </div>
                )}
            </div>
            <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                    <span className="px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-[10px] font-bold uppercase tracking-widest border border-primary-100 dark:border-primary-900/30">
                        {lesson.category}
                    </span>
                </div>
                <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2 leading-tight">
                    {lesson.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                    {lesson.summary}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800 text-[10px] font-medium text-slate-400 dark:text-slate-500">
                    <div className="flex items-center gap-1.5">
                        <User size={12} />
                        {lesson.author}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        {new Date(lesson.createdAt).toLocaleDateString()}
                    </div>
                </div>
            </div>
        </div>
    );
};
