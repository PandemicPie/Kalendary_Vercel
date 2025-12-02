import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kalendary - Il tuo calendario intelligente",
  description: "L'assistente personale che ti aiuta a organizzare la tua vita con intelligenza artificiale",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kalendary',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover' as const,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
