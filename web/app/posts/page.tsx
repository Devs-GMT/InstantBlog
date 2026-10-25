import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Nav } from "@/components/Nav";
import { Posts } from "@/components/Posts";

export const metadata: Metadata = { title: "My posts" };

export default function PostsPage() {
  return (
    <>
      <Nav />
      <Posts />
      <Footer />
    </>
  );
}
