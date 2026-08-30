import { sitePath } from "@/lib/site";

const links = [
  ["Home", "/"],
  ["Writing", "/blog"],
  ["Library", "/library"],
  ["About", "/about"]
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="wordmark" href={sitePath("/")} aria-label="WorseFive's Cabinet home">
        <span className="wordmark-mark">W</span>
        <span>WorseFive&apos;s Cabinet</span>
      </a>
      <nav aria-label="Primary navigation">
        {links.map(([label, href]) => <a key={href} href={sitePath(href)}>{label}</a>)}
      </nav>
    </header>
  );
}
