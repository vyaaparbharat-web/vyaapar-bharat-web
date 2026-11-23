import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { REQUIREMENT_CATEGORIES, UNITS } from "../lib/constants";
import { Field, FormError, PageHeader, PageLoader, Spinner } from "../components/ui";

const EMPTY = {
  title: "",
  category: "",
  subcategory: "",
  quantity: "",
  unit: "",
  description: "",
  minBudget: "",
  maxBudget: "",
  deliveryLocation: "",
  requiredBy: "",
};

const today = () => new Date().toISOString().slice(0, 10);

// Create a requirement (or edit one: /requirements/:id/edit). Always saved under the logged-in account.
export default function PostRequirement() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  // "Request a quote" from a product page
  const [fromProduct] = useState(() => {
    if (editing) return null;
    if (location.state?.prefill) return location.state;
    try {
      return JSON.parse(sessionStorage.getItem("vb_prefill") || "null");
    } catch {
      return null;
    }
  });
  const prefill = fromProduct?.prefill;

  const [form, setForm] = useState(() => ({ ...EMPTY, deliveryLocation: user?.city || "", ...(prefill || {}) }));
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [posted, setPosted] = useState(null);

  useEffect(() => { sessionStorage.removeItem("vb_prefill"); }, []);

  useEffect(() => {
    if (!editing) return;
    api(`/api/requirements/${id}`)
      .then(({ requirement: r, viewer }) => {
        if (!viewer?.canManage) {
          toast("You can only edit your own requirements.", "error");
          navigate(`/requirements/${id}`, { replace: true });
          return;
        }
        setForm({
          title: r.title || "",
          category: r.category || "",
          subcategory: r.subcategory || "",
          quantity: r.quantity ?? "",
          unit: r.unit || "",
          description: r.description || "",
          minBudget: r.min_budget ?? "",
          maxBudget: r.max_budget ?? "",
          deliveryLocation: r.delivery_location || "",
          requiredBy: r.required_by ? String(r.required_by).slice(0, 10) : "",
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [editing, id, navigate, toast]);

  const set = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((x) => ({ ...x, [name]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Say what you need.";
    if (!form.category) e.category = "Choose a category.";
    if (!form.quantity || Number(form.quantity) <= 0) e.quantity = "Enter a quantity.";
    if (!form.unit.trim()) e.unit = "Choose a unit.";
    if (!form.deliveryLocation.trim()) e.deliveryLocation = "Where should it be delivered?";
    if (!form.description.trim()) e.description = "Add a few details so suppliers can quote accurately.";
    if (form.minBudget && form.maxBudget && Number(form.minBudget) > Number(form.maxBudget)) e.maxBudget = "Should be more than the minimum.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setBusy(true);
    try {
      const data = await api(editing ? `/api/requirements/${id}` : "/api/requirements", {
        method: editing ? "PUT" : "POST",
        body: { ...form, productId: fromProduct?.productId },
      });
      if (editing) {
        toast("Requirement updated");
        navigate(`/requirements/${id}`);
      } else {
        setPosted(data.requirement);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader />;

  if (posted) {
    return (
      <div className="panel mx-auto max-w-xl p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-ok" />
        <h1 className="mt-4 text-[26px] font-bold">Requirement posted</h1>
        <p className="mt-2 text-muted">
          Suppliers can now see “{posted.title}” and send you quotes. We'll show every quote on the requirement page, visible only to you.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to={`/requirements/${posted.id}`} className="btn btn-dark">
            View requirement
          </Link>
          <button
            className="btn btn-outline"
            onClick={() => {
              setPosted(null);
              setForm({ ...EMPTY, deliveryLocation: form.deliveryLocation });
            }}
          >
            Post another
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={editing ? "Edit requirement" : "Post a requirement"}
        description={editing ? "Suppliers who already quoted will see the updated details." : "The more specific you are, the more accurate the quotes."}
        back={editing ? { to: `/requirements/${id}`, label: "Back to requirement" } : null}
      />

      <form onSubmit={submit} noValidate className="panel divide-y divide-line">
        <fieldset className="grid gap-5 p-6 sm:p-7">
          <legend className="sr-only">What you need</legend>
          <h2 className="text-[18px] font-bold">What do you need?</h2>
          <Field label="Title" htmlFor="title" error={errors.title} hint="e.g. 500 pcs 6205 ball bearings, SKF or equivalent">
            <input id="title" name="title" className="input" value={form.title} onChange={set} maxLength={200} aria-invalid={Boolean(errors.title)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" htmlFor="category" error={errors.category}>
              <select id="category" name="category" className="input" value={form.category} onChange={set} aria-invalid={Boolean(errors.category)}>
                <option value="">Choose a category</option>
                {REQUIREMENT_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
                {form.category && !REQUIREMENT_CATEGORIES.includes(form.category) && <option>{form.category}</option>}
              </select>
            </Field>
            <Field label="Product type" htmlFor="subcategory" optional>
              <input id="subcategory" name="subcategory" className="input" value={form.subcategory} onChange={set} placeholder="e.g. Ball bearings" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <Field label="Quantity" htmlFor="quantity" error={errors.quantity}>
              <input id="quantity" name="quantity" type="number" min="1" className="input num" value={form.quantity} onChange={set} aria-invalid={Boolean(errors.quantity)} />
            </Field>
            <Field label="Unit" htmlFor="unit" error={errors.unit}>
              <select id="unit" name="unit" className="input" value={form.unit} onChange={set} aria-invalid={Boolean(errors.unit)}>
                <option value="">Choose</option>
                {UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
                {form.unit && !UNITS.includes(form.unit) && <option>{form.unit}</option>}
              </select>
            </Field>
          </div>
          <Field label="Details" htmlFor="description" error={errors.description} hint="Size, grade, brand, packaging, GST invoice needed, etc.">
            <textarea id="description" name="description" className="input min-h-[130px]" value={form.description} onChange={set} aria-invalid={Boolean(errors.description)} />
          </Field>
        </fieldset>

        <fieldset className="grid gap-5 p-6 sm:p-7">
          <h2 className="text-[18px] font-bold">Delivery and budget</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Delivery city" htmlFor="deliveryLocation" error={errors.deliveryLocation}>
              <input
                id="deliveryLocation"
                name="deliveryLocation"
                className="input"
                value={form.deliveryLocation}
                onChange={set}
                placeholder="e.g. Ludhiana, Punjab"
                aria-invalid={Boolean(errors.deliveryLocation)}
              />
            </Field>
            <Field label="Needed by" htmlFor="requiredBy" optional>
              <input id="requiredBy" name="requiredBy" type="date" min={editing ? undefined : today()} className="input" value={form.requiredBy} onChange={set} />
            </Field>
            <Field label="Budget from (₹)" htmlFor="minBudget" optional>
              <input id="minBudget" name="minBudget" type="number" min="0" className="input num" value={form.minBudget} onChange={set} />
            </Field>
            <Field label="Budget up to (₹)" htmlFor="maxBudget" optional error={errors.maxBudget}>
              <input id="maxBudget" name="maxBudget" type="number" min="0" className="input num" value={form.maxBudget} onChange={set} aria-invalid={Boolean(errors.maxBudget)} />
            </Field>
          </div>
        </fieldset>

        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <p className="text-[13.5px] text-muted">
            Posting as <span className="font-semibold text-ink">{user?.name}</span>
            {user?.companyName ? `, ${user.companyName}` : ""}. Quotes are visible only to you.
          </p>
          <div className="flex flex-col gap-3 sm:items-end">
            <FormError>{error}</FormError>
            <button className="btn btn-primary btn-lg" disabled={busy}>
              {busy && <Spinner className="h-4 w-4" />} {editing ? "Save changes" : "Post requirement"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
