import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://demafaiuika.my.id"),
  title: {
    default: "Agenda DEMA FAI UIKA Bogor",
    template: "%s | DEMA FAI UIKA Bogor",
  },
  description:
    "Pusat informasi agenda, kegiatan, dan open recruitment Dewan Eksekutif Mahasiswa Fakultas Agama Islam UIKA Bogor.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}