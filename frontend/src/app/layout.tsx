import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "#/providers/auth";
import { ReactQueryProvider } from "#/providers/react-query";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "#/const/cookie";

const roboto = Roboto({
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Uppy bot",
  description:
    "Полезный бот для сбора статистики команд мониторингов, подходящий для современной замены BumpReminder.",
  icons: ["/favicon.ico"],
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const hasAuthCookie = cookieStore.has(AUTH_COOKIE_NAME);
  return (
    <html lang="en">
      <body className={`${roboto.variable} antialiased`}>
        <ReactQueryProvider>
          <AuthProvider defaultAuth={hasAuthCookie}>{children}</AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
