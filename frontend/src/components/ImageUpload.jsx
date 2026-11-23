import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { api, assetUrl } from "../lib/api";
import { Spinner } from "./ui";

// Uploads to the API and returns stored paths.
// single: value is a string | null. multiple: value is a string[].
export default function ImageUpload({ endpoint, field = "image", multiple = false, value, onChange, label = "Add image" }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const images = multiple ? value || [] : value ? [value] : [];

  const upload = async (files) => {
    if (!files.length) return;
    setError("");
    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) return setError(`${f.name} is larger than 5 MB.`);
    }
    const body = new FormData();
    files.forEach((f) => body.append(field, f));
    setBusy(true);
    try {
      const data = await api(endpoint, { method: "POST", body });
      const paths = data.images || [data.image_url];
      onChange(multiple ? [...images, ...paths] : paths[0]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const remove = (path) => onChange(multiple ? images.filter((p) => p !== path) : null);

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {images.map((src) => (
          <div key={src} className="relative h-24 w-32 overflow-hidden rounded-[10px] border border-line bg-page">
            <img src={assetUrl(src)} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => remove(src)}
              className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        {(multiple || images.length === 0) && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="grid h-24 w-32 place-items-center rounded-[10px] border border-dashed border-line-strong bg-white text-[13px] text-muted hover:border-ink hover:text-ink"
          >
            {busy ? (
              <Spinner />
            ) : (
              <span className="flex flex-col items-center gap-1">
                <ImagePlus className="h-5 w-5" /> {label}
              </span>
            )}
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} hidden onChange={(e) => upload([...e.target.files])} />
      <p className={`hint ${error ? "!text-bad" : ""}`}>{error || "JPG, PNG or WEBP, up to 5 MB each."}</p>
    </div>
  );
}
