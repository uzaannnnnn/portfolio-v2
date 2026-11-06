import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[70vh] max-w-[1200px] flex-col items-start justify-center px-5 py-20 sm:px-8"
    >
      <p className="font-mono text-xs font-medium uppercase tracking-wider text-accent">
        404 / Resource Not Found
      </p>
      <h1 className="type-page-heading mt-3 text-foreground">
        Page not found or unpublished
      </h1>
      <p className="type-body-lg mt-4 max-w-[600px] text-secondary-foreground">
        The requested route or content entry does not exist or has not been published yet.
      </p>
      <div className="mt-8">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-button-primary px-5 text-sm font-medium text-white transition-colors hover:bg-foreground/90"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Return to Homepage</span>
        </Link>
      </div>
    </main>
  );
}
