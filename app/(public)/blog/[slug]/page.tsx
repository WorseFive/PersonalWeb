import { notFound } from "next/navigation";
import { CommentSection } from "@/components/comment-section";
import { SiteHeader } from "@/components/site-header";
import { getPost, posts } from "@/lib/content";
import { listPublishedComments } from "@/lib/store";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const comments = await listPublishedComments(post.slug);
  return (
    <main className="paper-page">
      <SiteHeader />
      <article className="reading-column">
        <p className="eyebrow">{post.tags.join(" / ")}</p>
        <h1>{post.title}</h1>
        <p className="article-date">{post.date} · WorseFive</p>
        {post.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </article>
      <div className="reading-column"><CommentSection postSlug={post.slug} initialComments={comments} /></div>
    </main>
  );
}
