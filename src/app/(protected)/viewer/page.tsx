import { permanentRedirect } from "next/navigation";

export default function ViewerPage() {
  permanentRedirect("/tournaments");
}
