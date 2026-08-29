import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return <main className="paper-page"><SiteHeader /><section className="reading-column"><p className="eyebrow">404</p><h1>This shelf is empty.</h1><p>The page or resource you requested is not available.</p><Link className="primary-button" href="/">Return home</Link></section></main>;
}
