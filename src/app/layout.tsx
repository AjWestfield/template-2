import "./globals.css";
import Navigation from "@/components/Navigation";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-900 text-white">
        <Navigation />
        {children}
      </body>
    </html>
  );
}

export const metadata = {
  title: 'AI Voice Studio',
  description: 'Transform your text into voice overs and transcribe audio with AI',
};
