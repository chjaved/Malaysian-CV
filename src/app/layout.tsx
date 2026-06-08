import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ResuMY — CV Analyzer Built for Malaysia",
  description:
    "AI-powered CV feedback for Malaysia's job market — local SMEs, GLCs, MNCs, and government roles. Built for Malaysia. Not translated for it.",
  openGraph: {
    title: "ResuMY — CV Analyzer Built for Malaysia",
    description:
      "AI-powered CV feedback for Malaysia's job market — local SMEs, GLCs, MNCs, and government roles.",
    type: "website",
    images: [
      "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/1aef61ca-53e4-4e28-9622-84224387bd6c/id-preview-2f95e12c--6a8b827d-3dd9-4394-b8f6-e2209d80f373.lovable.app-1779781152702.png",
    ],
  },
  twitter: {
    card: "summary",
    title: "ResuMY — CV Analyzer Built for Malaysia",
    description:
      "AI-powered CV feedback for Malaysia's job market — local SMEs, GLCs, MNCs, and government roles.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
