import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
    title: "Unsere Zukunft - Deine ehrliche Meinung zählt | Croque Bistro",
    description:
        "Diese Umfrage ist keine Werbung. Es geht um Identität: Croque-Fokus oder Vielfalt? Deine Meinung hilft uns bei unserem künftigen Fahrplan.",
    robots: {
        index: false,
        follow: false,
    },
    openGraph: {
        title: "Unsere Zukunft. Gemeinsam mit euch.",
        description:
            "Hilf uns bei der Entscheidung, wie wir Croque, Pizza und Pasta in Zukunft ausrichten.",
        type: "website",
        locale: "de_DE",
    },
    twitter: {
        card: "summary_large_image",
        title: "Unsere Zukunft. Gemeinsam mit euch.",
        description:
            "Deine ehrliche Meinung hilft uns bei einer wichtigen Richtungsentscheidung.",
    },
};

export default function ZukunftLayout({
    children,
}: {
    children: ReactNode;
}) {
    return children;
}
