import { SiteHeader } from "@/components/site-header";
import { posts } from "@/lib/content";
import { sitePath } from "@/lib/site";

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
        {posts.length === 0 ? <p className="empty-state">The writing shelf is being prepared. Please return soon.</p> : posts.map((post) => <a className={`book-card book-${post.cover}`} href={sitePath(`/blog/${post.slug}`)} key={post.slug}>
          <span className="book-topline">{post.tags[0]}</span><strong>{post.title}</strong><small>{post.date}</small><span className="book-author">WorseFive</span>
        </a>)}
      </section>
    </main>
  );
}
