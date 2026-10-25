import Link from "next/link";
import { StaticPage } from "@/components/StaticPage";

export default function NotFound() {
  return (
    <StaticPage title="Page not found" lead="That page doesn't exist.">
      <p>
        <Link href="/" className="btn btn-primary">Back home</Link>
      </p>
    </StaticPage>
  );
}
