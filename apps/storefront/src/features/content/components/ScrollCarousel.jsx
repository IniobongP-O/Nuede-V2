import { ArrowLeft, ArrowRight } from "lucide-react";
import { useId, useRef } from "react";
import { IconButton } from "../../../components/ui/Button.jsx";

export function ScrollCarousel({ label, children }) {
  const ref = useRef(null);
  const drag = useRef(null);
  const id = useId();
  const scroll = (direction) => ref.current?.scrollBy({ left: direction * ref.current.clientWidth * 0.85, behavior: "auto" });
  return <div role="region" aria-roledescription="carousel" aria-label={label}>
    <div className="mb-4 flex justify-end gap-2"><IconButton label={`Previous ${label}`} aria-controls={id} onClick={() => scroll(-1)}><ArrowLeft className="size-4" aria-hidden="true" /></IconButton><IconButton label={`Next ${label}`} aria-controls={id} onClick={() => scroll(1)}><ArrowRight className="size-4" aria-hidden="true" /></IconButton></div>
    <div id={id} ref={ref} tabIndex={0} aria-label={`${label}, scroll horizontally for more`}
      className="flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain pb-5 [scrollbar-width:thin]"
      onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); scroll(event.key === "ArrowRight" ? 1 : -1); } }}
      onPointerDown={(event) => { if (event.pointerType !== "mouse" || event.button !== 0 || event.target.closest("button,a,input,select")) return; drag.current = { x: event.clientX, left: ref.current.scrollLeft }; }}
      onPointerMove={(event) => { if (!drag.current || event.buttons !== 1) return; ref.current.scrollLeft = drag.current.left - (event.clientX - drag.current.x); }}
      onPointerUp={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
      {children}
    </div>
  </div>;
}
