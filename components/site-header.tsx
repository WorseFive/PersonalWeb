import Link from "next/link";

const links = [
  ["Home", "/"],
  ["Writing", "/blog"],
  ["Library", "/library"],
  ["About", "/about"]
] as const;

export function SiteHeader() {
  return (
    <header className="site-header">
      <Link className="wordmark" href="/" aria-label="WorseFive's Cabinet home">
        <span className="wordmark-mark">W</span>
        <span>WorseFive&apos;s Cabinet</span>
      </Link>
      <nav aria-label="Primary navigation">
        {links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </nav>
      <Link className="admin-link" href="/admin">Admin</Link>
    </header>
  );
}
