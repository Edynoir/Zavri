import { useState, useEffect } from 'react'
import { LayoutDashboard, Settings, LogOut, Check, Pencil, Trash2, Globe, Sparkles, Loader2, BookOpen, AlertCircle, ShieldAlert, X, Moon, Sun, User } from 'lucide-react'
import { Lesson } from './types/lesson'
import { UserData, UserRole } from './types/user'
import { generateLessonWithAI } from './services/aiService'
import { saveLesson, getAllLessons, updateLesson, deleteLesson, seedLessons, getUserData, saveUserData, reportLesson, getReportedLessons, updateReportStatus, saveLessonIfNotDuplicate, bulkSaveLessons, getAllUsers, updateUserRole } from './services/firestoreService'
import { signInAnonymously, signOut, subscribeToAuthChanges } from './services/authService'
import { LessonCard } from './components/LessonCard'
import { LessonView } from './components/LessonView'
import { LandingPage } from './components/LandingPage'
import { AuthPage } from './components/AuthPage'
import { generateAllWikiHowLessons, getWikiHowTopicCount } from './services/wikiHowService'
import { Modal, ModalProvider } from './components/Modal'

function App() {
    const [user, setUser] = useState<UserData | null>(null)
    const [view, setView] = useState<'landing' | 'auth' | 'app'>('landing')
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
    const [activeTab, setActiveTab] = useState<'home' | 'admin' | 'moderation'>('home')
    const [reports, setReports] = useState<any[]>([])
    const [isReporting, setIsReporting] = useState(false)
    const [lessons, setLessons] = useState<Lesson[]>([])
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [globalError, setGlobalError] = useState<string | null>(null)

    // Theme state — reads from localStorage on init
    const [darkMode, setDarkMode] = useState<boolean>(() => {
        const stored = localStorage.getItem('theme')
        if (stored === 'dark') return true
        if (stored === 'light') return false
        return window.matchMedia('(prefers-color-scheme: dark)').matches
    })
    const [isSettingsOpen, setIsSettingsOpen] = useState(false)

    // Apply / remove .dark class on <html> whenever darkMode changes
    useEffect(() => {
        const root = document.documentElement
        if (darkMode) {
            root.classList.add('dark')
            localStorage.setItem('theme', 'dark')
        } else {
            root.classList.remove('dark')
            localStorage.setItem('theme', 'light')
        }
    }, [darkMode])

    const toggleTheme = () => setDarkMode(prev => !prev)

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

    // Admin User Management State
    const [allUsers, setAllUsers] = useState<UserData[]>([])
    const [isUsersLoading, setIsUsersLoading] = useState(false)


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
            const isAdmin = user?.role === 'admin' || user?.isAdmin === true || user?.admin === true;
            if (activeTab === 'admin' && isAdmin) {
                fetchUsers()
                fetchReports()
            }
            if (activeTab === 'moderation') {
                fetchReports()
            }
        }
    }, [view, activeTab, user])

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

    const fetchUsers = async () => {
        const isAdmin = user?.role === 'admin' || user?.isAdmin === true || user?.admin === true;
        if (!isAdmin) return;
        setIsUsersLoading(true)
        try {
            const users = await getAllUsers()
            setAllUsers(users)
        } catch (err) {
            console.error("Fetch users failed:", err)
        } finally {
            setIsUsersLoading(false)
        }
    }

    const handleRoleChange = async (uid: string, newRole: UserRole) => {
        try {
            await updateUserRole(uid, newRole)
            await Modal.success("Хэрэглэгчийн эрх амжилттай солигдлоо.")
            fetchUsers()
        } catch (err) {
            console.error("Role update failed:", err)
            await Modal.error("Эрх солиход алдаа гарлаа.")
        }
    }

    const handleAnonymousSignIn = async () => {
        setIsLoading(true)
        setGlobalError(null)
        try {
            const userData = await signInAnonymously()
            if (userData) {
                setUser(userData)
                setView('app')
            }
        } catch (err: any) {
            console.error('Anonymous sign in failed:', err)
            let errorMessage = err.message || 'Нэвтрэхэд алдаа гарлаа.'
            if (err.code === 'auth/admin-restricted-operation' || errorMessage.includes('admin-restricted-operation')) {
                errorMessage = 'Firebase Console дээр "Anonymous" нэвтрэх эрхийг идэвхжүүлнэ үү. (Authentication > Sign-in method > Anonymous)'
            } else if (err.code === 'permission-denied' || errorMessage.includes('permission denied')) {
                errorMessage = 'Firestore хандах эрхгүй байна. Хамгаалалтын дүрмээ шалгана уу.'
            }
            setGlobalError(errorMessage)
            await Modal.error(errorMessage, 'Нэвтрэхэд алдаа гарлаа')
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
                authorId: user?.uid || '',
                isPaid,
                price: isPaid ? price : 0,
            }
            try {
                const id = await saveLessonIfNotDuplicate(newLesson)
                if (id) {
                    console.log('Lesson saved with ID:', id)
                } else {
                    await Modal.alert('Ижил нэртэй хичээл аль хэдийн байна!', 'Давхардал')
                    return
                }
            } catch (e) {
                console.error('Firestore save failed', e)
            }
            setFormTitle('')
            setFormSummary('')
            fetchLessons()
            setActiveTab('home')
            await Modal.success('Хичээл амжилттай үүсгэгдлээ!')
        } catch (err) {
            console.error('Generation failed:', err)
            await Modal.error('Хичээл үүсгэхэд алдаа гарлаа. Дахин оролдоно уу.')
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
        const confirmed = await Modal.confirm(`"${title}" хичээлийг устгах уу?`, {
            title: 'Хичээл устгах',
            confirmLabel: 'Устгах',
            cancelLabel: 'Цуцлах',
            isDangerous: true,
        })
        if (!confirmed) return
        try {
            await deleteLesson(id)
            fetchLessons()
        } catch (e) {
            console.error('Delete failed:', e)
            await Modal.error('Устгахад алдаа гарлаа.')
        }
    }

    const handleWikiHowImport = async () => {
        const confirmed = await Modal.confirm(
            `WikiHow-оос ${getWikiHowTopicCount()} хичээл татах уу? (AI-аар Монгол хэл рүү орчуулна)`,
            { title: 'WikiHow Импорт', confirmLabel: 'Татах', cancelLabel: 'Болих' }
        )
        if (!confirmed) return
        setIsImporting(true)
        setImportProgress('Эхлүүлж байна...')
        try {
            const fetchedLessons = await generateAllWikiHowLessons((done, total, title) => {
                setImportProgress(`${done}/${total}: ${title}`)
            })
            setImportProgress('Firestore-д хадгалж байна...')
            const saved = await bulkSaveLessons(fetchedLessons, (done, total) => {
                setImportProgress(`Хадгалж байна: ${done}/${total}`)
            })
            setImportProgress('')
            fetchLessons()
            await Modal.success(`${saved} шинэ хичээл амжилттай нэмэгдлээ!`)
        } catch (e) {
            console.error('WikiHow import failed:', e)
            await Modal.error('Импорт амжилтгүй боллоо.')
        } finally {
            setIsImporting(false)
            setImportProgress('')
        }
    }

    const handleLessonSelect = (lesson: Lesson, index?: number) => {
        if (user?.isAnonymous && index !== undefined && index >= 10) {
            Modal.alert('Энэ хичээл түгжигдсэн байна. Та 5,000₮-өөр төлөвлөгөөгөө ахиулж бүх хичээлийг үзээрэй.', 'Хичээл түгжигдсэн')
            return
        }
        if (lesson.isPaid) {
            Modal.confirm(`Энэ хичээл ${lesson.price}₮ үнэтэй байна. Та худалдаж авах уу?`, {
                title: 'Төлбөртэй хичээл',
                confirmLabel: 'Худалдаж авах',
                cancelLabel: 'Болих',
            }).then(confirmed => {
                if (confirmed) setSelectedLesson(lesson)
            })
            return
        }
        setSelectedLesson(lesson)
    }

    const handleSeedData = async () => {
        const confirmed = await Modal.confirm('Эхлэлийн өгөгдөл оруулах уу?', { title: 'Seed Data' })
        if (confirmed) {
            await seedLessons()
            fetchLessons()
        }
    }

    const handleReport = async (lessonId: string) => {
        const reason = await Modal.prompt('Яагаад энэ хичээлийг мэдээлэх гэж байна вэ?', {
            title: 'Хичээл мэдээлэх',
            placeholder: 'Шалтгаанаа бичнэ үү...',
            confirmLabel: 'Илгээх',
        })
        if (!reason || !user) return
        try {
            await reportLesson(lessonId, user.uid, reason)
            await Modal.success('Амжилттай мэдээллээ. Бид шалгах болно.')
        } catch (e: any) {
            await Modal.error('Мэдээлэхэд алдаа гарлаа: ' + e.message)
        }
    }


    const fetchReports = async () => {
        try {
            const data = await getReportedLessons();
            setReports(data);
        } catch (e: any) {
            await Modal.error('Мэдээллүүдийг татахад алдаа гарлаа: ' + e.message);
        }
    }

    const handleUpdateReport = async (reportId: string, status: 'approved' | 'declined') => {
        try {
            await updateReportStatus(reportId, status)
            fetchReports()
            await Modal.success(`Амжилттай ${status === 'approved' ? 'зөвшөөрлөө' : 'татгалзлаа'}.`)
        } catch (e: any) {
            await Modal.error('Алдаа гарлаа: ' + e.message)
        }
    }

    useEffect(() => {
        if (activeTab === 'moderation') {
            fetchReports();
        }
    }, [activeTab]);

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
            <div className={`absolute right-0 top-0 h-full w-full sm:max-w-sm bg-slate-50 dark:bg-slate-900 shadow-2xl transition-transform duration-500 ease-out transform ${isSettingsOpen ? 'translate-x-0' : 'translate-x-full'}`}>
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

                            <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${darkMode ? 'bg-primary-900/30 text-primary-400' : 'bg-yellow-50 text-yellow-500'}`}>
                                            {darkMode ? <Moon size={24} /> : <Sun size={24} />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-slate-50">Харанхуй горим</p>
                                            <p className="text-xs text-slate-500">{darkMode ? 'Асаалттай' : 'Унтраастай'}</p>
                                        </div>
                                    </div>
                                    {/* Theme Toggle Button */}
                                    <button
                                        onClick={toggleTheme}
                                        aria-label="Toggle theme"
                                        className={`relative w-14 h-8 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${darkMode ? 'bg-primary-600' : 'bg-slate-300'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
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
                                    <p className="font-bold text-slate-900 dark:text-slate-50">{user?.displayName}</p>
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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 transition-colors duration-400">
            <ModalProvider />
            {view === 'landing' ? (
                <LandingPage
                    onStart={(mode) => {
                        if (mode) setAuthMode(mode)
                        setView('auth')
                    }}
                    onTryFree={handleAnonymousSignIn}
                    darkMode={darkMode}
                    onToggleTheme={toggleTheme}
                />
            ) : view === 'auth' ? (
                <AuthPage
                    onBack={() => setView('landing')}
                    onSuccess={() => setView('app')}
                    darkMode={darkMode}
                    onToggleTheme={toggleTheme}
                    initialMode={authMode}
                />
            ) : (
                <>
                    <SettingsPanel />

                    {/* Header */}
                    <header className="w-full py-5 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 sticky top-0 z-50 backdrop-blur-md">
                        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setActiveTab('home')}>
                                <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/30 group-hover:scale-105 transition-transform">
                                    <BookOpen size={24} />
                                </div>
                                <span className="text-lg sm:text-xl font-display font-bold text-slate-900 dark:text-slate-100 tracking-tight">Zavri</span>
                            </div>

                            <nav className="flex items-center gap-1 sm:gap-2 md:gap-4">
                                <button
                                    onClick={() => setActiveTab('home')}
                                    className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'home' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'}`}
                                >
                                    Нүүр
                                </button>
                                {(user?.role === 'admin' || user?.role === 'teacher' || user?.isAdmin === true || user?.admin === true) && (
                                    <button
                                        onClick={() => setActiveTab('admin')}
                                        className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'admin' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        <LayoutDashboard size={14} className="sm:w-4 sm:h-4" />
                                        <span>{(user?.role === 'admin' || user?.isAdmin === true || user?.admin === true) ? 'Админ' : 'Багш'}</span>
                                    </button>
                                )}

                                {(user?.role === 'moderator' && !(user?.role === 'admin' || user?.isAdmin === true || user?.admin === true)) && (
                                    <button
                                        onClick={() => setActiveTab('moderation')}
                                        className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeTab === 'moderation' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
                                    >
                                        <ShieldAlert size={14} className="sm:w-4 sm:h-4" />
                                        <span>Модератор</span>
                                    </button>
                                )}

                                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 sm:mx-2"></div>

                                <div className="flex items-center gap-1 sm:gap-2">
                                    <button
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                                        title="Тохиргоо"
                                    >
                                        <Settings size={16} className="sm:w-4.5 sm:h-4.5" />
                                    </button>
                                    <div className="hidden sm:flex items-center gap-3 pl-1 sm:pl-2">
                                        <div className="text-right hidden md:block">
                                            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">{user?.displayName}</p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">{user?.xp} XP • {user?.gems} Gem</p>
                                        </div>
                                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-xs sm:text-sm">
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
                            <div className="animate-fade-in text-slate-900 dark:text-slate-50">
                                <div className="mb-16 animate-slide-up">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-xs font-bold uppercase tracking-widest border border-primary-100 dark:border-primary-900/30">
                                            Knowledge Hub
                                        </span>
                                        <div className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">Mongolia's Learning Portal</span>
                                    </div>

                                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-extrabold mb-8 leading-[1.1] tracking-tight">
                                        Мэдлэгээ өргөтгөх <br />
                                        <span className="text-primary-600 dark:text-primary-500">Монгол</span> зааварчилгаа
                                    </h1>
                                    <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                                        Мэргэжлийн түвшний заавар, зөвлөгөөг Монгол хэлээр, алхам алхмаар, маш ойлгомжтой суралцаарай.
                                    </p>
                                </div>

                                {/* Lessons Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {lessons.map((lesson, index) => (
                                        <div key={lesson.id} className="relative group">
                                            <div className="absolute top-4 left-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleReport(lesson.id); }}
                                                    className="bg-white/90 dark:bg-slate-900/90 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors shadow-sm"
                                                    title="Мэдээлэх"
                                                >
                                                    <AlertCircle size={14} />
                                                </button>
                                            </div>
                                            <LessonCard
                                                lesson={lesson}
                                                onClick={() => handleLessonSelect(lesson, index)}
                                                isLocked={user?.isAnonymous && index >= 10}
                                            />
                                        </div>
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
                        ) : activeTab === 'admin' && (user?.role === 'admin' || user?.isAdmin === true || user?.admin === true) ? (
                            <div className="animate-fade-in text-slate-900 dark:text-slate-50">
                                <div className="mb-12">
                                    <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">Админ Самвар</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2">Хичээл үүсгэх болон удирдах хэсэг</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* AI Lesson Generator Tool */}
                                    <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none relative overflow-hidden">
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
                                            <div key={lesson.id} className="bg-slate-50 dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                {editingLesson?.id === lesson.id ? (
                                                    <div className="flex-1 space-y-2">
                                                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
                                                        <input value={editSummary} onChange={e => setEditSummary(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
                                                        <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm">
                                                            <option>Technology</option><option>Cooking</option><option>Lifestyle</option><option>Education</option><option>Health</option><option>Finance</option>
                                                        </select>
                                                        <div className="flex gap-2 mt-2">
                                                            <button onClick={handleSaveEdit} className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Check size={14} /> Хадгалах</button>
                                                            <button onClick={() => setEditingLesson(null)} className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold">Цуцлах</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm truncate">{lesson.title}</p>
                                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{lesson.category} • {lesson.steps?.length || 0} алхам{lesson.sourceUrl ? ' • WikiHow' : ''}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button onClick={() => handleEditLesson(lesson)} className="flex-1 sm:flex-none h-9 px-4 sm:px-0 sm:w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center justify-center transition-all" title="Засах">
                                                                <Pencil size={14} className="mr-1 sm:mr-0" /> <span className="sm:hidden text-xs font-bold">Засах</span>
                                                            </button>
                                                            <button onClick={() => handleDeleteLesson(lesson.id, lesson.title)} className="flex-1 sm:flex-none h-9 px-4 sm:px-0 sm:w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all" title="Устгах">
                                                                <Trash2 size={14} className="mr-1 sm:mr-0" /> <span className="sm:hidden text-xs font-bold">Устгах</span>
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

                                {/* Integrated Reports Management for Admins */}
                                <div className="mt-20 pt-20 border-t border-slate-200 dark:border-slate-800">
                                    <div className="mb-12">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
                                                <ShieldAlert size={20} />
                                            </div>
                                            <h3 className="text-2xl font-bold">Мэдээлэгдсэн хичээлүүд</h3>
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400">Хэрэглэгчдээс ирсэн гомдол мэдээллийг эндээс хянах боломжтой.</p>
                                    </div>

                                    <div className="space-y-6">
                                        {reports.map((report: any) => (
                                            <div key={report.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-2">Мэдээлсэн шалтгаан:</p>
                                                        <p className="text-lg font-bold text-slate-900 dark:text-white">{report.reason}</p>
                                                    </div>
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        report.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                                                        }`}>
                                                        {report.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                                    <button
                                                        onClick={() => handleUpdateReport(report.id, 'approved')}
                                                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-[0.98]"
                                                    >
                                                        Зөвшөөрөх
                                                    </button>
                                                    <button
                                                        onClick={() => handleUpdateReport(report.id, 'declined')}
                                                        className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold transition-all active:scale-[0.98]"
                                                    >
                                                        Татгалзах
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {reports.length === 0 && (
                                            <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-700">
                                                <p className="text-slate-400 dark:text-slate-500 font-medium">Мэдээлэгдсэн хичээл байхгүй байна.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : activeTab === 'moderation' && (user?.role === 'moderator') ? (
                            <div className="animate-fade-in text-slate-900 dark:text-white">
                                <div className="mb-12">
                                    <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">Модератор Самбар</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2">Мэдээлэгдсэн хичээлүүдийг хянах хэсэг</p>
                                </div>
                                {/* Original report management view */}
                                <div className="space-y-6">
                                    {reports.map((report: any) => (
                                        <div key={report.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-xs font-bold text-primary-600 uppercase tracking-widest mb-1">Мэдээлсэн шалтгаан:</p>
                                                    <p className="text-lg font-bold">{report.reason}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    report.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                    {report.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                                <button
                                                    onClick={() => handleUpdateReport(report.id, 'approved')}
                                                    className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all"
                                                >
                                                    Зөвшөөрөх
                                                </button>
                                                <button
                                                    onClick={() => handleUpdateReport(report.id, 'declined')}
                                                    className="px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-all"
                                                >
                                                    Татгалзах
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {reports.length === 0 && (
                                        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                                            <p className="text-slate-400">Мэдээлэгдсэн хичээл байхгүй байна.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (user?.role === 'admin' || user?.role === 'teacher') ? (
                            <div className="animate-fade-in text-slate-900 dark:text-white">
                                <div className="mb-12">
                                    <h2 className="text-3xl md:text-4xl font-display font-bold tracking-tight">{user?.role === 'admin' ? 'Админ Самвар' : 'Багшийн Самвар'}</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2">Хичээл үүсгэх болон удирдах хэсэг</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* AI Lesson Generator Tool */}
                                    <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-900 p-8 md:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm dark:shadow-none relative overflow-hidden">
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
                                        {user?.role === 'admin' && (
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
                                        )}
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
                                        {lessons.filter(l => user?.role === 'admin' || l.authorId === user?.uid).map(lesson => (
                                            <div key={lesson.id} className="bg-slate-50 dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                {editingLesson?.id === lesson.id ? (
                                                    <div className="flex-1 space-y-2">
                                                        <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
                                                        <input value={editSummary} onChange={e => setEditSummary(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm" />
                                                        <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="w-full sm:w-auto px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm">
                                                            <option>Technology</option><option>Cooking</option><option>Lifestyle</option><option>Education</option><option>Health</option><option>Finance</option>
                                                        </select>
                                                        <div className="flex gap-2 mt-2">
                                                            <button onClick={handleSaveEdit} className="flex-1 sm:flex-none px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"><Check size={14} /> Хадгалах</button>
                                                            <button onClick={() => setEditingLesson(null)} className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-xs font-bold">Цуцлах</button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-sm truncate">{lesson.title}</p>
                                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{lesson.category} • {lesson.steps?.length || 0} алхам{lesson.sourceUrl ? ' • WikiHow' : ''}</p>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <button onClick={() => handleEditLesson(lesson)} className="flex-1 sm:flex-none h-9 px-4 sm:px-0 sm:w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center justify-center transition-all" title="Засах">
                                                                <Pencil size={14} className="mr-1 sm:mr-0" /> <span className="sm:hidden text-xs font-bold">Засах</span>
                                                            </button>
                                                            <button onClick={() => handleDeleteLesson(lesson.id, lesson.title)} className="flex-1 sm:flex-none h-9 px-4 sm:px-0 sm:w-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-all" title="Устгах">
                                                                <Trash2 size={14} className="mr-1 sm:mr-0" /> <span className="sm:hidden text-xs font-bold">Устгах</span>
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

                                {/* User Management List */}
                                <div className="mt-16 pt-16 border-t border-slate-200 dark:border-slate-800">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-2xl font-display font-bold">Хэрэглэгчийн удирдлага</h3>
                                            <p className="text-slate-500 text-sm mt-1">Системийн нийт хэрэглэгчид болон тэдний эрхийг удирдах</p>
                                        </div>
                                        <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-xl text-xs font-bold text-slate-500">
                                            {allUsers.length} хэрэглэгч
                                        </div>
                                    </div>

                                    {isUsersLoading ? (
                                        <div className="flex justify-center py-12">
                                            <Loader2 size={32} className="animate-spin text-primary-500" />
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {allUsers.map(u => (
                                                <div key={u.uid} className="bg-white dark:bg-slate-900 overflow-hidden rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all p-6">
                                                    <div className="flex items-center gap-4 mb-6">
                                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                            <User size={24} />
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-bold truncate text-slate-900 dark:text-slate-50">{u.displayName || 'Нэргүй'}</p>
                                                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">Эрх өөрчлөх</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {(['student', 'teacher', 'moderator', 'admin'] as UserRole[]).map(r => (
                                                                <button
                                                                    key={r}
                                                                    onClick={() => handleRoleChange(u.uid, r)}
                                                                    disabled={u.role === r}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${u.role === r
                                                                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                                        }`}
                                                                >
                                                                    {r === 'student' ? 'Сурагч' : r === 'teacher' ? 'Багш' : r === 'moderator' ? 'Мод' : 'Админ'}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20">
                                <ShieldAlert size={48} className="text-slate-300 mb-4" />
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
                    <footer className="border-t border-slate-200 dark:border-slate-800 py-16 px-6 bg-slate-50 dark:bg-slate-950">
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
