import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { posts } from "@/lib/content";

export default function BlogIndexPage() {
  return (
    <main className="library-page">
      <SiteHeader />
      <section className="library-intro">
        <p className="eyebrow">Writing room</p>
        <h1>Take one volume down.</h1>
        <p>Collected notes about design, systems, and the shape of useful work.</p>
      </section>
      <section className="bookshelf" aria-label="Published writing">
        {posts.map((post) => <Link className={`book-card book-${post.cover}`} href={`/blog/${post.slug}`} key={post.slug}>
          <span className="book-topline">{post.tags[0]}</span><strong>{post.title}</strong><small>{post.date}</small><span className="book-author">WorseFive</span>
        </Link>)}
      </section>
    </main>
  );
}
