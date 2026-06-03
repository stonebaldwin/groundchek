import type { Metadata } from "next";
import { SiteHeader } from "../_components/site-header";
import { SignupForm } from "./signup-form";
import type { Plan } from "@/lib/entitlements";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await searchParams;
  const selected = (["pro", "business"].includes(plan ?? "") ? plan : undefined) as Plan | undefined;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-sm px-6 py-16">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Create your account</h1>
        <p className="mb-6 text-sm text-ink-muted">
          {selected ? `Starting on the ${selected} plan.` : "Start free — upgrade anytime."}
        </p>
        <SignupForm plan={selected} />
      </main>
    </>
  );
}
