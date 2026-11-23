import { useState } from "react";
import { Field, FormError, Spinner } from "./ui";
import ImageUpload from "./ImageUpload";
import { productToForm } from "../lib/forms";
import { AVAILABILITY, REQUIREMENT_CATEGORIES, UNITS } from "../lib/constants";


// Used by admins (pick any company) and suppliers (always their own company)
export default function ProductForm({ initial, companies, onSubmit, submitLabel = "Save product" }) {
  const [form, setForm] = useState(() => productToForm(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Product name is required.");
    if (companies && !form.supplierId) return setError("Choose the company that sells this product.");
    setError("");
    setBusy(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="panel divide-y divide-line">
      <div className="grid gap-5 p-6 sm:p-7">
        {companies && (
          <Field label="Company" htmlFor="supplierId">
            <select id="supplierId" name="supplierId" className="input" value={form.supplierId} onChange={set}>
              <option value="">Choose a company</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.location ? `, ${c.location}` : ""}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Product name" htmlFor="name">
          <input id="name" name="name" className="input" value={form.name} onChange={set} placeholder="e.g. Truck tyre 10.00-20, 16 ply" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="category">
            <select id="category" name="category" className="input" value={form.category} onChange={set}>
              <option value="">Choose a category</option>
              {REQUIREMENT_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
              {form.category && !REQUIREMENT_CATEGORIES.includes(form.category) && <option>{form.category}</option>}
            </select>
          </Field>
          <Field label="Product type" htmlFor="subcategory" optional>
            <input id="subcategory" name="subcategory" className="input" value={form.subcategory} onChange={set} />
          </Field>
        </div>
        <Field label="Description" htmlFor="description" optional>
          <textarea id="description" name="description" className="input" value={form.description} onChange={set} placeholder="Specs, brand, sizes, packaging…" />
        </Field>
        <Field label="Photo" optional>
          <ImageUpload endpoint="/api/products/upload-image" value={form.imageUrl} onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))} label="Add photo" />
        </Field>
      </div>

      <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-7">
        <Field label="Price (₹)" htmlFor="price" optional hint="Leave empty to show “Ask for price”.">
          <input id="price" name="price" type="number" min="0" className="input num" value={form.price} onChange={set} />
        </Field>
        <Field label="Price per" htmlFor="priceUnit" optional>
          <select id="priceUnit" name="priceUnit" className="input" value={form.priceUnit} onChange={set}>
            <option value="">Choose unit</option>
            {UNITS.map((u) => (
              <option key={u}>{u}</option>
            ))}
            {form.priceUnit && !UNITS.includes(form.priceUnit) && <option>{form.priceUnit}</option>}
          </select>
        </Field>
        <Field label="Minimum order" htmlFor="moq" optional>
          <input id="moq" name="moq" type="number" min="0" className="input num" value={form.moq} onChange={set} />
        </Field>
        <Field label="Minimum order unit" htmlFor="moqUnit" optional>
          <select id="moqUnit" name="moqUnit" className="input" value={form.moqUnit} onChange={set}>
            <option value="">Choose unit</option>
            {UNITS.map((u) => (
              <option key={u}>{u}</option>
            ))}
            {form.moqUnit && !UNITS.includes(form.moqUnit) && <option>{form.moqUnit}</option>}
          </select>
        </Field>
        <Field label="Availability" htmlFor="availability">
          <select id="availability" name="availability" className="input" value={form.availability} onChange={set}>
            {AVAILABILITY.map((a) => (
              <option key={a}>{a}</option>
            ))}
            {form.availability && !AVAILABILITY.includes(form.availability) && <option>{form.availability}</option>}
          </select>
        </Field>
      </div>

      <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-end sm:p-7">
        <FormError>{error}</FormError>
        <button className="btn btn-primary btn-lg" disabled={busy}>
          {busy && <Spinner className="h-4 w-4" />} {submitLabel}
        </button>
      </div>
    </form>
  );
}
