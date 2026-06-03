import type { Metadata } from "next";
import { SiteHeader } from "../_components/site-header";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-sm px-6 py-16">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-ink">Welcome back</h1>
        <p className="mb-6 text-sm text-ink-muted">Sign in to your Groundbreak account.</p>
        <LoginForm next={next ?? "/dashboard"} />
      </main>
    </>
  );
}
