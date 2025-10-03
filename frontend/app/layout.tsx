import Providers from "@/components/Providers";
import { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  icons: {
    icon: "/code.ico",
    shortcut: "/code.ico",
    apple: "/code.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}