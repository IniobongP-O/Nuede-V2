import { ImageOff } from "lucide-react";
import { useState } from "react";

export function ProductImage({ src, alt }) {
  const [state, setState] = useState(src ? "loading" : "missing");
  const showImage = src && state !== "broken";

  return (
    <div className="relative aspect-[4/3] overflow-hidden bg-brand-100">
      {state === "loading" ? <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-brand-100 via-surface to-line" aria-hidden="true" /> : null}
      {showImage ? (
        <img src={src} alt={alt} className={`size-full object-cover transition-opacity duration-300 ${state === "loaded" ? "opacity-100" : "opacity-0"}`} loading="lazy" decoding="async" onLoad={() => setState("loaded")} onError={() => setState("broken")} />
      ) : (
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-brand-100 via-canvas to-line text-brand-700" role="img" aria-label={`${alt} image unavailable`}>
          <div className="text-center"><ImageOff className="mx-auto size-7" aria-hidden="true" /><span className="mt-2 block text-xs font-semibold">Image unavailable</span></div>
        </div>
      )}
    </div>
  );
}
