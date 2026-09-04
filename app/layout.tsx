import type { Metadata, Viewport } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arkana POS",
  description: "Point of Sale system untuk Arkana Coffee",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#090820",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#1a1740",
              color: "#fff",
              border: "1px solid #2a2660",
              borderRadius: "12px",
              fontSize: "14px",
            },
          }}
        />
      </body>
    </html>
  );
}
