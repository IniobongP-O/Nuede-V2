import nuedeLogo from "@nuede/config/nuede-logo.svg";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Component } from "react";

export function StorefrontErrorPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-canvas px-5 py-10">
      <div className="absolute -right-20 -top-20 size-72 rounded-full bg-brand-pale-yellow/55 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-28 -left-20 size-80 rounded-full bg-brand-100 blur-3xl" aria-hidden="true" />

      <div className="relative w-full max-w-2xl">
        <a className="mx-auto flex w-fit min-h-12 items-center" href="/" aria-label="Nuede home">
          <img src={nuedeLogo} alt="Nuede" width="374" height="112" className="h-auto w-36" />
        </a>

        <section className="mt-8 rounded-dialog border border-line bg-surface p-6 text-center shadow-floating sm:p-10" role="alert" aria-labelledby="storefront-error-heading">
          <div className="mx-auto grid size-14 place-items-center rounded-full bg-brand-100 text-brand-700" aria-hidden="true">
            <AlertTriangle className="size-6" />
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-brand-700">We hit a snag</p>
          <h1 id="storefront-error-heading" className="mt-3 font-display text-3xl font-semibold text-brand-950 sm:text-4xl">We couldn&apos;t load Nuede</h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-muted sm:text-base">The page ran into an unexpected problem. Check your connection, then try loading it again.</p>

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-900" type="button" onClick={() => window.location.reload()}>
              <RotateCcw className="size-4" aria-hidden="true" />
              Try again
            </button>
            <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-brand-950 bg-surface px-6 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100" href="/">
              <Home className="size-4" aria-hidden="true" />
              Go to the homepage
            </a>
          </div>
        </section>

        <p className="mt-5 text-center text-xs leading-5 text-muted">If this keeps happening, wait a moment and try again.</p>
      </div>
    </main>
  );
}

export class StorefrontErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <StorefrontErrorPage />;
    return this.props.children;
  }
}
