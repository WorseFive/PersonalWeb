import { AdminConsole } from "@/components/admin-console";
import { SiteHeader } from "@/components/site-header";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <main className="admin-page"><SiteHeader /><AdminConsole /></main>;
}
