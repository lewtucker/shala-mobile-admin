import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import PagesEditor from "./pages-editor";

export default async function PagesPage() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  return <PagesEditor />;
}
