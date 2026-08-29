export type CommentStatus = "pending" | "published" | "rejected";

export type PortalComment = {
  id: string;
  postSlug: string;
  authorName: string;
  body: string;
  status: CommentStatus;
  createdAt: string;
  moderatedAt?: string;
};

export type StoredResource = {
  id: string;
  title: string;
  description: string;
  sourceName: string;
  storageKey: string;
  mediaType: "text/plain" | "application/pdf" | "image/png";
  size: number;
  createdAt: string;
  visibility: "public";
};

export type PortalDatabase = {
  version: 1;
  comments: PortalComment[];
  resources: StoredResource[];
};
