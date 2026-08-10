import { type ReactNode, useEffect, useState } from 'react';
import { X, Check, Copy, Download } from 'lucide-react';

// ============ Modal ============

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizeClass} max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col`}>
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

// ============ Badge ============

export function Badge({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {children}
    </span>
  );
}

// ============ Button ============

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md';
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

export function Button({ children, onClick, variant = 'primary', size = 'md', disabled, type = 'button', className = '' }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';
  const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm' };
  const variants = {
    primary: 'bg-sky-600 text-white hover:bg-sky-700 focus:ring-sky-500',
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-slate-600 hover:bg-slate-100 focus:ring-slate-400',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}

// ============ Input / Select / Textarea ============

export function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition ${props.className ?? ''}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 bg-white focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition ${props.className ?? ''}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition ${props.className ?? ''}`}
    />
  );
}

// ============ ConfirmDialog (with typed confirmation) ============

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: ReactNode;
  confirmText?: string;
  requireTyped?: string;
  danger?: boolean;
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmText = '确认', requireTyped, danger = false }: ConfirmDialogProps) {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (open) setTyped('');
  }, [open]);

  const canConfirm = !requireTyped || typed === requireTyped;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button variant={danger ? 'danger' : 'primary'} disabled={!canConfirm} onClick={onConfirm}>{confirmText}</Button>
        </>
      }
    >
      <div className="text-sm text-slate-600">
        {message}
        {requireTyped && (
          <div className="mt-4">
            <p className="mb-2 text-slate-700">请输入 <span className="font-bold text-red-600">{requireTyped}</span> 以确认操作：</p>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
          </div>
        )}
      </div>
    </Modal>
  );
}

// ============ Toast ============

export function Toast({ message, type = 'success', onClose }: { message: string; type?: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-sky-600',
  };
  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-slide-up">
      <div className={`${colors[type]} rounded-lg px-5 py-3 text-sm text-white shadow-lg`}>
        {message}
      </div>
    </div>
  );
}

// ============ Empty State ============

export function EmptyState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <div className="mb-3">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ============ DataPreviewModal ============

interface DataPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  data: unknown;
  csvRows?: Record<string, any>[];
  filename?: string;
}

export function DataPreviewModal({ open, onClose, title, data, csvRows, filename = 'data' }: DataPreviewModalProps) {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [copied, setCopied] = useState(false);

  const jsonText = JSON.stringify(data, null, 2);
  const csvText = csvRows && csvRows.length > 0
    ? (() => {
        const headers = Object.keys(csvRows[0]);
        const escape = (v: any) => {
          const s = String(v ?? '');
          if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
          return s;
        };
        return [
          headers.join(','),
          ...csvRows.map((r) => headers.map((h) => escape(r[h])).join(',')),
        ].join('\n');
      })()
    : '';

  const text = format === 'json' ? jsonText : csvText;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
      ta.remove();
    }
  };

  const handleDownload = () => {
    const mime = format === 'json' ? 'application/json;charset=utf-8' : 'text/csv;charset=utf-8';
    const ext = format === 'json' ? 'json' : 'csv';
    const blob = new Blob(['\uFEFF' + text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${ext}`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <div className="mr-auto flex items-center gap-2">
            <button
              onClick={() => setFormat('json')}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${format === 'json' ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-100'}`}
            >JSON</button>
            <button
              onClick={() => setFormat('csv')}
              disabled={!csvRows || csvRows.length === 0}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition disabled:opacity-40 ${format === 'csv' ? 'bg-sky-100 text-sky-700' : 'text-slate-500 hover:bg-slate-100'}`}
            >CSV</button>
          </div>
          <Button variant="secondary" size="sm" onClick={handleCopy}>
            {copied ? <><Check size={14} /> 已复制</> : <><Copy size={14} /> 一键复制</>}
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download size={14} /> 下载文件
          </Button>
        </>
      }
    >
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 max-h-[55vh] overflow-auto">
        <pre className="whitespace-pre-wrap break-all text-xs font-mono text-slate-700 leading-relaxed">{text}</pre>
      </div>
      <p className="mt-3 text-xs text-slate-400">
        共 {format === 'json' ? jsonText.length : csvText.length} 字符 · 可直接复制粘贴到文件，或点击"下载文件"通过浏览器保存
      </p>
    </Modal>
  );
}

// ============ Pagination ============

export function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <Button size="sm" variant="secondary" disabled={page === 1} onClick={() => onPageChange(page - 1)}>上一页</Button>
      <span className="px-3 text-sm text-slate-600">第 {page} / {totalPages} 页</span>
      <Button size="sm" variant="secondary" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>下一页</Button>
    </div>
  );
}
