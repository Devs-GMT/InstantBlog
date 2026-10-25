import type { Metadata } from "next";
import { WriterLoader } from "@/components/writer/WriterLoader";

export const metadata: Metadata = { title: "Write" };

export default function WritePage() {
  return <WriterLoader />;
}
