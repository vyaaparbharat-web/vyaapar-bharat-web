import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useApi } from "../lib/useApi";
import { useToast } from "../context/ToastContext";
import { date } from "../lib/format";
import { INSIGHT_CATEGORIES } from "../lib/constants";
import ImageUpload from "../components/ImageUpload";
import AdminTable from "../components/AdminTable";
import { Confirm, Field, FormError, PageHeader, Spinner } from "../components/ui";

const EMPTY = { title: "", category_id: INSIGHT_CATEGORIES[0].id, excerpt: "", content: "", image_url: null };

function InsightEditor({ initial, onDone, onCancel }) {
  const toast = useToast();
  const [form, setForm] = useState(() =>
    initial ? { title: initial.title, category_id: initial.category_id, excerpt: initial.excerpt, content: initial.content, image_url: initial.image_url } : EMPTY,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const category = INSIGHT_CATEGORIES.find((c) => c.id === form.category_id);
    setBusy(true);
    setError("");
    try {
      await api(initial ? `/api/insights/${initial.id}` : "/api/insights", {
        method: initial ? "PUT" : "POST",
        body: { ...form, category: category?.name || form.category_id },
      });
      toast(initial ? "Article saved" : "Article published");
      onDone();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="panel mb-6 grid gap-5 p-6">
      <h2 className="text-[19px] font-bold">{initial ? "Edit article" : "New article"}</h2>
      <div className="grid gap-5 sm:grid-cols-[1fr_240px]">
        <Field label="Title" htmlFor="i-title">
          <input id="i-title" name="title" className="input" value={form.title} onChange={set} />
        </Field>
        <Field label="Topic" htmlFor="i-cat">
          <select id="i-cat" name="category_id" className="input" value={form.category_id} onChange={set}>
            {INSIGHT_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Summary" htmlFor="i-excerpt" hint="One or two sentences shown on the list.">
        <textarea id="i-excerpt" name="excerpt" className="input !min-h-[80px]" value={form.excerpt} onChange={set} />
      </Field>
      <Field label="Article" htmlFor="i-content">
        <textarea id="i-content" name="content" className="input !min-h-[240px]" value={form.content} onChange={set} />
      </Field>
      <Field label="Cover image" optional>
        <ImageUpload endpoint="/api/insights/upload-image" value={form.image_url} onChange={(v) => setForm((f) => ({ ...f, image_url: v }))} label="Add cover" />
      </Field>
      <FormError>{error}</FormError>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn btn-primary" disabled={busy}>
          {busy && <Spinner className="h-4 w-4" />} {initial ? "Save article" : "Publish article"}
        </button>
      </div>
    </form>
  );
}

export default function InsightsAdmin() {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/api/insights");
  const [editing, setEditing] = useState(null); // null | "new" | insight
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/api/insights/${deleting.id}`, { method: "DELETE" });
      toast("Article deleted");
      setDeleting(null);
      reload();
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Insights"
        description="Articles shown on the Insights page."
        actions={
          !editing && (
            <button className="btn btn-primary" onClick={() => setEditing("new")}>
              New article
            </button>
          )
        }
      />
      {editing && (
        <InsightEditor
          key={editing === "new" ? "new" : editing.id}
          initial={editing === "new" ? null : editing}
          onCancel={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
      <AdminTable
        rows={data?.insights}
        loading={loading}
        error={error}
        onRetry={reload}
        placeholder="Search articles"
        searchKeys={["title", "category", "excerpt"]}
        columns={[
          {
            key: "title",
            label: "Article",
            render: (i) => (
              <Link to={`/insights/${i.id}`} className="font-semibold hover:text-neel-700">
                {i.title}
              </Link>
            ),
          },
          { key: "category", label: "Topic" },
          { key: "created_at", label: "Published", className: "whitespace-nowrap text-muted", render: (i) => date(i.created_at) },
          {
            key: "actions",
            label: "",
            className: "whitespace-nowrap",
            render: (i) => (
              <>
                <button
                  className="btn btn-ghost btn-sm !px-2"
                  onClick={() => {
                    setEditing(i);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  aria-label="Edit article"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="btn btn-ghost btn-sm !px-2 text-bad" onClick={() => setDeleting(i)} aria-label="Delete article">
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            ),
          },
        ]}
      />
      <Confirm open={Boolean(deleting)} title="Delete this article?" confirmLabel="Delete" busy={busy} onConfirm={remove} onCancel={() => setDeleting(null)}>
        “{deleting?.title}” will be removed from the website.
      </Confirm>
    </>
  );
}
