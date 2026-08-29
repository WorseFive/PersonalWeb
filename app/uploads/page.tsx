import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function UploadsPage() {
  return <main className="paper-page"><SiteHeader /><section className="reading-column"><p className="eyebrow">Controlled uploads</p><h1>Library submissions are administrator-only.</h1><p>In this first local release, uploads are validated and published through the administrator control room. This avoids an unaudited public write path before a production identity provider is configured.</p><Link className="primary-button" href="/admin#uploads">Open control room</Link></section></main>;
}
