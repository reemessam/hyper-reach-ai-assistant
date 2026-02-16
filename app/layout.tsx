import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Crisis Message Generator",
  description:
    "Generate structured emergency SMS and email communications from confirmed incident details.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
