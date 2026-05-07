import { redirect } from "next/navigation";

export default function ReviewerRedirect() {
  redirect("/submissions");
}
