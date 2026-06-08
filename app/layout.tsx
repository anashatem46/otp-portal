import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OTP Sharing Portal",
  description: "Internal OTP access portal"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
