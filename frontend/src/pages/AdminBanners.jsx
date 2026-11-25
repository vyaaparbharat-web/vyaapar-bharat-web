import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, Pencil, Trash2, X } from "lucide-react";
import { api, assetUrl } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useToast } from "../context/ToastContext";
import { date } from "../lib/format";
import ImageUpload from "../components/ImageUpload";
import { Badge, Confirm, EmptyState, ErrorState, Field, FormError, PageHeader, PageLoader, Spinner } from "../components/ui";

const EMPTY = { title: "", imageUrl: null, linkUrl: "", startsAt: "", endsAt: "", isActive: true };
const day = (d) => (d ? String(d).slice(0, 10) : "");
const toForm = (b) => ({
  title: b.title || "",
  imageUrl: b.image_url || null,
  linkUrl: b.link_url || "",
  startsAt: day(b.starts_at),
  endsAt: day(b.ends_at),
  isActive: b.is_active !== false,
});

// Live / Hidden / Scheduled / Ended, worked out from the switch and the dates
function status(b) {
  const now = Date.now();
  if (!b.is_active) return { tone: "muted", label: "Hidden" };
  if (b.starts_at && new Date(b.starts_at).getTime() > now) return { tone: "warn", label: `Starts ${date(b.starts_at)}` };
  if (b.ends_at && new Date(b.ends_at).getTime() + 86400000 < now) return { tone: "bad", label: "Ended" };
  return { tone: "ok", label: "Live" };
}

// ---------- add / edit ----------
function BannerForm({ editing, onSaved, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState(() => (editing ? toForm(editing) : EMPTY));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // The form opens at the top of the page: bring it into view
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  const set = (e) => {
    setError("");
    setForm((f) => ({ ...f, [e.target.name]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.imageUrl) return setError("Upload the banner image.");
    if (!form.title.trim()) return setError("Give the banner a name.");
    const link = form.linkUrl.trim();
    if (link && !link.startsWith("/") && !/^https?:\/\//i.test(link)) return setError("Link should start with / (a page on this site) or https://");
    if (form.startsAt && form.endsAt && form.endsAt < form.startsAt) return setError("End date should be after the start date.");

    setBusy(true);
    try {
      const data = await api(editing ? `/api/admin/banners/${editing.id}` : "/api/admin/banners", {
        method: editing ? "PUT" : "POST",
        // keep the current position when editing
        body: { ...form, linkUrl: link, ...(editing ? { sortOrder: editing.sort_order } : {}) },
      });
      toast(data.message || (editing ? "Banner saved" : "Banner added"));
      onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form ref={ref} onSubmit={submit} noValidate className="panel mb-6 scroll-mt-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-[18px] font-bold">{editing ? `Edit ${editing.title}` : "New banner"}</h2>
        <button type="button" onClick={onCancel} className="rounded-md p-1.5 text-muted hover:bg-page hover:text-ink" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Field label="Banner image" hint="Wide image, about 1620 × 600 px (2.7 : 1). JPG, PNG or WEBP, up to 5 MB.">
            {form.imageUrl ? (
              <div className="relative overflow-hidden rounded-[12px] border border-line">
                <img src={assetUrl(form.imageUrl)} alt="" className="aspect-[2.7/1] w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, imageUrl: null }))}
                  className="absolute right-2 top-2 rounded-full bg-black/60 px-3 py-1 text-[13px] font-medium text-white hover:bg-black/80"
                >
                  Change image
                </button>
              </div>
            ) : (
              <ImageUpload endpoint="/api/admin/banners/upload-image" value={null} onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))} label="Upload banner" />
            )}
          </Field>
        </div>

        <div className="grid content-start gap-5">
          <Field label="Name" htmlFor="b-title" hint="Shown under the slideshow, e.g. the business name.">
            <input id="b-title" name="title" className="input" value={form.title} onChange={set} placeholder="AR Roadline" />
          </Field>
          <Field label="Link" htmlFor="b-link" optional hint="Where a click goes. A page here like /suppliers/… or a website starting with https://">
            <input id="b-link" name="linkUrl" className="input" value={form.linkUrl} onChange={set} placeholder="/suppliers/6b07…  or  https://…" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Show from" htmlFor="b-start" optional>
              <input id="b-start" name="startsAt" type="date" className="input" value={form.startsAt} onChange={set} />
            </Field>
            <Field label="Show until" htmlFor="b-end" optional>
              <input id="b-end" name="endsAt" type="date" className="input" value={form.endsAt} onChange={set} />
            </Field>
          </div>
          <label className="flex items-center gap-2.5 text-[14.5px]">
            <input type="checkbox" name="isActive" checked={form.isActive} onChange={set} className="h-4 w-4 accent-neel-700" />
            Show on the home page
          </label>
        </div>
      </div>

      <FormError>{error}</FormError>
      <div className="mt-5 flex gap-2">
        <button className="btn btn-primary" disabled={busy}>
          {busy && <Spinner className="h-4 w-4" />} {editing ? "Save banner" : "Add banner"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

// ---------- page ----------
export default function AdminBanners() {
  const toast = useToast();
  const { data, loading, error, reload, setData } = useApi("/api/admin/banners");
  const banners = data?.banners || [];
  const [panel, setPanel] = useState(null); // { editing: banner | null }
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const saved = () => {
    setPanel(null);
    reload();
  };

  const move = async (i, d) => {
    const next = [...banners];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setData((x) => ({ ...x, banners: next }));
    try {
      await api("/api/admin/banners/reorder", { method: "POST", body: { ids: next.map((b) => b.id) } });
    } catch (err) {
      toast(err.message, "error");
      reload();
    }
  };

  const toggle = async (b) => {
    try {
      const res = await api(`/api/admin/banners/${b.id}/active`, { method: "PATCH", body: { isActive: !b.is_active } });
      setData((x) => ({ ...x, banners: x.banners.map((y) => (y.id === b.id ? { ...y, is_active: !b.is_active } : y)) }));
      toast(res.message || (b.is_active ? "Banner hidden" : "Banner is live"));
    } catch (err) {
      toast(err.message, "error");
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/admin/banners/${deleting.id}`, { method: "DELETE" });
      toast("Banner deleted");
      setDeleting(null);
      reload();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  const live = banners.filter((b) => status(b).label === "Live").length;

  return (
    <>
      <PageHeader
        title="Home page banners"
        description={`The "Featured on Vyapaar Bharat" slideshow. ${live} showing right now, in this order.`}
        actions={
          <button className="btn btn-primary" onClick={() => setPanel({ editing: null })}>
            Add banner
          </button>
        }
      />

      {panel && <BannerForm key={panel.editing?.id || "new"} editing={panel.editing} onSaved={saved} onCancel={() => setPanel(null)} />}

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : loading ? (
        <PageLoader />
      ) : banners.length === 0 ? (
        <EmptyState
          title="No banners yet"
          action={
            <button className="btn btn-primary" onClick={() => setPanel({ editing: null })}>
              Add banner
            </button>
          }
        >
          The slideshow is hidden on the home page until you add one.
        </EmptyState>
      ) : (
        <ol className="grid gap-3">
          {banners.map((b, i) => {
            const st = status(b);
            return (
              <li key={b.id} className={`panel flex flex-col gap-4 p-3 sm:flex-row sm:items-center ${st.label === "Live" ? "" : "opacity-75"}`}>
                <div className="flex items-center gap-3">
                  <span className="num w-6 text-center text-[14px] font-semibold text-muted">{i + 1}</span>
                  <img src={assetUrl(b.image_url)} alt="" className="aspect-[2.7/1] w-full rounded-[10px] border border-line object-cover sm:w-[260px]" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{b.title}</span>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                  {b.link_url ? (
                    <a href={b.link_url} target="_blank" rel="noopener noreferrer" className="mt-1 flex max-w-full items-center gap-1 truncate text-[13px] text-muted hover:text-neel-700">
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{b.link_url}</span>
                    </a>
                  ) : (
                    <div className="mt-1 text-[13px] text-muted">Not clickable</div>
                  )}
                  {(b.starts_at || b.ends_at) && (
                    <div className="mt-1 text-[13px] text-muted">
                      {b.starts_at ? date(b.starts_at) : "Now"} to {b.ends_at ? date(b.ends_at) : "no end date"}
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1 self-end sm:self-center">
                  <button className="btn btn-ghost btn-sm !px-2" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${b.title} up`}>
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button className="btn btn-ghost btn-sm !px-2" disabled={i === banners.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${b.title} down`}>
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button className="btn btn-ghost btn-sm !px-2" onClick={() => toggle(b)} aria-label={b.is_active ? `Hide ${b.title}` : `Show ${b.title}`} title={b.is_active ? "Hide" : "Show"}>
                    {b.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button className="btn btn-ghost btn-sm !px-2" onClick={() => setPanel({ editing: b })} aria-label={`Edit ${b.title}`}>
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button className="btn btn-ghost btn-sm !px-2 text-bad" onClick={() => setDeleting(b)} aria-label={`Delete ${b.title}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <Confirm open={Boolean(deleting)} title={`Delete ${deleting?.title}?`} confirmLabel="Delete banner" busy={busy} onConfirm={remove} onCancel={() => setDeleting(null)}>
        It will be removed from the home page. To take it down for a while instead, use the eye button to hide it.
      </Confirm>
    </>
  );
}