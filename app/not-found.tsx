import { SiteHeader } from "@/components/site-header";
import { sitePath } from "@/lib/site";

export default function NotFound() {
  return <main className="paper-page"><SiteHeader /><section className="reading-column"><p className="eyebrow">404</p><h1>This shelf is empty.</h1><p>The page or resource you requested is not available.</p><a className="primary-button" href={sitePath("/")}>Return home</a></section></main>;
}
