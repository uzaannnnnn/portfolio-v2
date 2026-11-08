import { redirect } from "next/navigation";

export default function AdminHeroPage() {
  redirect("/admin/profile?tab=hero");
}
