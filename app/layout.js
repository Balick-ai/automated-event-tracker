import "./globals.css";

export const metadata = {
  title: "EDM Event Tracker",
  description: "Track live music events, discover upcoming shows, and sync to Google Calendar",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
