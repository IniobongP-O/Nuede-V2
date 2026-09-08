import { zodResolver } from "@hookform/resolvers/zod";
import { LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "../components/ui/Button.jsx";
import { AdminLogo } from "../components/layout/AdminLogo.jsx";
import { TextInput } from "../components/ui/FormControls.jsx";
import { useAuth } from "../features/auth/hooks/useAuth.js";
import { loginSchema } from "../features/auth/validation/loginSchema.js";

/** Maps authentication failures to concise login guidance. */
function loginErrorMessage(error) {
  if (error?.message?.toLowerCase().includes("invalid login credentials")) {
    return "The email address or password is incorrect.";
  }

  return "Nuede could not sign you in. Check the connection and try again.";
}

/** Owns validation and submission of the administrator sign-in form. */
export function LoginPage() {
  const { signIn } = useAuth();
  const [submitError, setSubmitError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    setSubmitError("");
    try {
      await signIn({ email: values.email.trim(), password: values.password });
    } catch (error) {
      setSubmitError(loginErrorMessage(error));
    }
  };

  return <main className="grid min-h-screen bg-canvas lg:grid-cols-[0.9fr_1.1fr]"><section className="flex flex-col justify-between bg-brand-950 p-8 text-white sm:p-12 lg:p-16"><div className="flex items-center"><AdminLogo className="h-auto w-48 shrink-0" /></div><div className="my-16 max-w-xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-pale-yellow">Admin console</p><h1 className="mt-5 font-display text-5xl leading-tight sm:text-6xl">Calm tools for a busy kitchen.</h1><p className="mt-6 max-w-lg text-base leading-8 text-white/70">Sign in with an authorized Nuede administrator account.</p></div><p className="text-xs text-white/50">Independent Nuede administration application</p></section><section className="grid place-items-center p-5 sm:p-8"><div className="w-full max-w-md rounded-dialog border border-line bg-surface p-6 sm:p-8"><div className="grid size-12 place-items-center rounded-full bg-brand-100 text-brand-700"><LockKeyhole className="size-5" aria-hidden="true" /></div><h2 className="mt-6 text-3xl font-semibold text-brand-950">Welcome back</h2><p className="mt-2 text-sm leading-6 text-muted">Use your authorized administrator email and password.</p><form className="mt-7 grid gap-5" noValidate onSubmit={handleSubmit(onSubmit)}><TextInput label="Email address" type="email" autoComplete="email" inputMode="email" error={errors.email?.message} disabled={isSubmitting} required {...register("email")} /><TextInput label="Password" type="password" autoComplete="current-password" error={errors.password?.message} disabled={isSubmitting} required {...register("password")} />{submitError ? <p className="rounded-control border border-danger/30 bg-red-50 px-3 py-2 text-sm text-danger" role="alert">{submitError}</p> : null}<Button type="submit" busy={isSubmitting} className="w-full">Sign in</Button></form><p className="mt-5 text-center text-xs leading-5 text-muted">Access requires both a valid Supabase session and an active Nuede administrator record.</p></div></section></main>;
}
