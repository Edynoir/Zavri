import { useState, useEffect, useCallback } from 'react'
import { AlertTriangle, CheckCircle, Info, X, Trash2 } from 'lucide-react'

// ============================================================
// Types
// ============================================================
type ModalType = 'alert' | 'confirm' | 'prompt' | 'success' | 'error'

interface ModalConfig {
    id: string
    type: ModalType
    title: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    placeholder?: string
    onConfirm?: (value?: string) => void
    onCancel?: () => void
    isDangerous?: boolean
}

// ============================================================
// Global modal queue (simple singleton pattern)
// ============================================================
type ModalListener = (config: ModalConfig | null) => void
let _listener: ModalListener | null = null
let _resolve: ((value: any) => void) | null = null

const showModal = (config: Omit<ModalConfig, 'id'>): Promise<any> => {
    return new Promise((resolve) => {
        _resolve = resolve
        _listener?.({ ...config, id: Math.random().toString(36).slice(2) })
    })
}

// ============================================================
// Public API — replaces alert / confirm / prompt
// ============================================================
export const Modal = {
    alert: (message: string, title = 'Анхааруулга') =>
        showModal({ type: 'alert', title, message }),

    success: (message: string, title = 'Амжилттай') =>
        showModal({ type: 'success', title, message }),

    error: (message: string, title = 'Алдаа гарлаа') =>
        showModal({ type: 'error', title, message }),

    confirm: (message: string, options: { title?: string; confirmLabel?: string; cancelLabel?: string; isDangerous?: boolean } = {}) =>
        showModal({
            type: 'confirm',
            title: options.title ?? 'Баталгаажуулах',
            message,
            confirmLabel: options.confirmLabel ?? 'Тийм',
            cancelLabel: options.cancelLabel ?? 'Үгүй',
            isDangerous: options.isDangerous,
        }) as Promise<boolean>,

    prompt: (message: string, options: { title?: string; placeholder?: string; confirmLabel?: string } = {}) =>
        showModal({
            type: 'prompt',
            title: options.title ?? 'Оруулна уу',
            message,
            placeholder: options.placeholder ?? '',
            confirmLabel: options.confirmLabel ?? 'Ок',
            cancelLabel: 'Цуцлах',
        }) as Promise<string | null>,
}

// ============================================================
// Modal Renderer Component
// ============================================================
export function ModalProvider() {
    const [config, setConfig] = useState<ModalConfig | null>(null)
    const [inputValue, setInputValue] = useState('')

    useEffect(() => {
        _listener = (c) => {
            setConfig(c)
            setInputValue('')
        }
        return () => { _listener = null }
    }, [])

    const close = useCallback(() => {
        setConfig(null)
        _resolve = null
    }, [])

    const handleConfirm = () => {
        if (!config) return
        if (config.type === 'prompt') {
            _resolve?.(inputValue || null)
        } else if (config.type === 'confirm') {
            _resolve?.(true)
        } else {
            _resolve?.(undefined)
        }
        close()
    }

    const handleCancel = () => {
        if (config?.type === 'confirm') _resolve?.(false)
        else if (config?.type === 'prompt') _resolve?.(null)
        else _resolve?.(undefined)
        close()
    }

    if (!config) return null

    const iconMap = {
        alert: <AlertTriangle size={28} className="text-amber-500" />,
        confirm: config.isDangerous
            ? <Trash2 size={28} className="text-rose-500" />
            : <Info size={28} className="text-sky-500" />,
        prompt: <Info size={28} className="text-sky-500" />,
        success: <CheckCircle size={28} className="text-emerald-500" />,
        error: <AlertTriangle size={28} className="text-rose-500" />,
    }

    const iconBgMap = {
        alert: 'bg-amber-50 dark:bg-amber-900/20',
        confirm: config.isDangerous ? 'bg-rose-50 dark:bg-rose-900/20' : 'bg-sky-50 dark:bg-sky-900/20',
        prompt: 'bg-sky-50 dark:bg-sky-900/20',
        success: 'bg-emerald-50 dark:bg-emerald-900/20',
        error: 'bg-rose-50 dark:bg-rose-900/20',
    }

    const confirmBtnMap = {
        alert: 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white',
        confirm: config.isDangerous
            ? 'bg-rose-600 text-white hover:bg-rose-700'
            : 'bg-sky-600 text-white hover:bg-sky-700',
        prompt: 'bg-sky-600 text-white hover:bg-sky-700',
        success: 'bg-emerald-600 text-white hover:bg-emerald-700',
        error: 'bg-rose-600 text-white hover:bg-rose-700',
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={config.type === 'alert' || config.type === 'success' || config.type === 'error' ? handleConfirm : undefined}
            >
                {/* Modal Card */}
                <div
                    className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden animate-scale-in"
                    style={{ animation: 'scaleIn 0.2s ease-out forwards' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-6 pb-0 flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${iconBgMap[config.type]}`}>
                                {iconMap[config.type]}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 leading-tight">{config.title}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{config.message}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleCancel}
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shrink-0 ml-2"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Prompt input */}
                    {config.type === 'prompt' && (
                        <div className="px-6 pt-4">
                            <input
                                autoFocus
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirm()
                                    if (e.key === 'Escape') handleCancel()
                                }}
                                placeholder={config.placeholder}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all text-sm"
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="p-6 flex gap-3 justify-end">
                        {(config.type === 'confirm' || config.type === 'prompt') && (
                            <button
                                onClick={handleCancel}
                                className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                {config.cancelLabel ?? 'Цуцлах'}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${confirmBtnMap[config.type]}`}
                        >
                            {config.confirmLabel ?? 'Ок'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}
