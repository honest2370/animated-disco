import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
} from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { CheckCircleIcon, AlertIcon, InfoIcon, XIcon } from "../lib/icons";
import type {
  ServiceStatus,
  ProductStatus,
  PaymentType,
} from "../lib/types";

export function cn(...a: any[]) {
  return twMerge(clsx(a));
}

export function fmtCFA(n: number | null | undefined): string {
  const v = Number(n || 0);
  return new Intl.NumberFormat("fr-FR").format(Math.round(v)) + " FCFA";
}

export function fmtDate(s?: string | null): string {
  if (!s) return "";
  try {
    return new Date(s).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return s;
  }
}

export function timeShort(s?: string | null): string {
  if (!s) return "";
  try {
    return new Date(s).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/* ——— Button ——— */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  full?: boolean;
};
export function Button({
  variant = "primary",
  size = "md",
  loading,
  full,
  className,
  children,
  disabled,
  ...rest
}: BtnProps) {
  const sizes = {
    sm: "h-9 px-3 text-xs rounded-xl gap-1.5",
    md: "h-11 px-4 text-sm rounded-2xl gap-2",
    lg: "h-13 px-5 text-[15px] rounded-2xl gap-2",
  };
  const variants = {
    primary:
      "gradient-brand text-white font-semibold shadow-lg shadow-accent-500/25 hover:shadow-accent-500/35 active:scale-[.98] transition-all",
    secondary:
      "bg-accent-50 text-accent-700 font-semibold border border-accent-200 hover:bg-accent-100 active:scale-[.98] transition-all",
    ghost: "text-base-soft/70 hover:bg-slate-100 active:bg-slate-200 transition",
    outline: "border border-slate-200 text-base-soft hover:bg-slate-50 active:bg-slate-100 transition",
    danger: "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 active:scale-[.98] transition",
  };
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-medium disabled:opacity-40 disabled:pointer-events-none select-none cursor-pointer",
        sizes[size],
        variants[variant],
        full && "w-full",
        className
      )}
      {...rest}
    >
      {loading && (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </button>
  );
}

export function IconButton({
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl text-base-muted/70 hover:bg-slate-100 active:scale-95 transition",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

/* ——— Form ——— */
export function Field({
  label,
  hint,
  children,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      {label && (
        <span className="mb-1.5 block text-xs font-semibold text-base-muted/80">
          {label}
        </span>
      )}
      {children}
      {hint && <span className="mt-1 block text-[11px] text-muted">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full rounded-2xl border border-slate-200 bg-white px-3.5 text-sm text-base outline-none placeholder:text-muted/60 transition focus:border-accent-400 focus:ring-2 focus:ring-accent-400/15";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputBase, "h-11", props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(inputBase, "py-2.5 min-h-[96px] resize-y", props.className)}
    />
  );
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(inputBase, "h-11 appearance-none pr-9 bg-[length:16px] bg-[right_12px_center] bg-no-repeat", props.className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'><path d='m4 6 4 4 4-4'/></svg>\")",
      }}
    >
      {props.children}
    </select>
  );
}

/* ——— Card ——— */
export function Card({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "card-glass rounded-3xl p-4",
        onClick && "cursor-pointer active:scale-[.99] transition",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ——— Badge ——— */
export function Badge({
  children,
  tone = "accent",
  className,
}: {
  children: ReactNode;
  tone?: "accent" | "amber" | "emerald" | "rose" | "violet" | "slate" | "sky";
  className?: string;
}) {
  const tones = {
    accent: "bg-accent-50 text-accent-700 border-accent-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-600 border-rose-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

const SVC_LABELS: Record<ServiceStatus, { t: string; tone: any }> = {
  pending: { t: "En attente", tone: "slate" },
  reviewing: { t: "En examen", tone: "sky" },
  approved: { t: "Approuvée", tone: "accent" },
  invoiced: { t: "Facturée", tone: "amber" },
  sample_sent: { t: "Échantillon envoyé", tone: "violet" },
  completed: { t: "Terminée", tone: "emerald" },
  rejected: { t: "Rejetée", tone: "rose" },
  cancelled: { t: "Annulée", tone: "slate" },
};
export function ServiceStatusBadge({ status }: { status: ServiceStatus }) {
  const m = SVC_LABELS[status] || SVC_LABELS.pending;
  return <Badge tone={m.tone}>{m.t}</Badge>;
}

const PRD_LABELS: Record<ProductStatus, { t: string; tone: any }> = {
  pending: { t: "À payer", tone: "slate" },
  paid: { t: "Preuve envoyée", tone: "amber" },
  approved: { t: "Validée", tone: "accent" },
  delivered: { t: "Livrée", tone: "emerald" },
  rejected: { t: "Rejetée", tone: "rose" },
  cancelled: { t: "Annulée", tone: "slate" },
};
export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const m = PRD_LABELS[status] || PRD_LABELS.pending;
  return <Badge tone={m.tone}>{m.t}</Badge>;
}

export const PAYMENT_LABELS: Record<PaymentType, string> = {
  mobile_money: "Mobile Money",
  orange_money: "Orange Money",
  wave: "Wave",
  moov: "Moov Money",
  bank: "Virement bancaire",
  paypal: "PayPal",
  card: "Carte bancaire",
  crypto: "Cryptomonnaie",
  other: "Autre",
};

/* ——— Sheet ——— */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-base/40 backdrop-blur-sm animate-fade"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md card-glass-strong rounded-t-3xl border-b-0 p-5 pb-8 animate-sheet safe-bottom max-h-[92vh] overflow-y-auto no-scrollbar">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-300" />
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-base">{title}</h3>
            <IconButton onClick={onClose} aria-label="Fermer">
              <XIcon className="h-5 w-5" />
            </IconButton>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

/* ——— Spinner / Empty ——— */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block h-5 w-5 rounded-full border-2 border-accent-200 border-t-accent-500 animate-spin",
        className
      )}
    />
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon?: ReactNode;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade">
      {icon && (
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-accent-50 text-accent-400">
          {icon}
        </div>
      )}
      <p className="font-semibold text-base">{title}</p>
      {desc && <p className="mt-1 max-w-xs text-sm text-muted">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* ——— Avatar ——— */
export function Avatar({
  name,
  url,
  size = 40,
}: {
  name?: string;
  url?: string | null;
  size?: number;
}) {
  const initials = (name || "?")
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full gradient-brand font-bold text-white overflow-hidden"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

/* ——— Toasts ——— */
type Toast = { id: number; type: "success" | "error" | "info"; msg: string };
const ToastCtx = createContext<(t: Omit<Toast, "id">) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((s) => [...s, { ...t, id }]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), 3600);
  }, []);

  const icons = {
    success: <CheckCircleIcon className="h-5 w-5 text-emerald-500" />,
    error: <AlertIcon className="h-5 w-5 text-rose-500" />,
    info: <InfoIcon className="h-5 w-5 text-accent-500" />,
  };

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex flex-col items-center gap-2 px-4 pt-3 safe-top">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card-glass-strong pointer-events-auto flex w-full max-w-sm items-center gap-2.5 rounded-2xl px-4 py-3 text-sm shadow-xl animate-slide-up"
          >
            {icons[t.type]}
            <span className="flex-1 text-base-soft">{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
