import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import HomeEditor from "./home-editor";

export default async function HomeEditorPage() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  return <HomeEditor />;
}
