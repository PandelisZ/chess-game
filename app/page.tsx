"use client"
import dynamic from "next/dynamic";
// Use dynamic to enable 'use client' ChessGame component in Next.js 13+ app dir
const ChessGame = dynamic(() => import("./ChessGame"), { ssr: false });
export default function Home() {
  return (
    <main>
      <ChessGame />
    </main>
  );
}