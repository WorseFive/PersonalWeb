export type PublicResource = {
  id: string;
  title: string;
  description: string;
  sourceName: string;
  type: string;
  size?: string;
  href: string;
};

// Keep this list empty until the owner approves each public file or external URL.
// Anything listed here is intentionally public and is published through Git.
export const resources: PublicResource[] = [];
