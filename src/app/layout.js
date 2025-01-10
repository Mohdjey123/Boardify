import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css'; 

const geistSans = Geist({
  variable: '--font-geist-sans', 
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Metadata for the app
export const metadata = {
  title: "Boardify",
  description: 'A Pinterest-Instagram-Tiktok clone built with Next.js, Express, PostgreSQL, and Tailwind CSS.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children} {}
      </body>
    </html>
  );
}
