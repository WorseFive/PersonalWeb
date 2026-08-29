import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function UploadsPage() {
  return <main className="paper-page"><SiteHeader /><section className="reading-column"><p className="eyebrow">Controlled uploads</p><h1>Library submissions are administrator-only.</h1><p>Uploads are validated before entering private object storage, then exposed only through the library&apos;s server-checked download route. This keeps the public site read-only while retaining a clear publishing workflow.</p><Link className="primary-button" href="/admin#uploads">Open control room</Link></section></main>;
}
