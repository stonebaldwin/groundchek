import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { isOperatorEmail } from "@/lib/admin";
import { getViewer } from "@/lib/viewer";
import { SiteHeader } from "../_components/site-header";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer.userId) redirect("/login?next=/admin");
  if (!isOperatorEmail(viewer.email)) redirect("/dashboard");

  return (
    <>
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
    </>
  );
}
