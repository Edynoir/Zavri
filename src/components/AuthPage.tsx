import { useState } from 'react'
import { BookOpen, Mail, Lock, User, ArrowLeft, Loader2, Sparkles } from 'lucide-react'
import { signIn, signUp } from '../services/authService'

interface AuthPageProps {
    onBack: () => void;
    onSuccess: () => void;
}

export function AuthPage({ onBack, onSuccess }: AuthPageProps) {
    const [mode, setMode] = useState<'signin' | 'signup'>('signin')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            if (mode === 'signin') {
                await signIn(email, password)
            } else {
                if (!name) throw new Error('Нэрээ оруулна уу')
                await signUp(email, password, name)
            }
            onSuccess()
        } catch (err: any) {
            setError(err.message || 'Алдаа гарлаа')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors mb-8 font-bold text-sm group"
                >
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Буцах
                </button>

                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white shadow-xl mb-6">
                            <BookOpen size={32} />
                        </div>
                        <h2 className="text-3xl font-display font-bold text-slate-950">
                            {mode === 'signin' ? 'Тавтай морил' : 'Бүртгэл үүсгэх'}
                        </h2>
                        <p className="text-slate-500 mt-2 text-center">
                            {mode === 'signin' ? 'Мэдлэгээ өргөтгөхөд бэлэн үү?' : 'Өөрийн суралцах аяллаа өнөөдөр эхлүүлээрэй.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {mode === 'signup' && (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Таны нэр</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Нэрээ оруулна уу"
                                        className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-slate-50/30"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Имэйл хаяг</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="email@example.com"
                                    className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-slate-50/30"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">Нууц үг</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-12 pr-5 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-slate-50/30"
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm font-bold text-rose-500 px-1">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-5 bg-slate-950 hover:bg-slate-900 disabled:bg-slate-400 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-slate-200 active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 size={24} className="animate-spin" />
                            ) : (
                                <>
                                    <span>{mode === 'signin' ? 'Нэвтрэх' : 'Бүртгүүлэх'}</span>
                                    <Sparkles size={20} className="text-yellow-400" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-sm">
                            {mode === 'signin' ? 'Шинэ хэрэглэгч үү?' : 'Бүртгэлтэй юу?'}
                            <button
                                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                                className="ml-2 font-bold text-primary-600 hover:text-primary-700 underline underline-offset-4"
                            >
                                {mode === 'signin' ? 'Бүртгэл үүсгэх' : 'Нэвтрэх'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
