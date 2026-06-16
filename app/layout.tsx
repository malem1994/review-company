import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Đánh Giá Công Ty Việt Nam",
  description: "Platform for reviewing companies in Vietnam - Rate benefits, work environment, and leadership",
  keywords: ["đánh giá công ty", "công ty việt nam", "review công ty", "phúc lợi", "môi trường làm việc"],
  authors: [{ name: "Company Review VN" }],
  openGraph: {
    title: "Đánh Giá Công Ty Việt Nam",
    description: "Đánh giá và chia sẻ trải nghiệm làm việc tại các công ty tại Việt Nam",
    type: "website",
    locale: "vi_VN"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
