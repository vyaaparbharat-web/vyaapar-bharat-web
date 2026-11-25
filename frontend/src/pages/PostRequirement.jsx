// import { useEffect, useState } from "react";
// import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
// import { CheckCircle2 } from "lucide-react";
// import { api } from "../lib/api";
// import { useAuth } from "../context/AuthContext";
// import { useToast } from "../context/ToastContext";
// import { REQUIREMENT_CATEGORIES, UNITS } from "../lib/constants";
// import { Field, FormError, PageHeader, PageLoader, Spinner } from "../components/ui";

// const EMPTY = {
//   title: "",
//   category: "",
//   subcategory: "",
//   quantity: "",
//   unit: "",
//   description: "",
//   minBudget: "",
//   maxBudget: "",
//   deliveryLocation: "",
//   requiredBy: "",
// };

// const today = () => new Date().toISOString().slice(0, 10);

// // Create a requirement (or edit one: /requirements/:id/edit). Always saved under the logged-in account.
// export default function PostRequirement() {
//   const { id } = useParams();
//   const editing = Boolean(id);
//   const { user } = useAuth();
//   const toast = useToast();
//   const navigate = useNavigate();
//   const location = useLocation();
//   // "Request a quote" from a product page
//   const [fromProduct] = useState(() => {
//     if (editing) return null;
//     if (location.state?.prefill) return location.state;
//     try {
//       return JSON.parse(sessionStorage.getItem("vb_prefill") || "null");
//     } catch {
//       return null;
//     }
//   });
//   const prefill = fromProduct?.prefill;

//   const [form, setForm] = useState(() => ({ ...EMPTY, deliveryLocation: user?.city || "", ...(prefill || {}) }));
//   const [loading, setLoading] = useState(editing);
//   const [busy, setBusy] = useState(false);
//   const [error, setError] = useState("");
//   const [errors, setErrors] = useState({});
//   const [posted, setPosted] = useState(null);

//   useEffect(() => { sessionStorage.removeItem("vb_prefill"); }, []);

//   useEffect(() => {
//     if (!editing) return;
//     api(`/api/requirements/${id}`)
//       .then(({ requirement: r, viewer }) => {
//         if (!viewer?.canManage) {
//           toast("You can only edit your own requirements.", "error");
//           navigate(`/requirements/${id}`, { replace: true });
//           return;
//         }
//         setForm({
//           title: r.title || "",
//           category: r.category || "",
//           subcategory: r.subcategory || "",
//           quantity: r.quantity ?? "",
//           unit: r.unit || "",
//           description: r.description || "",
//           minBudget: r.min_budget ?? "",
//           maxBudget: r.max_budget ?? "",
//           deliveryLocation: r.delivery_location || "",
//           requiredBy: r.required_by ? String(r.required_by).slice(0, 10) : "",
//         });
//         setLoading(false);
//       })
//       .catch((err) => {
//         setError(err.message);
//         setLoading(false);
//       });
//   }, [editing, id, navigate, toast]);

//   const set = (e) => {
//     const { name, value } = e.target;
//     setForm((f) => ({ ...f, [name]: value }));
//     if (errors[name]) setErrors((x) => ({ ...x, [name]: null }));
//   };

//   const validate = () => {
//     const e = {};
//     if (!form.title.trim()) e.title = "Say what you need.";
//     if (!form.category) e.category = "Choose a category.";
//     if (!form.quantity || Number(form.quantity) <= 0) e.quantity = "Enter a quantity.";
//     if (!form.unit.trim()) e.unit = "Choose a unit.";
//     if (!form.deliveryLocation.trim()) e.deliveryLocation = "Where should it be delivered?";
//     if (!form.description.trim()) e.description = "Add a few details so suppliers can quote accurately.";
//     if (form.minBudget && form.maxBudget && Number(form.minBudget) > Number(form.maxBudget)) e.maxBudget = "Should be more than the minimum.";
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const submit = async (e) => {
//     e.preventDefault();
//     setError("");
//     if (!validate()) return;
//     setBusy(true);
//     try {
//       const data = await api(editing ? `/api/requirements/${id}` : "/api/requirements", {
//         method: editing ? "PUT" : "POST",
//         body: { ...form, productId: fromProduct?.productId },
//       });
//       if (editing) {
//         toast("Requirement updated");
//         navigate(`/requirements/${id}`);
//       } else {
//         setPosted(data.requirement);
//         window.scrollTo({ top: 0, behavior: "smooth" });
//       }
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setBusy(false);
//     }
//   };

//   if (loading) return <PageLoader />;

//   if (posted) {
//     return (
//       <div className="panel mx-auto max-w-xl p-8 text-center">
//         <CheckCircle2 className="mx-auto h-10 w-10 text-ok" />
//         <h1 className="mt-4 text-[26px] font-bold">Requirement posted</h1>
//         <p className="mt-2 text-muted">
//           Suppliers can now see “{posted.title}” and send you quotes. We'll show every quote on the requirement page, visible only to you.
//         </p>
//         <div className="mt-6 flex flex-wrap justify-center gap-2">
//           <Link to={`/requirements/${posted.id}`} className="btn btn-dark">
//             View requirement
//           </Link>
//           <button
//             className="btn btn-outline"
//             onClick={() => {
//               setPosted(null);
//               setForm({ ...EMPTY, deliveryLocation: form.deliveryLocation });
//             }}
//           >
//             Post another
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <PageHeader
//         title={editing ? "Edit requirement" : "Post a requirement"}
//         description={editing ? "Suppliers who already quoted will see the updated details." : "The more specific you are, the more accurate the quotes."}
//         back={editing ? { to: `/requirements/${id}`, label: "Back to requirement" } : null}
//       />

//       <form onSubmit={submit} noValidate className="panel divide-y divide-line">
//         <fieldset className="grid gap-5 p-6 sm:p-7">
//           <legend className="sr-only">What you need</legend>
//           <h2 className="text-[18px] font-bold">What do you need?</h2>
//           <Field label="Title" htmlFor="title" error={errors.title} hint="e.g. 500 pcs 6205 ball bearings, SKF or equivalent">
//             <input id="title" name="title" className="input" value={form.title} onChange={set} maxLength={200} aria-invalid={Boolean(errors.title)} />
//           </Field>
//           <div className="grid gap-5 sm:grid-cols-2">
//             <Field label="Category" htmlFor="category" error={errors.category}>
//               <select id="category" name="category" className="input" value={form.category} onChange={set} aria-invalid={Boolean(errors.category)}>
//                 <option value="">Choose a category</option>
//                 {REQUIREMENT_CATEGORIES.map((c) => (
//                   <option key={c}>{c}</option>
//                 ))}
//                 {form.category && !REQUIREMENT_CATEGORIES.includes(form.category) && <option>{form.category}</option>}
//               </select>
//             </Field>
//             <Field label="Product type" htmlFor="subcategory" optional>
//               <input id="subcategory" name="subcategory" className="input" value={form.subcategory} onChange={set} placeholder="e.g. Ball bearings" />
//             </Field>
//           </div>
//           <div className="grid grid-cols-2 gap-5">
//             <Field label="Quantity" htmlFor="quantity" error={errors.quantity}>
//               <input id="quantity" name="quantity" type="number" min="1" className="input num" value={form.quantity} onChange={set} aria-invalid={Boolean(errors.quantity)} />
//             </Field>
//             <Field label="Unit" htmlFor="unit" error={errors.unit}>
//               <select id="unit" name="unit" className="input" value={form.unit} onChange={set} aria-invalid={Boolean(errors.unit)}>
//                 <option value="">Choose</option>
//                 {UNITS.map((u) => (
//                   <option key={u}>{u}</option>
//                 ))}
//                 {form.unit && !UNITS.includes(form.unit) && <option>{form.unit}</option>}
//               </select>
//             </Field>
//           </div>
//           <Field label="Details" htmlFor="description" error={errors.description} hint="Size, grade, brand, packaging, GST invoice needed, etc.">
//             <textarea id="description" name="description" className="input min-h-[130px]" value={form.description} onChange={set} aria-invalid={Boolean(errors.description)} />
//           </Field>
//         </fieldset>

//         <fieldset className="grid gap-5 p-6 sm:p-7">
//           <h2 className="text-[18px] font-bold">Delivery and budget</h2>
//           <div className="grid gap-5 sm:grid-cols-2">
//             <Field label="Delivery city" htmlFor="deliveryLocation" error={errors.deliveryLocation}>
//               <input
//                 id="deliveryLocation"
//                 name="deliveryLocation"
//                 className="input"
//                 value={form.deliveryLocation}
//                 onChange={set}
//                 placeholder="e.g. Ludhiana, Punjab"
//                 aria-invalid={Boolean(errors.deliveryLocation)}
//               />
//             </Field>
//             <Field label="Needed by" htmlFor="requiredBy" optional>
//               <input id="requiredBy" name="requiredBy" type="date" min={editing ? undefined : today()} className="input" value={form.requiredBy} onChange={set} />
//             </Field>
//             <Field label="Budget from (₹)" htmlFor="minBudget" optional>
//               <input id="minBudget" name="minBudget" type="number" min="0" className="input num" value={form.minBudget} onChange={set} />
//             </Field>
//             <Field label="Budget up to (₹)" htmlFor="maxBudget" optional error={errors.maxBudget}>
//               <input id="maxBudget" name="maxBudget" type="number" min="0" className="input num" value={form.maxBudget} onChange={set} aria-invalid={Boolean(errors.maxBudget)} />
//             </Field>
//           </div>
//         </fieldset>

//         <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
//           <p className="text-[13.5px] text-muted">
//             Posting as <span className="font-semibold text-ink">{user?.name}</span>
//             {user?.companyName ? `, ${user.companyName}` : ""}. Quotes are visible only to you.
//           </p>
//           <div className="flex flex-col gap-3 sm:items-end">
//             <FormError>{error}</FormError>
//             <button className="btn btn-primary btn-lg" disabled={busy}>
//               {busy && <Spinner className="h-4 w-4" />} {editing ? "Save changes" : "Post requirement"}
//             </button>
//           </div>
//         </div>
//       </form>
//     </>
//   );
// }



import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CheckCircle2, Phone } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { UNITS } from "../lib/constants";
import { useCategoryNames } from "../lib/categories";
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
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  contactCompany: "",
  website: "", // hidden spam trap, real people never fill it
};

const PHONE_RE = /^(\+?91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const today = () => new Date().toISOString().slice(0, 10);

// Create a requirement (or edit one: /requirements/:id/edit). Always saved under the logged-in account.
export default function PostRequirement() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user, isSupplier } = useAuth();
  const isGuest = !user;
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
  const [searchParams] = useSearchParams(); // /post-requirement?category=Tyres from a category page
  const categories = useCategoryNames();

  const [form, setForm] = useState(() => ({
    ...EMPTY,
    contactName: user?.name || "",
    contactPhone: user?.phone || "",
    contactEmail: user?.email || "",
    contactCompany: user?.companyName || "",
    deliveryLocation: user?.city || "",
    category: (!editing && searchParams.get("category")) || "",
    ...(prefill || {}),
  }));
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
          contactName: r.buyer_name || "",
          contactPhone: r.buyer_phone || "",
          contactEmail: r.buyer_email || "",
          contactCompany: r.buyer_company || "",
          website: "",
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
    if (!form.contactName.trim()) e.contactName = "Enter your name.";
    if (form.contactPhone.trim() && !PHONE_RE.test(form.contactPhone.trim())) e.contactPhone = "Enter a valid 10-digit mobile number.";
    else if (isGuest && !form.contactPhone.trim()) e.contactPhone = "Enter your mobile number so suppliers can call you.";
    if (form.contactEmail.trim() && !EMAIL_RE.test(form.contactEmail.trim())) e.contactEmail = "Enter a valid email address.";
    if (!form.contactPhone.trim() && !form.contactEmail.trim()) e.contactPhone = "Add a mobile number or email.";
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
        setPosted({ ...data.requirement, guest: Boolean(data.guest) });
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader />;

  if (isSupplier && !editing) {
    return (
      <div className="panel mx-auto max-w-xl p-8 text-center">
        <h1 className="text-[24px] font-bold">You're logged in as a supplier</h1>
        <p className="mt-2 text-muted">Requirements are posted by buyers. Browse open requirements and send quotes instead.</p>
        <Link to="/requirements" className="btn btn-primary mt-6">
          See buyer requirements
        </Link>
      </div>
    );
  }

  if (posted) {
    const keep = {
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      contactEmail: form.contactEmail,
      contactCompany: form.contactCompany,
      deliveryLocation: form.deliveryLocation,
    };
    return (
      <div className="panel mx-auto max-w-xl p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-ok" />
        <h1 className="mt-4 text-[26px] font-bold">Requirement posted</h1>
        {posted.guest ? (
          <>
            <p className="mt-2 text-muted">
              Suppliers can now see “{posted.title}” and will call you on <span className="num font-semibold text-ink">{form.contactPhone}</span>.
            </p>
            <p className="mt-4 rounded-[12px] bg-neel-50 p-4 text-[14px] text-ink">
              Want to see quotes online and manage this requirement? Create a free account with the same mobile number or email. This requirement will move into
              your account automatically.
            </p>
          </>
        ) : (
          <p className="mt-2 text-muted">
            Suppliers can now see “{posted.title}” and send you quotes. Every quote shows on the requirement page, visible only to you.
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link to={`/requirements/${posted.id}`} className="btn btn-dark">
            View requirement
          </Link>
          {posted.guest && (
            <Link to="/login?mode=register" className="btn btn-primary">
              Create free account
            </Link>
          )}
          <button
            className="btn btn-outline"
            onClick={() => {
              setPosted(null);
              setForm({ ...EMPTY, ...keep });
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
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
                {form.category && !categories.includes(form.category) && <option>{form.category}</option>}
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

        <fieldset className="grid gap-5 p-6 sm:p-7">
          <div>
            <h2 className="text-[18px] font-bold">Your contact details</h2>
            <p className="mt-1 text-[14px] text-muted">Shown on the requirement so suppliers can call, WhatsApp or email you directly.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Your name" htmlFor="contactName" error={errors.contactName}>
              <input id="contactName" name="contactName" className="input" value={form.contactName} onChange={set} autoComplete="name" aria-invalid={Boolean(errors.contactName)} />
            </Field>
            <Field label="Company / shop name" htmlFor="contactCompany" optional>
              <input id="contactCompany" name="contactCompany" className="input" value={form.contactCompany} onChange={set} autoComplete="organization" />
            </Field>
            <Field label="Mobile number" htmlFor="contactPhone" error={errors.contactPhone} optional={!isGuest}>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-subtle" />
                <input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  inputMode="tel"
                  className="input pl-10"
                  value={form.contactPhone}
                  onChange={set}
                  autoComplete="tel"
                  placeholder="98765 43210"
                  aria-invalid={Boolean(errors.contactPhone)}
                />
              </div>
            </Field>
            <Field label="Email" htmlFor="contactEmail" error={errors.contactEmail} optional>
              <input
                id="contactEmail"
                name="contactEmail"
                type="email"
                className="input"
                value={form.contactEmail}
                onChange={set}
                autoComplete="email"
                aria-invalid={Boolean(errors.contactEmail)}
              />
            </Field>
          </div>
          {/* Spam trap: hidden from people, bots fill it in */}
          <input type="text" name="website" value={form.website} onChange={set} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
        </fieldset>

        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <p className="text-[13.5px] text-muted">
            {isGuest ? (
              <>
                No account needed.{" "}
                <Link to="/login" state={{ from: "/post-requirement" }} className="link">
                  Log in
                </Link>{" "}
                to see quotes online.
              </>
            ) : (
              <>
                Posting from <span className="font-semibold text-ink">{user?.companyName || user?.name}</span>. Quotes are visible only to you.
              </>
            )}
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