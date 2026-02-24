import { BookOpen, ArrowRight, Sparkles, CheckCircle, Smartphone, Globe } from 'lucide-react'

interface LandingPageProps {
    onStart: () => void;
    onTryFree: () => void;
}

export function LandingPage({ onStart, onTryFree }: LandingPageProps) {
    return (
        <div className="min-h-screen bg-slate-50 selection:bg-primary-100">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <BookOpen size={24} />
                        </div>
                        <span className="text-xl font-display font-bold text-slate-900">Zavri</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onStart}
                            className="text-slate-600 hover:text-slate-900 font-bold text-sm transition-colors px-4 py-2"
                        >
                            Нэвтрэх
                        </button>
                        <button
                            onClick={onStart}
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all"
                        >
                            Бүртгүүлэх
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="animate-slide-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-xs font-bold uppercase tracking-widest mb-8 border border-primary-100">
                            <Sparkles size={14} />
                            Монголын анхны сургалтын платформ
                        </div>
                        <h1 className="text-5xl md:text-7xl font-display font-black text-slate-950 mb-8 leading-[1.1] tracking-tight">
                            Мэдлэгээ <span className="text-primary-600 italic">хялбархан</span> <br />
                            өргөтгөх боломж
                        </h1>
                        <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-xl leading-relaxed">
                            Мэргэжлийн түвшний заавар, зөвлөгөөг Монгол хэлээр, алхам алхмаар, маш ойлгомжтой суралцаарай.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={onTryFree}
                                className="px-8 py-5 bg-primary-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-primary-500/20 hover:bg-primary-700 transition-all active:scale-95 group"
                            >
                                Үнэгүй турших
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={onStart}
                                className="px-8 py-5 bg-white text-slate-900 border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
                            >
                                Бүртгэл үүсгэх
                            </button>
                        </div>

                        <div className="mt-12 flex items-center gap-6">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?u=${i}`} alt="user" />
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-slate-400 font-medium">
                                <span className="text-slate-900 font-bold">1,000+</span> суралцагч нэгдсэн
                            </p>
                        </div>
                    </div>

                    <div className="relative animate-fade-in group">
                        <div className="absolute -inset-4 bg-gradient-to-tr from-primary-500/10 to-purple-500/10 rounded-[3rem] blur-3xl"></div>
                        <div className="relative bg-white p-8 rounded-[3rem] border border-slate-100 shadow-2xl overflow-hidden">
                            <div className="aspect-[4/3] bg-slate-50 rounded-[2rem] flex items-center justify-center relative overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
                                    className="object-cover w-full h-full opacity-90 group-hover:scale-105 transition-transform duration-1000"
                                    alt="Learning Hero"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/90 backdrop-blur-md rounded-2xl border border-white/50 shadow-xl">
                                    <h3 className="font-bold text-slate-900 mb-1">Фэйсбүүкт хэрхэн аюулгүй нэвтрэх вэ?</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Үнэгүй</span>
                                        <span className="text-xs text-slate-400">12 минутын хичээл</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-20 bg-white border-y border-slate-100">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {[
                            { icon: <CheckCircle className="text-emerald-500" />, title: "Ойлгомжтой", desc: "Алхам алхмаар зааварчилгаа" },
                            { icon: <Smartphone className="text-blue-500" />, title: "Гар утас", desc: "Хаанаас ч суралцах боломж" },
                            { icon: <Globe className="text-purple-500" />, title: "Мэргэжлийн", desc: "Шалгагдсан агуулга" }
                        ].map((f, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0">
                                    {f.icon}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 mb-1">{f.title}</h4>
                                    <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}
