import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import SettingsEditor from "./settings-editor";

export default async function SettingsPage() {
  if (!(await isAuthenticated())) {
    redirect("/login");
  }
  return <SettingsEditor />;
}
