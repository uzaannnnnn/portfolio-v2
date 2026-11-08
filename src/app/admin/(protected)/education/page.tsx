import { redirect } from "next/navigation";

export default function AdminEducationPage() {
  redirect("/admin/profile?tab=education");
}
