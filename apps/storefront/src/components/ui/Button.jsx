import { LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";

const variants = {
  primary: "bg-brand-700 text-white hover:bg-brand-900 active:bg-brand-950",
  inverse: "bg-white text-brand-950 hover:bg-brand-100 active:bg-brand-200",
  secondary: "border border-brand-950 bg-transparent text-brand-950 hover:bg-brand-100",
  ghost: "bg-transparent text-brand-950 hover:bg-brand-100",
  destructive: "bg-danger text-white hover:brightness-90",
};

const sizes = {
  small: "min-h-10 px-4 text-sm",
  medium: "min-h-11 px-5 text-sm",
  large: "min-h-12 px-6 text-base",
};

/** Builds the shared visual classes for button variants and sizes. */
function buttonClasses({ variant = "primary", size = "medium", className = "" }) {
  return `inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`;
}

/** Renders a consistent native button, internal link, or external link. */
export function Button({ to, href, type = "button", busy = false, variant = "primary", size = "medium", className = "", disabled, children, ...rest }) {
  const classes = buttonClasses({ variant, size, className });
  const content = (
    <>
      {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </>
  );

  if (to) {
    return <Link className={classes} to={to} {...rest}>{content}</Link>;
  }

  if (href) {
    return <a className={classes} href={href} {...rest}>{content}</a>;
  }

  return (
    <button className={classes} type={type} disabled={busy || disabled} aria-busy={busy || undefined} {...rest}>
      {content}
    </button>
  );
}

/** Renders an accessible icon-only button with a required text label. */
export function IconButton({ label, children, className = "", ...props }) {
  return (
    <button
      className={`inline-grid size-11 place-items-center rounded-control border border-line bg-surface text-brand-950 transition-colors hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      type="button"
      aria-label={label}
      {...props}
    >
      {children}
    </button>
  );
}
