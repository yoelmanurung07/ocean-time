import { Outfit, Work_Sans } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
  variable: "--font-heading",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-body",
});

export const metadata = {
  title: "Ocean Time — Simulasi Sampah di Laut",
  description:
    "Simulasi interaktif untuk melihat berapa lama sampah bertahan di laut.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0585a4",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${outfit.variable} ${workSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
