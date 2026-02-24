import { useState, useEffect } from 'react'
import { BookOpen, ShieldCheck, LayoutDashboard, Sparkles, Loader2, LogOut, User as UserIcon } from 'lucide-react'
import { Lesson } from './types/lesson'
import { UserData } from './types/user'
import { generateLessonWithAI } from './services/aiService'
import { saveLesson, getAllLessons, seedLessons } from './services/firestoreService'
import { signInAnonymously, signOut, subscribeToAuthChanges } from './services/authService'
import { LessonCard } from './components/LessonCard'
import { LessonView } from './components/LessonView'
import { LandingPage } from './components/LandingPage'
import { AuthPage } from './components/AuthPage'

function App() {
    const [user, setUser] = useState<UserData | null>(null)
    const [view, setView] = useState<'landing' | 'auth' | 'app'>('landing')
    const [activeTab, setActiveTab] = useState<'home' | 'admin'>('home')
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    // Admin Form State
    const [isGenerating, setIsGenerating] = useState(false)
    const [formTitle, setFormTitle] = useState('')
    const [formCategory, setFormCategory] = useState('Technology')
    const [formSummary, setFormSummary] = useState('')
    const [isPaid, setIsPaid] = useState(false)
    const [price, setPrice] = useState(0)

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((userData) => {
            setUser(userData)
            if (userData) {
                setView('app')
            } else {
                setView('landing')
            }
            setIsLoading(false)
        })
        return () => unsubscribe()
    }, [])

    useEffect(() => {
        if (view === 'app') {
            fetchLessons()
        }
    }, [view])

    const fetchLessons = async () => {
        try {
            const data = await getAllLessons()
            setLessons(data)
        } catch (err) {
            console.error("Fetch lessons failed:", err)
        }
    }

    const handleAnonymousSignIn = async () => {
        setIsLoading(true)
        try {
            await signInAnonymously()
        } catch (err) {
            console.error("Anonymous sign in failed:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignOut = async () => {
        try {
            await signOut()
            setView('landing')
        } catch (err) {
            console.error("Sign out failed:", err)
        }
    }

    const handleGenerate = async () => {
        if (!formTitle || !formSummary) return

        setIsGenerating(true)
        try {
            const generatedData = await generateLessonWithAI(formTitle, formCategory, formSummary)
            const newLesson: Partial<Lesson> = {
                ...generatedData,
                author: user?.displayName || 'Anonymous',
                isPaid,
                price: isPaid ? price : 0,
            }

            try {
                const id = await saveLesson(newLesson)
                console.log("Lesson saved with ID:", id)
            } catch (e) {
                console.error("Firestore save failed", e)
            }

            setFormTitle('')
            setFormSummary('')
            fetchLessons()
            setActiveTab('home')
            alert('Хичээл амжилттай үүсгэгдлээ!')
        } catch (err) {
            console.error("Generation failed:", err)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleLessonSelect = (lesson: Lesson) => {
        if (lesson.isPaid) {
            const confirmPurchase = window.confirm(`Энэ хичээл ${lesson.price}₮ үнэтэй байна. Та худалдаж авах уу? (Mock Purchase)`)
            if (!confirmPurchase) return
        }
        setSelectedLesson(lesson)
    }

    const handleSeedData = async () => {
        if (window.confirm("Эхлэлийн өгөгдөл оруулах уу?")) {
            await seedLessons()
            fetchLessons()
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-primary-600" />
            </div>
        )
    }

    if (view === 'landing') {
        return <LandingPage onStart={() => setView('auth')} onTryFree={handleAnonymousSignIn} />
    }

    if (view === 'auth') {
        return <AuthPage onBack={() => setView('landing')} onSuccess={() => setView('app')} />
    }

    if (selectedLesson) {
        return (
            <div className="min-h-screen bg-slate-50">
                <header className="w-full py-6 px-4 md:px-8 border-b border-slate-200 bg-white/50 sticky top-0 z-50 backdrop-blur-md">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setSelectedLesson(null)}>
                            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
                                <BookOpen size={24} />
                            </div>
                            <span className="text-xl font-display font-bold text-slate-900 tracking-tight">Zavri</span>
                        </div>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                    <LessonView lesson={selectedLesson} onBack={() => setSelectedLesson(null)} />
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 selection:bg-primary-100 selection:text-primary-900">
            {/* Header */}
            <header className="w-full py-6 px-4 md:px-8 border-b border-slate-200 bg-white/50 sticky top-0 z-50 backdrop-blur-md">
                <div className="max-w-screen-xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('home')}>
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
                            <BookOpen size={24} />
                        </div>
                        <span className="text-xl font-display font-bold text-slate-900 tracking-tight">Zavri</span>
                    </div>

                    <nav className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={() => setActiveTab('home')}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'home' ? 'bg-primary-50 text-primary-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                        >
                            Нүүр
                        </button>
                        <button
                            onClick={() => setActiveTab('admin')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'admin' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
                        >
                            <LayoutDashboard size={16} />
                            <span>Админ</span>
                        </button>

                        <div className="w-px h-6 bg-slate-200 mx-2"></div>

                        <div className="flex items-center gap-3 pl-2">
                            <div className="hidden md:block text-right">
                                <p className="text-xs font-bold text-slate-900 leading-none">{user?.displayName}</p>
                                <p className="text-[10px] text-slate-400 font-medium mt-1">{user?.xp} XP • {user?.gems} Gem</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </nav>
                </div>
            </header>

            <main className="max-w-screen-xl mx-auto px-6 py-12 md:py-20 min-h-[calc(100vh-200px)]">
                {activeTab === 'home' ? (
                    <div className="animate-fade-in">
                        <div className="mb-16 animate-slide-up">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="px-4 py-1.5 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-widest border border-primary-100">
                                    Knowledge Hub
                                </span>
                                <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                                <span className="text-slate-500 text-sm">Mongolia's Learning Portal</span>
                            </div>

                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold text-slate-950 mb-8 leading-[1.1] tracking-tight">
                                Мэдлэгээ өргөтгөх <br />
                                <span className="text-primary-600">Монгол</span> зааварчилгаа
                            </h1>
                            <p className="text-lg md:text-xl text-slate-500 max-w-2xl leading-relaxed">
                                Мэргэжлийн түвшний заавар, зөвлөгөөг Монгол хэлээр, алхам алхмаар, маш ойлгомжтой суралцаарай.
                            </p>
                        </div>

                        {/* Lessons Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {lessons.map((lesson) => (
                                <LessonCard key={lesson.id} lesson={lesson} onClick={handleLessonSelect} />
                            ))}
                            {lessons.length === 0 && (
                                <div className="col-span-full py-32 text-center">
                                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 text-slate-300 mb-6">
                                        <Loader2 size={40} className="animate-spin" />
                                    </div>
                                    <p className="text-slate-400 font-medium">Хичээлүүдийг ачааллаж байна...</p>
                                    <button
                                        onClick={handleSeedData}
                                        className="mt-4 text-xs font-bold text-primary-600 hover:underline"
                                    >
                                        Эхлэлийн өгөгдөл оруулах
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="animate-fade-in">
                        <div className="mb-12">
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-950 tracking-tight">Админ Самвар</h2>
                            <p className="text-slate-500 mt-2">Хичээл үүсгэх болон удирдах хэсэг</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* AI Lesson Generator Tool */}
                            <div className="lg:col-span-2 bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-purple-50 rounded-full blur-3xl opacity-50"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner">
                                            <Sparkles size={28} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900">AI Хичээл Үүсгэгч</h3>
                                            <p className="text-slate-500">Сэдвийн мэдээллийг оруулснаар AI автоматаар үүсгэнэ.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Хичээлийн нэр</label>
                                                <input
                                                    type="text"
                                                    value={formTitle}
                                                    onChange={(e) => setFormTitle(e.target.value)}
                                                    placeholder="ж: Фэйсбүүк хаяг нээх"
                                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-slate-50/30"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Төрөл</label>
                                                <select
                                                    value={formCategory}
                                                    onChange={(e) => setFormCategory(e.target.value)}
                                                    className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-slate-50/30 appearance-none cursor-pointer"
                                                >
                                                    <option>Technology</option>
                                                    <option>Cooking</option>
                                                    <option>Lifestyle</option>
                                                    <option>Education</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Хичээлийн тухай товч мэдээлэл</label>
                                            <textarea
                                                rows={4}
                                                value={formSummary}
                                                onChange={(e) => setFormSummary(e.target.value)}
                                                placeholder="Хичээлийн гол зорилго болон агуулгыг бичнэ үү..."
                                                className="w-full px-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-slate-50/30"
                                            ></textarea>
                                        </div>

                                        <div className="p-6 bg-slate-50/50 rounded-3xl border border-slate-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isPaid}
                                                        onChange={(e) => setIsPaid(e.target.checked)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                                </div>
                                                <div className="text-sm">
                                                    <label className="font-bold text-slate-900">Төлбөртэй хичээл</label>
                                                    <p className="text-slate-500 text-xs">Сонгосон тохиолдолд үнэ оруулах шаардлагатай.</p>
                                                </div>
                                            </div>
                                            {isPaid && (
                                                <div className="flex items-center gap-2 animate-fade-in">
                                                    <input
                                                        type="number"
                                                        value={price}
                                                        onChange={(e) => setPrice(Number(e.target.value))}
                                                        placeholder="0"
                                                        className="w-28 px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white font-bold text-right"
                                                    />
                                                    <span className="font-bold text-slate-900">₮</span>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating || !formTitle}
                                            className="w-full py-5 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <Loader2 size={24} className="animate-spin text-primary-400" />
                                                    <span>AI Төлөвлөж байна...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles size={24} className="text-purple-400" />
                                                    <span>AI-аар үүсгэх</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Card */}
                            <div className="space-y-6">
                                <div className="bg-primary-600 text-white p-10 rounded-[2.5rem] shadow-2xl shadow-primary-200 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                                    <div className="relative z-10">
                                        <h4 className="text-xs font-bold uppercase tracking-widest opacity-70 mb-8">Нийт хичээл</h4>
                                        <div className="flex items-end gap-3">
                                            <span className="text-7xl font-display font-black leading-none">{lessons.length}</span>
                                            <span className="text-sm font-bold opacity-70 mb-2">ШИРХЭГ</span>
                                        </div>
                                    </div>
                                    <BookOpen className="absolute -bottom-8 -right-8 opacity-10" size={160} />
                                </div>
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8 px-1">Системийн төлөв</h4>
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 text-slate-900 font-bold">
                                                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center">
                                                    <ShieldCheck size={18} />
                                                </div>
                                                <span>Firestore</span>
                                            </div>
                                            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest bg-green-50 px-2 py-1 rounded-md">Холбогдсон</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                            <div className="bg-green-500 h-full w-[95%] rounded-full shadow-[0_0_10px_rgba(34,197,94,0.3)]"></div>
                                        </div>
                                        <button
                                            onClick={handleSeedData}
                                            className="w-full py-3 bg-slate-50 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-primary-100"
                                        >
                                            Дата Шинэчлэх (Seed)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 py-16 px-6 bg-white">
                <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                            <BookOpen size={16} />
                        </div>
                        <span className="text-slate-400 text-sm font-medium tracking-tight">
                            &copy; 2024 Zavri - Мэдлэг түгээх гарц
                        </span>
                    </div>
                    <div className="flex gap-8 text-slate-400 text-sm font-bold">
                        <a href="#" className="hover:text-primary-600 transition-colors">Бидний тухай</a>
                        <a href="#" className="hover:text-primary-600 transition-colors">Тусламж</a>
                        <a href="#" className="hover:text-primary-600 transition-colors">Нууцлал</a>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default App
