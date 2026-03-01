import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
    title: "Croque Bistro Wedel",
    description:
        "Croque Bistro - Startseite und Zukunftsumfrage zur gemeinsamen Weiterentwicklung unseres Angebots.",

    robots: {
        index: false,
        follow: false,
    },

    openGraph: {
        title: "Croque Bistro",
        description:
            "Gemeinsam mit unseren Gästen gestalten wir die Zukunft unseres Angebots.",
        type: "website",
        locale: "de_DE",
    },

    twitter: {
        card: "summary_large_image",
        title: "Croque Bistro",
        description:
            "Startseite und Zukunftsumfrage für die gemeinsame Ausrichtung von Croque Bistro.",
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#f7f2ec" },
        { media: "(prefers-color-scheme: dark)", color: "#11151d" },
    ],
    colorScheme: "light dark",
};

export default function RootLayout({
                                       children,
                                   }: {
    children: ReactNode;
}) {
    return (
        <html lang="de">
        <body className="antialiased">
        {children}
        </body>
        </html>
    );
}
