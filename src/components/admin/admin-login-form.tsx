"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Lock } from "lucide-react";
import { loginAdminAction } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";

export function AdminLoginForm({ reason }: { reason?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(
    reason === "unauthorized"
      ? "Administrator authentication is required to access that workspace."
      : reason === "expired"
        ? "Your administrator session has expired. Please sign in again."
        : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    const res = await loginAdminAction({ email, password });
    setIsSubmitting(false);

    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-surface px-5 py-12">
      <div className="mx-auto w-full max-w-md rounded-xl border border-border-token bg-background p-8">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-md border border-border-token bg-surface px-2.5 py-1 font-mono text-xs text-secondary-foreground">
            <Lock className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
            <span>SINGLE-ADMIN GATEWAY</span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-secondary-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Public Site</span>
          </Link>
        </div>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
          Administrator Sign In
        </h1>
        <p className="mt-1.5 text-sm text-secondary-foreground">
          Authorized access for Muhamad Fauzan&apos;s Portfolio CMS. Public
          account registration is disabled.
        </p>

        {errorMsg && (
          <div
            role="alert"
            data-testid="admin-login-error"
            className="mt-5 flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50/90 p-3.5 text-xs text-red-900"
          >
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
              aria-hidden="true"
            />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="admin-email"
              className="block text-xs font-medium text-foreground"
            >
              Administrator Email
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@muhamadfauzan.dev"
              className="mt-1.5 w-full rounded-md border border-border-token bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="admin-password"
              className="block text-xs font-medium text-foreground"
            >
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="mt-1.5 w-full rounded-md border border-border-token bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full"
            data-testid="admin-login-submit"
          >
            {isSubmitting ? "Verifying Credentials..." : "Sign In to CMS"}
          </Button>
        </form>

        <div className="mt-6 border-t border-border-token pt-4 text-[11px] text-muted-foreground">
          Protected by server-side single-admin guard and Row-Level Security
          (RLS). All sign-in and publishing events are recorded in the immutable
          audit log.
        </div>
      </div>
    </div>
  );
}
