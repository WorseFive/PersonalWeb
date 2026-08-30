import { SiteHeader } from "@/components/site-header";
import { FluidBackground } from "@/components/fluid-background";
import { sitePath } from "@/lib/site";

const channels = [
  { href: "/blog", icon: "✦", title: "Writing Room", text: "Essays, notes, and long-form work." },
  { href: "/library", icon: "▤", title: "Open Library", text: "Resources made to be read, kept, and used." },
  { href: "/about", icon: "◎", title: "About the Cabinet", text: "A small map of the person behind the shelves." }
];

export default function HomePage() {
  return (
    <main className="portal-shell">
      <FluidBackground />
      <SiteHeader />
      <section className="portal-hero">
        <p className="eyebrow">Personal portal</p>
        <h1><span className="hero-title-line">A quiet cabinet</span><span className="hero-title-line hero-title-accent">for work worth<span className="mobile-break"><br /></span> returning to.</span></h1>
        <p>Writing lives on paper. Resources live on shelves.<span className="mobile-break"><br /></span> Everything else begins with<span className="mobile-break"><br /></span> a clear door.</p>
      </section>
      <section className="channel-grid" aria-label="Portal channels">
        {channels.map((channel, index) => (
          <a href={sitePath(channel.href)} key={channel.href} className={`channel channel-${index + 1}`}>
            <span className="channel-icon" aria-hidden="true">{channel.icon}</span>
            <span className="channel-copy"><strong>{channel.title}</strong><small>{channel.text}</small></span>
            <span className="channel-arrow" aria-hidden="true">→</span>
          </a>
        ))}
      </section>
      <section className="portal-status" aria-label="Portal status">
        <span>WorseFive&apos;s Cabinet</span><span>Writing · Resources · Correspondence</span><span>Static first release</span>
      </section>
    </main>
  );
}
