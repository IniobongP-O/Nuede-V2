import { ImageOff, Upload } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";

import { catalogImageTypes, catalogImageValidationMessage } from "@nuede/validation/catalog";

import { catalogImageUrl } from "../api/imageApi.js";

export function CatalogImageField({ label, currentPath, file, onFileChange, disabled = false }) {
  const id = useId();
  const [error, setError] = useState("");
  const [failedPreviewUrl, setFailedPreviewUrl] = useState("");
  const localPreviewUrl = useMemo(() => file ? URL.createObjectURL(file) : "", [file]);
  const previewUrl = localPreviewUrl || (currentPath ? catalogImageUrl(currentPath) : "");

  useEffect(() => () => {
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
  }, [localPreviewUrl]);

  const previewFailed = failedPreviewUrl === previewUrl;

  const selectFile = (event) => {
    const selected = event.target.files?.[0] || null;
    const validationMessage = catalogImageValidationMessage(selected);
    if (validationMessage) {
      setError(validationMessage);
      onFileChange(null);
      event.target.value = "";
      return;
    }
    setError("");
    onFileChange(selected);
  };

  return <div className="grid gap-3"><div><label htmlFor={id} className="text-sm font-semibold text-brand-950">{label}</label><p id={`${id}-help`} className="mt-1 text-sm text-muted">JPEG, PNG, WebP, or AVIF up to 5 MB. Images are resized to 1,600 px and saved as WebP.</p></div><div className="grid gap-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center"><div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-card border border-line bg-canvas">{previewUrl && !previewFailed ? <img src={previewUrl} alt={`${label} preview`} className="size-full object-cover" onError={() => setFailedPreviewUrl(previewUrl)} /> : <div className="grid justify-items-center gap-2 px-3 text-center text-xs text-muted"><ImageOff className="size-5" aria-hidden="true" /><span>{previewFailed ? "Image preview unavailable" : "No image selected"}</span></div>}</div><div><input id={id} type="file" accept={catalogImageTypes.join(",")} className="sr-only" onChange={selectFile} disabled={disabled} aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`} /><label htmlFor={id} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-control border border-brand-950 bg-surface px-4 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100 ${disabled ? "pointer-events-none opacity-50" : "cursor-pointer"}`}><Upload className="size-4" aria-hidden="true" />{currentPath || file ? "Replace image" : "Choose image"}</label>{file ? <p className="mt-2 text-xs text-success">Preview ready. The image uploads when you save.</p> : null}{error ? <p id={`${id}-error`} className="mt-2 text-sm text-danger" role="alert">{error}</p> : null}</div></div></div>;
}
