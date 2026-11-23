import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertTriangle, ImageOff } from "lucide-react";
import { REQUIREMENT_STATUS, QUOTE_STATUS } from "../../lib/constants";
import { assetUrl } from "../../lib/api";
import { initials } from "../../lib/format";

const TONES = {
  neel: "bg-neel-50 text-neel-700 ring-neel-200",
  ok: "bg-ok-bg text-ok ring-[#b9dfc8]",
  bad: "bg-bad-bg text-bad ring-[#efc2b9]",
  warn: "bg-warn-bg text-warn ring-[#f5cfa8]",
  muted: "bg-[#eef0ec] text-muted ring-line",
  haldi: "bg-haldi-100 text-[#9a4200] ring-[#f7c9a0]",
};

export function Badge({ tone = "muted", children, className = "" }) {
  return (
    <span className={`inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[12.5px] font-semibold ring-1 ring-inset ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusBadge({ status, kind = "requirement", label }) {
  const map = kind === "quote" ? QUOTE_STATUS : REQUIREMENT_STATUS;
  const s = map[status] || { label: status || "—", tone: "muted" };
  return <Badge tone={s.tone}>{label || s.label}</Badge>;
}

export function Spinner({ className = "h-5 w-5" }) {
  return <Loader2 className={`animate-spin text-muted ${className}`} aria-hidden />;
}

export function PageLoader({ label = "Loading…" }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center gap-3 text-muted" role="status">
      <Spinner /> {label}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-neel-50 text-neel-700">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <p className="mt-1.5 max-w-sm text-sm text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <AlertTriangle className="mb-3 h-6 w-6 text-bad" />
      <p className="font-semibold">{error?.message || "Something went wrong."}</p>
      {onRetry && (
        <button className="btn btn-outline btn-sm mt-4" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Field({ label, hint, error, children, optional, htmlFor }) {
  return (
    <div>
      {label && (
        <label className="label" htmlFor={htmlFor}>
          {label} {optional && <span className="font-normal text-subtle">(optional)</span>}
        </label>
      )}
      {children}
      {error ? <p className="hint !text-bad">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  );
}

export function FormError({ children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-[#efc2b9] bg-bad-bg px-4 py-3 text-sm text-bad" role="alert">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function PageHeader({ title, description, actions, back }) {
  return (
    <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {back && (
          <Link to={back.to} className="mb-3 inline-flex text-sm font-medium text-muted hover:text-ink">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-[28px] font-bold sm:text-[32px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Avatar({ name, src, size = 40, className = "" }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (src && !broken) {
    return <img src={assetUrl(src)} alt="" style={style} onError={() => setBroken(true)} className={`shrink-0 rounded-full object-cover ${className}`} />;
  }
  return (
    <span style={style} className={`grid shrink-0 place-items-center rounded-full bg-neel-100 font-display font-bold text-neel-800 ${className}`}>
      {initials(name)}
    </span>
  );
}

// fit="cover"   – fills the box, edges may be cropped (good for real photos)
// fit="contain" – shows the whole image; empty space is filled with a soft blurred copy (good for logos, banners, any shape)
export function Img({ src, alt = "", className = "", fallbackLabel, fit = "cover" }) {
  const [brokenSrc, setBrokenSrc] = useState(null);
  if (!src || brokenSrc === src) {
    return (
      <div className={`grid place-items-center bg-[#eceee9] text-subtle ${className}`} aria-label={alt}>
        {fallbackLabel ? (
          <span className="px-3 text-center font-display text-lg font-bold text-[#b5bab0]">{fallbackLabel}</span>
        ) : (
          <ImageOff className="h-6 w-6" />
        )}
      </div>
    );
  }
  const url = assetUrl(src);
  if (fit === "contain") {
    return (
      <div className={`relative isolate overflow-hidden bg-[#eceee9] ${className}`}>
        <img src={url} alt="" aria-hidden className="absolute inset-0 -z-10 h-full w-full scale-125 object-cover opacity-60 blur-2xl" />
        <img src={url} alt={alt} loading="lazy" onError={() => setBrokenSrc(src)} className="h-full w-full object-contain" />
      </div>
    );
  }
  return <img src={url} alt={alt} loading="lazy" onError={() => setBrokenSrc(src)} className={`object-cover ${className}`} />;
}

export function Confirm({ open, title, children, confirmLabel = "Confirm", tone = "danger", busy, onConfirm, onCancel }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-neel-950/40 p-4" onClick={onCancel}>
      <div role="dialog" aria-modal="true" className="panel w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold">{title}</h2>
        {children && <div className="mt-2 text-sm text-muted">{children}</div>}
        <div className="mt-6 flex justify-end gap-2">
          <button className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button className={`btn ${tone === "danger" ? "btn-danger" : "btn-dark"}`} onClick={onConfirm} disabled={busy}>
            {busy && <Spinner className="h-4 w-4" />} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Small key/value block used on detail pages
export function Fact({ label, children }) {
  return (
    <div>
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold">{children || "—"}</dd>
    </div>
  );
}

export function Stat({ label, value, to, note }) {
  const body = (
    <>
      <div className="text-[13.5px] text-muted">{label}</div>
      <div className="num mt-1 font-display text-[30px] font-bold leading-none">{value ?? "—"}</div>
      {note && <div className="mt-2 text-[12.5px] text-muted">{note}</div>}
    </>
  );
  return to ? (
    <Link to={to} className="panel block p-5 transition-colors hover:border-line-strong">
      {body}
    </Link>
  ) : (
    <div className="panel p-5">{body}</div>
  );
}