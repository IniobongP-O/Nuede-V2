import { LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";

const variantClasses = {
  primary: "bg-brand-700 text-white hover:bg-brand-900",
  secondary: "border border-brand-950 bg-surface text-brand-950 hover:bg-brand-100",
  ghost: "bg-transparent text-brand-950 hover:bg-brand-100",
  destructive: "bg-danger text-white hover:brightness-90",
};

const sizeClasses = { small: "min-h-9 px-3 text-xs", medium: "min-h-11 px-4 text-sm", large: "min-h-12 px-6 text-base" };

/** Renders the admin button treatment as a control or navigation link. */
export function Button({ to, href, type = "button", variant = "primary", size = "medium", busy = false, className = "", children, disabled, ...rest }) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  const content = <>{busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : null}{children}</>;
  if (to) return <Link className={classes} to={to} {...rest}>{content}</Link>;
  if (href) return <a className={classes} href={href} {...rest}>{content}</a>;
  return <button className={classes} type={type} disabled={disabled || busy} aria-busy={busy || undefined} {...rest}>{content}</button>;
}

/** Renders an accessible icon-only admin action. */
export function IconButton({ label, children, className = "", ...props }) {
  return <button type="button" aria-label={label} className={`inline-grid size-11 place-items-center rounded-control border border-line bg-surface text-brand-950 transition-colors hover:bg-brand-100 disabled:opacity-50 ${className}`} {...props}>{children}</button>;
}
