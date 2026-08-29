import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const channels = [
  { href: "/blog", icon: "✦", title: "Writing Room", text: "Essays, notes, and long-form work." },
  { href: "/library", icon: "▤", title: "Open Library", text: "Resources made to be read, kept, and used." },
  { href: "/about", icon: "◎", title: "About the Cabinet", text: "A small map of the person behind the shelves." },
  { href: "/admin", icon: "◌", title: "Control Room", text: "A local moderation and upload boundary." }
];

export default function HomePage() {
  return (
    <main className="portal-shell">
      <SiteHeader />
      <section className="portal-hero">
        <p className="eyebrow">Personal portal</p>
        <h1>A quiet cabinet for
          <span>work worth returning to.</span>
        </h1>
        <p>Writing lives on paper. Resources live on shelves. Everything else begins with a clear door.</p>
      </section>
      <section className="channel-grid" aria-label="Portal channels">
        {channels.map((channel, index) => (
          <Link href={channel.href} key={channel.href} className={`channel channel-${index + 1}`}>
            <span className="channel-icon" aria-hidden="true">{channel.icon}</span>
            <span className="channel-copy"><strong>{channel.title}</strong><small>{channel.text}</small></span>
            <span className="channel-arrow" aria-hidden="true">→</span>
          </Link>
        ))}
      </section>
      <section className="portal-status" aria-label="Portal status">
        <span>WorseFive&apos;s Cabinet</span><span>Writing · Resources · Correspondence</span><span>Local first release</span>
      </section>
    </main>
  );
}
