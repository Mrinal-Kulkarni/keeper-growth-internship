import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "Photo Quality Screener", description: "Instant technical feedback for dating profile photos." };
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
