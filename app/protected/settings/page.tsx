import { redirect } from "next/navigation";

export default function SettingsPage() {
  // Redirect to Profile as the default settings page
  redirect("/protected/settings/profile");
}

