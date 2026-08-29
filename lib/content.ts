export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  cover: "blue" | "coral" | "green";
  tags: string[];
  paragraphs: string[];
};

export const posts: Post[] = [
  {
    slug: "the-library-is-a-user-interface",
    title: "The library is a user interface",
    excerpt: "Why a personal website should feel navigable before it feels impressive.",
    date: "2026-08-29",
    cover: "blue",
    tags: ["Design", "Portal"],
    paragraphs: [
      "A personal portal is not a single landing page. It is a small collection of rooms: a place to read, a place to find resources, and a place to return to work already in progress.",
      "The homepage borrows Wii's calm, reachable channels. The library borrows the early iBooks shelf only where a collection metaphor helps. Reading itself stays quiet, sharp, and text-first.",
      "The goal is not nostalgia for its own sake. Familiar material cues can explain hierarchy, but they should never conceal the action a visitor needs to take."
    ]
  },
  {
    slug: "notes-on-controlled-sharing",
    title: "Notes on controlled sharing",
    excerpt: "Public downloads and public comments need different kinds of restraint.",
    date: "2026-08-28",
    cover: "coral",
    tags: ["Security", "Writing"],
    paragraphs: [
      "A download is a published object with a stable identity. A comment is a request to join a conversation. Treating both as anonymous files makes moderation and accountability difficult.",
      "This first release therefore keeps uploads behind the administrator boundary and sends public comments to moderation. The production adapter can later replace local storage with managed policies, not with a weaker client-side shortcut.",
      "Small systems earn trust when their boundaries are easy to understand: what is public, who can change it, and what happens when an input is rejected."
    ]
  },
  {
    slug: "a-shelf-is-not-a-dashboard",
    title: "A shelf is not a dashboard",
    excerpt: "A compact rule for keeping skeuomorphism useful rather than noisy.",
    date: "2026-08-27",
    cover: "green",
    tags: ["UI", "Typography"],
    paragraphs: [
      "A shelf explains a collection. It does not explain every control, status message, or paragraph. Material styling belongs where it reveals an object and should disappear where it would compete with meaning.",
      "That distinction also makes a website easier to maintain. A handful of tokens for paper, wood, gloss, and focus is enough; scattered background images are not a design system.",
      "The most important visual effect remains a readable sentence with an obvious next step."
    ]
  }
];

export function getPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}
