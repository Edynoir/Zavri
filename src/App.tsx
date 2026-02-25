import { useState, useEffect } from 'react'
import { BookOpen, ShieldCheck, LayoutDashboard, Sparkles, Loader2, LogOut, User as UserIcon, Settings, Moon, Sun, X, Pencil, Trash2, Globe, Check, Download } from 'lucide-react'
import { Lesson } from './types/lesson'
import { UserData } from './types/user'
import { generateLessonWithAI } from './services/aiService'
import { saveLessonIfNotDuplicate, getAllLessons, seedLessons, updateLesson, deleteLesson, bulkSaveLessons } from './services/firestoreService'
import { signInAnonymously, signOut, subscribeToAuthChanges } from './services/authService'
import { LessonCard } from './components/LessonCard'
import { LessonView } from './components/LessonView'
import { LandingPage } from './components/LandingPage'
import { AuthPage } from './components/AuthPage'
import { generateAllWikiHowLessons, getWikiHowTopicCount } from './services/wikiHowService'

function App() {
    const [user, setUser] = useState<UserData | null>(null)
    const [view, setView] = useState<'landing' | 'auth' | 'app'>('landing')
    const [activeTab, setActiveTab] = useState<'home' | 'admin'>('home')
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [globalError, setGlobalError] = useState<string | null>(null)

    // UI State
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    })
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // Admin Form State
    const [isGenerating, setIsGenerating] = useState(false)
    const [formTitle, setFormTitle] = useState('')
    const [formCategory, setFormCategory] = useState('Technology')
    const [formSummary, setFormSummary] = useState('')
    const [isPaid, setIsPaid] = useState(false)
    const [price, setPrice] = useState(0)

    // Admin Lesson Management State
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
    const [editTitle, setEditTitle] = useState('')
    const [editSummary, setEditSummary] = useState('')
    const [editCategory, setEditCategory] = useState('')
    const [isImporting, setIsImporting] = useState(false)
    const [importProgress, setImportProgress] = useState('')

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            document.documentElement.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, [darkMode])

    useEffect(() => {
        const unsubscribe = subscribeToAuthChanges((userData) => {
            setUser(userData)
            if (userData) {
                setView('app')
            } else {
                if (view !== 'auth') setView('landing')
            }
            setIsLoading(false)
        })
        return () => unsubscribe()
    }, [view])

    useEffect(() => {
        if (view === 'app') {
            fetchLessons()
        }
    }, [view])

    const fetchLessons = async () => {
        try {
            setGlobalError(null)
            const data = await getAllLessons()
            setLessons(data)
        } catch (err: any) {
            console.error("Fetch lessons failed:", err)
            if (err.message.includes('permission denied')) {
                setGlobalError('Мэдээлэл авахад алдаа гарлаа (Firestore permission denied). Та Firebase Console дээрх аюулгүй байдлын дүрмээ шалгана уу.')
            }
        }
    }

    const handleAnonymousSignIn = async () => {
        setIsLoading(true)
        setGlobalError(null)
        try {
            await signInAnonymously()
        } catch (err: any) {
            console.error("Anonymous sign in failed:", err)
            if (err.code === 'permission-denied' || err.message?.includes('permission denied')) {
                setGlobalError('Нэвтрэхэд алдаа гарлаа (Firestore permission denied).')
            }
        } finally {
            setIsLoading(false)
        }
    }

    const handleSignOut = async () => {
        try {
            await signOut()
            setView('landing')
            setGlobalError(null)
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
                const id = await saveLessonIfNotDuplicate(newLesson)
                if (id) {
                    console.log("Lesson saved with ID:", id)
                } else {
                    alert('Ижил нэртэй хичээл аль хэдийн байна!')
                    return
                }
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

    const handleEditLesson = (lesson: Lesson) => {
        setEditingLesson(lesson)
        setEditTitle(lesson.title)
        setEditSummary(lesson.summary)
        setEditCategory(lesson.category)
    }

    const handleSaveEdit = async () => {
        if (!editingLesson) return
        try {
            await updateLesson(editingLesson.id, {
                title: editTitle,
                summary: editSummary,
                category: editCategory,
            })
            setEditingLesson(null)
            fetchLessons()
        } catch (e) {
            console.error('Edit failed:', e)
        }
    }

    const handleDeleteLesson = async (id: string, title: string) => {
        if (!window.confirm(`"${title}" хичээлийг устгах уу?`)) return
        try {
            await deleteLesson(id)
            fetchLessons()
        } catch (e) {
            console.error('Delete failed:', e)
        }
    }

    const handleWikiHowImport = async () => {
        if (!window.confirm(`WikiHow-оос ${getWikiHowTopicCount()} хичээл татах уу? (AI-аар Монгол хэл рүү орчуулна)`)) return
        setIsImporting(true)
        setImportProgress('Эхлүүлж байна...')
        try {
            const lessons = await generateAllWikiHowLessons((done, total, title) => {
                setImportProgress(`${done}/${total}: ${title}`)
            })
            setImportProgress('Firestore-д хадгалж байна...')
            const saved = await bulkSaveLessons(lessons, (done, total) => {
                setImportProgress(`Хадгалж байна: ${done}/${total}`)
            })
            setImportProgress('')
            fetchLessons()
            alert(`${saved} шинэ хичээл амжилттай нэмэгдлээ!`)
        } catch (e) {
            console.error('WikiHow import failed:', e)
            alert('Импорт амжилтгүй боллоо.')
        } finally {
            setIsImporting(false)
            setImportProgress('')
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
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-primary-600" />
            </div>
        )
    }

    const SettingsPanel = () => (
        <div className={`fixed inset-0 z-[100] transition-all duration-500 ${isSettingsOpen ? 'visible' : 'invisible'}`}>
            <div
                className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500 ${isSettingsOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={() => setIsSettingsOpen(false)}
            />
            <div className={`absolute right-0 top-0 h-full w-full max-w-sm bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-500 ease-out transform ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-8 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-12">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-900 dark:text-white">
                                <Settings size={20} />
                            </div>
                            <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">Тохиргоо</h3>
                        </div>
                        <button
                            onClick={() => setIsSettingsOpen(false)}
                            className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-8 flex-1">
                        <div className="space-y-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Харагдац</h4>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${darkMode ? 'bg-primary-900/30 text-primary-400' : 'bg-yellow-50 text-yellow-600'}`}>
                                            {darkMode ? <Moon size={24} /> : <Sun size={24} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white">Харанхуй горим</p>
                                            <p className="text-xs text-slate-500">{darkMode ? 'Асаалттай' : 'Унтраастай'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setDarkMode(!darkMode)}
                                        className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${darkMode ? 'bg-primary-600' : 'bg-slate-200'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Хэрэглэгч</h4>
                            <div className="flex items-center gap-4 p-4 rounded-3xl border border-slate-100 dark:border-slate-800">
                                <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center font-black text-xl">
                                    {user?.displayName?.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 dark:text-white">{user?.displayName}</p>
                                    <p className="text-xs text-slate-500">{user?.email}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="w-full py-4 mt-auto bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all"
                    >
                        <LogOut size={20} />
                        Системээс гарах
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen transition-colors duration-500 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 selection:bg-primary-100">
            {view === 'landing' ? (
                <LandingPage
                    onStart={() => setView('auth')}
                    onTryFree={() => setView('auth')}
                    darkMode={darkMode}
                    onToggleTheme={() => setDarkMode(!darkMode)}
                />
            ) : view === 'auth' ? (
                <AuthPage
                    onBack={() => setView('landing')}
                    onSuccess={() => setView('app')}
                    darkMode={darkMode}
                    onToggleTheme={() => setDarkMode(!darkMode)}
                />
            ) : (
                <>
                    <SettingsPanel />

                    {/* Header */}
                    <header className="w-full py-6 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-800/50 sticky top-0 z-50 backdrop-blur-md">
                        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('home')}>
                                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
                                    <BookOpen size={24} />
                                </div>
                                <span className="text-xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Zavri</span>
                            </div>

                            <nav className="flex items-center gap-2 md:gap-4">
                                <button
                                    onClick={() => setActiveTab('home')}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'home' ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                                >
                                    Нүүр
                                </button>
                                {user?.isAdmin && (
                                    <button
                                        onClick={() => setActiveTab('admin')}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'admin' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        <LayoutDashboard size={16} />
                                        <span>Админ</span>
                                    </button>
                                )}

                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2"></div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                                        title="Тохиргоо"
                                    >
                                        <Settings size={18} />
                                    </button>
                                    <div className="hidden md:flex items-center gap-3 pl-2">
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{user?.displayName}</p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">{user?.xp} XP • {user?.gems} Gem</p>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
                                            {user?.displayName?.charAt(0)}
                                        </div>
                                    </div>
                                </div>
                            </nav>
                        </div>
                    </header>

                    <main className="max-w-screen-xl mx-auto px-6 py-12 md:py-20 min-h-[calc(100vh-200px)]">
                        {selectedLesson ? (
                            <LessonView lesson={selectedLesson} onBack={() => setSelectedLesson(null)} />
                        ) : activeTab === 'home' ? (
                            <div className="animate-fade-in text-slate-900 dark:text-white">
                                <div className="mb-16 animate-slide-up">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-bold uppercase tracking-widest border border-primary-100 dark:border-primary-900/30">
                                            Knowledge Hub
                                        </span>
                                        <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Mongolia's Learning Portal</span>
                                    </div>

                                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold mb-8 leading-[1.1] tracking-tight">
                                        Мэдлэгээ өргөтгөх <br />
                                        <span className="text-primary-600 dark:text-primary-500">Монгол</span> зааварчилгаа
                                    </h1>
                                    <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
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
                                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700 mb-6">
                                                <Loader2 size={40} className="animate-spin" />
                                            </div>
                                            <p className="text-slate-400 dark:text-slate-600 font-medium">Хичээлүүдийг ачааллаж байна...</p>
                                            <button
                                                onClick={handleSeedData}
                                                className="mt-4 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
                                            >
                                                Эхлэлийн өгөгдөл оруулах
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : user?.isAdmin ? (
                            <div className="animate-fade-in text-slate-900 dark:text-white">
                                <div className="mb-12">
                                    <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">Админ Самвар</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2">Хичээл үүсгэх болон удирдах хэсэг</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* AI Lesson Generator Tool */}
                                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none relative overflow-hidden">
                                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-purple-50 dark:bg-purple-900/10 rounded-full blur-3xl opacity-50"></div>

                                        <div className="relative z-10">
                                            <div className="flex items-center gap-4 mb-8">
                                                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center shadow-inner">
                                                    <Sparkles size={28} />
                                                </div>
                                                <div>
                                                    <h3 className="text-2xl font-bold">AI Хичээл Үүсгэгч</h3>
                                                    <p className="text-slate-500 dark:text-slate-400">Сэдвийн мэдээллийг оруулснаар AI автоматаар үүсгэнэ.</p>
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Хичээлийн нэр</label>
                                                        <input
                                                            type="text"
                                                            value={formTitle}
                                                            onChange={(e) => setFormTitle(e.target.value)}
                                                            placeholder="ж: Фэйсбүүк хаяг нээх"
                                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-slate-50/30 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Төрөл</label>
                                                        <select
                                                            value={formCategory}
                                                            onChange={(e) => setFormCategory(e.target.value)}
                                                            className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-slate-50/30 dark:bg-slate-800/50 text-slate-900 dark:text-white appearance-none cursor-pointer"
                                                        >
                                                            <option>Technology</option>
                                                            <option>Cooking</option>
                                                            <option>Lifestyle</option>
                                                            <option>Education</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Хичээлийн тухай товч мэдээлэл</label>
                                                    <textarea
                                                        rows={4}
                                                        value={formSummary}
                                                        onChange={(e) => setFormSummary(e.target.value)}
                                                        placeholder="Хичээлийн гол зорилго болон агуулгыг бичнэ үү..."
                                                        className="w-full px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-slate-50/30 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                                                    ></textarea>
                                                </div>

                                                <div className="p-6 bg-slate-50/50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={isPaid}
                                                                onChange={(e) => setIsPaid(e.target.checked)}
                                                                className="sr-only peer"
                                                            />
                                                            <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                                        </div>
                                                        <div className="text-sm">
                                                            <label className="font-bold">Төлбөртэй хичээл</label>
                                                            <p className="text-slate-500 dark:text-slate-400 text-xs">Сонгосон тохиолдолд үнэ оруулах шаардлагатай.</p>
                                                        </div>
                                                    </div>
                                                    {isPaid && (
                                                        <div className="flex items-center gap-2 animate-fade-in">
                                                            <input
                                                                type="number"
                                                                value={price}
                                                                onChange={(e) => setPrice(Number(e.target.value))}
                                                                placeholder="0"
                                                                className="w-28 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white dark:bg-slate-800 font-bold text-right"
                                                            />
                                                            <span className="font-bold">₮</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={handleGenerate}
                                                    disabled={isGenerating || !formTitle}
                                                    className="w-full py-5 bg-slate-950 dark:bg-white hover:bg-slate-900 dark:hover:bg-slate-100 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white dark:text-slate-900 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-[0.98]"
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

                                    {/* Stats & Actions Card */}
                                    <div className="space-y-6">
                                        <div className="bg-primary-600 text-white p-10 rounded-[2.5rem] shadow-2xl shadow-primary-200 dark:shadow-none relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700"></div>
                                            <div className="relative z-10">
                                                <h4 className="text-xs font-bold uppercase tracking-widest opacity-70 mb-8">Нийт хичээл</h4>
                                                <div className="flex items-end gap-3">
                                                    <span className="text-7xl font-display font-black leading-none">{lessons.length}</span>
                                                    <span className="text-sm font-bold opacity-70 mb-2 font-display">ШИРХЭГ</span>
                                                </div>
                                            </div>
                                            <BookOpen className="absolute -bottom-8 -right-8 opacity-10" size={160} />
                                        </div>

                                        {/* WikiHow Import Button */}
                                        <button
                                            onClick={handleWikiHowImport}
                                            disabled={isImporting}
                                            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 text-white rounded-[1.5rem] font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-200 dark:shadow-none active:scale-[0.98]"
                                        >
                                            {isImporting ? (
                                                <>
                                                    <Loader2 size={22} className="animate-spin" />
                                                    <span className="text-sm">Импорт хийж байна...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Globe size={22} />
                                                    <span>WikiHow хичээл оруулах ({getWikiHowTopicCount()})</span>
                                                </>
                                            )}
                                        </button>
                                        {importProgress && (
                                            <div className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                                                {importProgress}
                                            </div>
                                        )}

                                        <button
                                            onClick={handleSeedData}
                                            className="w-full py-3 bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl text-xs font-bold transition-all border border-transparent hover:border-primary-100 dark:hover:border-primary-900/40"
                                        >
                                            Дата Шинэчлэх (Seed)
                                        </button>
                                    </div>
                                </div>

                                {/* Lesson Management List */}
                                <div className="mt-12">
                                    <h3 className="text-xl font-bold mb-6">Хичээлийн жагсаалт</h3>
                                    <div className="space-y-3">
                                        {lessons.map(lesson => (
                                            <div key={lesson.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
                                                {editingLesson?.id === lesson.id ? (
                                                    <div className="flex-1 space-y-2">
                                                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
                                                        <input value={editSummary} onChange={e => setEditSummary(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
                                                        <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm">
                                                            <option>Technology</option><option>Cooking</option><option>Lifestyle</option><option>Education</option><option>Health</option><option>Finance</option>
                                                        </select>
                                                        <div className="flex gap-2 mt-2">
                                                            <button onClick={handleSaveEdit} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"><Check size={14} /> Хадгалах</button>
                                                            <button onClick={() => setEditingLesson(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold">Цуцлах</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm truncate">{lesson.title}</p>
                                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{lesson.category} • {lesson.steps?.length || 0} алхам{lesson.sourceUrl ? ' • WikiHow' : ''}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button onClick={() => handleEditLesson(lesson)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center justify-center transition-all" title="Засах">
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button onClick={() => handleDeleteLesson(lesson.id, lesson.title)} className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all" title="Устгах">
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                        {lessons.length === 0 && (
                                            <p className="text-center text-slate-400 py-8 text-sm">Хичээл байхгүй байна.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20">
                                <ShieldCheck size={48} className="text-slate-300 mb-4" />
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Хандах эрхгүй</h2>
                                <p className="text-slate-500">Та энэ хэсэгт хандах эрхгүй байна.</p>
                                <button
                                    onClick={() => setActiveTab('home')}
                                    className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-xl font-bold"
                                >
                                    Нүүр хуудас руу буцах
                                </button>
                            </div>
                        )}
                    </main>

                    {/* Footer */}
                    <footer className="border-t border-slate-200 dark:border-slate-800 py-16 px-6 bg-white dark:bg-slate-800">
                        <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-600">
                                    <BookOpen size={16} />
                                </div>
                                <span className="text-slate-400 dark:text-slate-500 text-sm font-medium tracking-tight">
                                    &copy; 2024 Zavri - Мэдлэг түгээх гарц
                                </span>
                            </div>
                            <div className="flex gap-8 text-slate-400 dark:text-slate-500 text-sm font-bold">
                                <a href="#" className="hover:text-primary-600 transition-colors">Бидний тухай</a>
                                <a href="#" className="hover:text-primary-600 transition-colors">Тусламж</a>
                                <a href="#" className="hover:text-primary-600 transition-colors">Нууцлал</a>
                            </div>
                        </div>
                    </footer>
                </>
            )}
        </div>
    )
}

export default App
