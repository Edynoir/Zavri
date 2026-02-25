import { useState } from 'react'
import { BookOpen, Mail, Lock, User, ArrowLeft, Loader2, Sparkles, Eye, EyeOff, Moon, Sun } from 'lucide-react'
import { signIn, signUp, signInWithGoogle, sendPasswordReset } from '../services/authService'

interface AuthPageProps {
    onBack: () => void;
    onSuccess: () => void;
    darkMode: boolean;
    onToggleTheme: () => void;
}

export function AuthPage({ onBack, onSuccess, darkMode, onToggleTheme }: AuthPageProps) {
    const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    const getErrorMessage = (error: any) => {
        const code = error.code;
        switch (code) {
            case 'auth/invalid-credential':
                return 'Имэйл эсвэл нууц үг буруу байна. (Мөн "Email/Password" нэвтрэлт идэвхжсэн эсэхийг шалгана уу)';
            case 'auth/user-not-found':
                return 'Бүртгэлтэй хэрэглэгч олдсонгүй.';
            case 'auth/wrong-password':
                return 'Нууц үг буруу байна.';
            case 'auth/email-already-in-use':
                return 'Энэ имэйл хаяг аль хэдийн бүртгэгдсэн байна.';
            case 'auth/weak-password':
                return 'Нууц үг хэтэрхий богино байна (хамгийн багадаа 6 тэмдэгт).';
            case 'auth/network-request-failed':
                return 'Интернэт холболтоо шалгана уу.';
            case 'auth/too-many-requests':
                return 'Хэт олон оролдлого хийсэн тул түр хүлээнэ үү.';
            default:
                return error.message || 'Алдаа гарлаа';
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setMessage('')

        try {
            if (mode === 'signin') {
                await signIn(email, password)
                onSuccess()
            } else if (mode === 'signup') {
                if (!name) throw new Error('Нэрээ оруулна уу')
                await signUp(email, password, name)
                onSuccess()
            } else if (mode === 'reset') {
                await sendPasswordReset(email)
                setMessage('Нууц үг сэргээх имэйл илгээгдлээ. Имэйлээ шалгана уу.')
                setTimeout(() => setMode('signin'), 5000)
            }
        } catch (err: any) {
            setError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleSignIn = async () => {
        setLoading(true)
        setError('')
        try {
            await signInWithGoogle()
            onSuccess()
        } catch (err: any) {
            setError(err.message || 'Google-ээр нэвтрэхэд алдаа гарлаа')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-500">
            <div className="w-full max-w-md">
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={mode === 'reset' ? () => setMode('signin') : onBack}
                        className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-bold text-sm group"
                    >
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        Буцах
                    </button>
                    <button
                        onClick={onToggleTheme}
                        className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-sm"
                        title={darkMode ? "Light Mode" : "Dark Mode"}
                    >
                        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                    <div className="flex flex-col items-center mb-8 sm:mb-10">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-4 sm:mb-6">
                            <BookOpen size={28} className="sm:w-8 sm:h-8" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-950 dark:text-white">
                            {mode === 'signin' ? 'Тавтай морил' : mode === 'signup' ? 'Бүртгэл үүсгэх' : 'Нууц үг сэргээх'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-xs sm:text-sm">
                            {mode === 'signin' ? 'Мэдлэгээ өргөтгөхөд бэлэн үү?' :
                                mode === 'signup' ? 'Өөрийн суралцах аяллаа өнөөдөр эхлүүлээрэй.' :
                                    'Бүртгэлтэй имэйл хаягаа оруулна уу.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {mode === 'signup' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Таны нэр</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Нэрээ оруулна уу"
                                        className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-slate-50/30 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Имэйл хаяг</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-slate-50/30 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                                />
                            </div>
                        </div>

                        {mode !== 'reset' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Нууц үг</label>
                                    {mode === 'signin' && (
                                        <button
                                            type="button"
                                            onClick={() => setMode('reset')}
                                            className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700"
                                        >
                                            Нууц үг мартсан?
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-slate-50/30 dark:bg-slate-800/50 text-slate-900 dark:text-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {error && (
                            <p className="text-sm font-bold text-rose-500 px-1">{error}</p>
                        )}

                        {message && (
                            <p className="text-sm font-bold text-emerald-500 px-1">{message}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-slate-950 dark:bg-white hover:bg-slate-900 dark:hover:bg-slate-100 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white dark:text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 dark:shadow-none active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <>
                                    <span>{mode === 'signin' ? 'Нэвтрэх' : mode === 'signup' ? 'Бүртгүүлэх' : 'Имэйл илгээх'}</span>
                                    {mode !== 'reset' && <Sparkles size={20} className="text-yellow-400" />}
                                </>
                            )}
                        </button>
                    </form>

                    {mode !== 'reset' && (
                        <>
                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white dark:bg-slate-900 px-4 text-slate-400 dark:text-slate-500 font-bold tracking-widest">Эсвэл</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-sm active:scale-[0.98]"
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                                Google-ээр нэвтрэх
                            </button>

                            <div className="mt-8 text-center">
                                <p className="text-slate-500 dark:text-slate-400 text-sm">
                                    {mode === 'signin' ? 'Шинэ хэрэглэгч үү?' : 'Бүртгэлтэй юу?'}
                                    <button
                                        onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                                        className="ml-2 font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 underline underline-offset-4"
                                    >
                                        {mode === 'signin' ? 'Бүртгэл үүсгэх' : 'Нэвтрэх'}
                                    </button>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
