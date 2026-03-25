import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import GalleryEditor from "./gallery-editor";

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const { slug } = await params;
  return <GalleryEditor slug={slug} />;
}
