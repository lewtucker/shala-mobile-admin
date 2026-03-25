import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import AboutEditor from "./about-editor";

export default async function AboutPage() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  return <AboutEditor />;
}
