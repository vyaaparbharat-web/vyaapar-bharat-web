import { useState } from "react";
import { Field, FormError, Spinner } from "./ui";
import ImageUpload from "./ImageUpload";
import { companyToForm } from "../lib/forms";
import { BUSINESS_TYPES } from "../lib/constants";
import { isMapsLink, mapsUrl } from "../lib/maps";

// Admins can set "verified"; suppliers editing their own profile can't.
export default function CompanyForm({
  initial,
  onSubmit,
  allowVerify = false,
  submitLabel = "Save company",
}) {
  const [form, setForm] = useState(() => companyToForm(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (e) =>
    setForm((f) => ({
      ...f,
      [e.target.name]:
        e.target.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  // Link used by "Check the map link": the saved Google Maps link, or a search for the address
  const previewMap = mapsUrl({
    name: form.name,
    address: form.address,
    location: form.location,
    map_url: isMapsLink(form.mapUrl) ? form.mapUrl : null,
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError("Company name is required.");
    if (form.mapUrl.trim() && !isMapsLink(form.mapUrl)) {
      return setError(
        "The Google Maps link should start with https://maps.app.goo.gl/ or https://www.google.com/maps/",
      );
    }
    setError("");
    setBusy(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="panel divide-y divide-line">
      <div className="grid gap-5 p-6 sm:p-7">
        <h2 className="text-[18px] font-bold">Business</h2>
        <Field label="Company name" htmlFor="name">
          <input
            id="name"
            name="name"
            className="input"
            value={form.name}
            onChange={set}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Business type" htmlFor="businessType" optional>
            <select
              id="businessType"
              name="businessType"
              className="input"
              value={form.businessType}
              onChange={set}
            >
              <option value="">Choose</option>
              {BUSINESS_TYPES.map((b) => (
                <option key={b}>{b}</option>
              ))}
              {form.businessType &&
                !BUSINESS_TYPES.includes(form.businessType) && (
                  <option>{form.businessType}</option>
                )}
            </select>
          </Field>
          <Field label="Industry" htmlFor="industry" optional>
            <input
              id="industry"
              name="industry"
              className="input"
              value={form.industry}
              onChange={set}
              placeholder="e.g. Transport"
            />
          </Field>
          <Field label="Years in business" htmlFor="yearsInBusiness" optional>
            <input
              id="yearsInBusiness"
              name="yearsInBusiness"
              type="number"
              min="0"
              className="input num"
              value={form.yearsInBusiness}
              onChange={set}
            />
          </Field>
        </div>
        <Field label="About the business" htmlFor="description" optional>
          <textarea
            id="description"
            name="description"
            className="input"
            value={form.description}
            onChange={set}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Services"
            htmlFor="services"
            optional
            hint="Separate with commas."
          >
            <input
              id="services"
              name="services"
              className="input"
              value={form.services}
              onChange={set}
              placeholder="Full truck load, Part load"
            />
          </Field>
          <Field
            label="Service areas"
            htmlFor="serviceAreas"
            optional
            hint="Separate with commas."
          >
            <input
              id="serviceAreas"
              name="serviceAreas"
              className="input"
              value={form.serviceAreas}
              onChange={set}
              placeholder="Punjab, Himachal, J&K"
            />
          </Field>
        </div>
      </div>

      <div className="grid gap-5 p-6 sm:grid-cols-2 sm:p-7">
        <h2 className="text-[18px] font-bold sm:col-span-2">Contact</h2>
        <Field label="Phone" htmlFor="phone" optional>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="input"
            value={form.phone}
            onChange={set}
          />
        </Field>
        <Field label="Email" htmlFor="email" optional>
          <input
            id="email"
            name="email"
            type="email"
            className="input"
            value={form.email}
            onChange={set}
          />
        </Field>
        <Field label="City / location" htmlFor="location" optional>
          <input
            id="location"
            name="location"
            className="input"
            value={form.location}
            onChange={set}
            placeholder="Ludhiana, Punjab"
          />
        </Field>
        <Field label="Address" htmlFor="address" optional>
          <input
            id="address"
            name="address"
            className="input"
            value={form.address}
            onChange={set}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field
            label="Google Maps link"
            htmlFor="mapUrl"
            optional
            hint="Open your business on Google Maps, tap Share, copy the link and paste it here. Without it, we search Google Maps for your address."
          >
            <input
              id="mapUrl"
              name="mapUrl"
              type="url"
              inputMode="url"
              className="input"
              value={form.mapUrl}
              onChange={set}
              placeholder="https://maps.app.goo.gl/..."
            />
          </Field>
          {previewMap && (
            <a
              href={previewMap}
              target="_blank"
              rel="noopener noreferrer"
              className="link mt-2 inline-block text-[13.5px]"
            >
              Check the map link
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-5 p-6 sm:p-7">
        <h2 className="text-[18px] font-bold">Photos</h2>
        <Field
          label="Cover image"
          optional
          hint="Shown on your card in the supplier directory."
        >
          <ImageUpload
            endpoint="/api/suppliers/upload-images"
            field="images"
            value={form.imageUrl}
            onChange={(v) => setForm((f) => ({ ...f, imageUrl: v }))}
            label="Add image"
          />
        </Field>
        <Field label="Gallery" optional>
          <ImageUpload
            endpoint="/api/suppliers/upload-images"
            field="images"
            multiple
            value={form.galleryImages}
            onChange={(v) => setForm((f) => ({ ...f, galleryImages: v }))}
            label="Add photos"
          />
        </Field>
        {allowVerify && (
          <label className="flex items-start gap-3 rounded-[12px] border border-line p-4">
            <input
              type="checkbox"
              name="verified"
              checked={form.verified}
              onChange={set}
              className="mt-1 h-4 w-4 accent-neel-900"
            />
            <span>
              <span className="block font-semibold">Verified business</span>
              <span className="block text-[13.5px] text-muted">
                Shows the verified badge. Only tick after checking GST /
                documents.
              </span>
            </span>
          </label>
        )}
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
