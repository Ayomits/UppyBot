import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { AppProvider } from "./providers";

const roboto = Roboto({
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Uppy bot",
  description:
    "Полезный бот для сбора статистики команд мониторингов, подходящий для современной замены BumpReminder.",
  openGraph: {
    title: "Uppy bot",
    description:
      "Полезный бот для сбора статистики команд мониторингов, подходящий для современной замены BumpReminder.",
    images: [
      {
        width: 250,
        height: 250,
        url: "/logo.webp",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} antialiased`}
      >
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
