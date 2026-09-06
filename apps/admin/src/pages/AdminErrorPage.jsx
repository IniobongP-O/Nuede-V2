import nuedeLogo from "@nuede/config/nuede-logo.svg";
import { AlertTriangle, LogIn, RotateCcw } from "lucide-react";
import { Component } from "react";

export function AdminErrorPage() {
  return (
    <main className="grid min-h-screen bg-canvas lg:grid-cols-[0.8fr_1.2fr]">
      <section className="hidden flex-col justify-between bg-brand-950 p-12 text-white lg:flex lg:p-16">
        <img src={nuedeLogo} alt="Nuede" width="374" height="112" className="h-auto w-44 brightness-0 invert" />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-pale-yellow">Admin console</p>
          <p className="mt-5 max-w-md font-display text-4xl font-semibold leading-tight">A steady place to get operations moving again.</p>
        </div>
        <p className="text-xs text-white/50">Nuede administration</p>
      </section>

      <section className="grid place-items-center px-5 py-10 sm:px-8" role="alert" aria-labelledby="admin-error-heading">
        <div className="w-full max-w-xl">
          <img src={nuedeLogo} alt="Nuede" width="374" height="112" className="mb-10 h-auto w-36 lg:hidden" />
          <div className="rounded-dialog border border-line bg-surface p-6 shadow-floating sm:p-9">
            <div className="grid size-13 place-items-center rounded-full bg-brand-100 text-brand-700" aria-hidden="true">
              <AlertTriangle className="size-6" />
            </div>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-brand-700">Unable to load</p>
            <h1 id="admin-error-heading" className="mt-3 font-display text-3xl font-semibold text-brand-950 sm:text-4xl">The admin console couldn&apos;t load</h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-muted sm:text-base">An unexpected problem interrupted the admin workspace. Check your connection, then try loading it again.</p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control bg-brand-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-brand-900" type="button" onClick={() => window.location.reload()}>
                <RotateCcw className="size-4" aria-hidden="true" />
                Try again
              </button>
              <a className="inline-flex min-h-12 items-center justify-center gap-2 rounded-control border border-brand-950 bg-surface px-6 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100" href="/login">
                <LogIn className="size-4" aria-hidden="true" />
                Return to sign in
              </a>
            </div>
          </div>
          <p className="mt-5 text-center text-xs leading-5 text-muted">If the problem continues, wait a moment and try again.</p>
        </div>
      </section>
    </main>
  );
}

export class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return <AdminErrorPage />;
    return this.props.children;
  }
}
