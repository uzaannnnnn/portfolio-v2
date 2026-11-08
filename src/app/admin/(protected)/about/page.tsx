import { redirect } from "next/navigation";

export default function AdminAboutPage() {
  redirect("/admin/profile?tab=about");
}
