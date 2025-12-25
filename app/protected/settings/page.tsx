import { redirect } from "next/navigation";

export default function SettingsPage() {
  // Redirect to Office Hours as the default settings page
  redirect("/protected/settings/office-hours");
}

