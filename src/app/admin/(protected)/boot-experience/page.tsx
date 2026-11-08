import { redirect } from "next/navigation";

export default function AdminBootExperiencePage() {
  redirect("/admin/settings?tab=boot");
}
