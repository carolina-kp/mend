import { redirect } from "next/navigation";

export default function MockIndex() {
  redirect("/mock/menders");
}
