export const metadata = {
  title: "AI Scan Backend",
  description: "Backend for AI content detection",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}