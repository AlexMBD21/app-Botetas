import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "El Compa Herna 🎁 - Rifa por Influencer",
  description: "Sistema de rifas online con números del 1 al 10,000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
