import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"Photo Finder | Keeper",description:"Privately rank your photos for lighting, clarity, and framing."};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
