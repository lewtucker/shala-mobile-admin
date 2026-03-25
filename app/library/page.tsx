import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LibraryView from "./library-view";

export default async function LibraryPage() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  return <LibraryView />;
}
