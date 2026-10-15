import { notFound } from "next/navigation";
import db from "@/lib/db";

export const runtime = "nodejs";
// Ergebnisse bei jedem Aufruf frisch aus der DB, nicht als Stand des Builds
export const dynamic = "force-dynamic";

type Row = {
    identity: string | null;
    focus: string | null;
    focusSelections: string | null;
    identityDirection: string | null;
    usageChannels: string | null;
    priorities: string | null;
    changeWishes: string | null;
    nps: number | null;
};

function parseArray(raw: string | null): string[] {
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed)
            ? parsed.filter((item): item is string => typeof item === "string")
            : [];
    } catch {
        return [];
    }
}

function countValues(values: string[]): Array<{ label: string; count: number; share: number }> {
    if (values.length === 0) return [];

    const counts = new Map<string, number>();
    for (const value of values) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    const total = values.length;
    return Array.from(counts.entries())
        .map(([label, count]) => ({ label, count, share: (count / total) * 100 }))
        .sort((a, b) => b.count - a.count);
}

function average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}

function Distribution({
    title,
    items,
}: {
    title: string;
    items: Array<{ label: string; count: number; share: number }>;
}) {
    return (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            {items.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">Noch keine Daten vorhanden.</p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {items.map((item) => (
                        <li key={item.label} className="flex items-center justify-between gap-3 text-sm text-gray-700">
                            <span>{item.label}</span>
                            <span className="font-medium">
                {item.count} ({item.share.toFixed(1)}%)
              </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}

export default function AuswertungPage() {
    if (process.env.FEEDBACK_RESULTS_ENABLED !== "true") {
        notFound();
    }

    const rows = db.prepare(`
        SELECT identity, focus, focusSelections, identityDirection, usageChannels, priorities, changeWishes, nps
        FROM feedback
        ORDER BY createdAt DESC
    `).all() as Row[];

    const totalVotes = rows.length;
    const focusValues = rows.flatMap((row) => {
        const selections = parseArray(row.focusSelections);
        if (selections.length > 0) return selections;
        return row.focus ? [row.focus] : ["Unbekannt"];
    });
    const identityDirectionValues = rows.map((row) => row.identityDirection ?? "Unbekannt").filter(Boolean);
    const identityValues = rows.flatMap((row) => parseArray(row.identity));
    const usageValues = rows.flatMap((row) => parseArray(row.usageChannels));
    const priorityValues = rows.flatMap((row) => parseArray(row.priorities));
    const changeWishValues = rows.flatMap((row) => parseArray(row.changeWishes));
    const npsValues = rows
        .map((row) => Number(row.nps))
        .filter((value) => Number.isFinite(value) && value >= 1 && value <= 10);

    const avgSupport = average(npsValues);
    const medianSupport = median(npsValues);
    const lowSupport = npsValues.filter((value) => value <= 4).length;
    const neutralSupport = npsValues.filter((value) => value >= 5 && value <= 7).length;
    const highSupport = npsValues.filter((value) => value >= 8).length;

    return (
        <main className="module-results bg-app min-h-screen px-6 py-12">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
                    <h1 className="text-3xl font-bold text-gray-900">Auswertung: Zukunft mit den Gästen gestalten</h1>
                    <p className="mt-3 text-gray-700">
                        Diese Übersicht zeigt, welchen Kurs eure Gäste mittragen und wo sie die wichtigsten Veränderungen sehen.
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-4">
                        <div className="bg-surface-soft rounded-2xl p-4">
                            <p className="text-sm text-gray-600">Abgegebene Stimmen</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{totalVotes}</p>
                        </div>
                        <div className="bg-surface-soft rounded-2xl p-4">
                            <p className="text-sm text-gray-600">Ø Kurs-Rückenwind (1-10)</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{avgSupport.toFixed(2)}</p>
                        </div>
                        <div className="bg-surface-soft rounded-2xl p-4">
                            <p className="text-sm text-gray-600">Median Rückenwind</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{medianSupport.toFixed(1)}</p>
                        </div>
                        <div className="bg-surface-soft rounded-2xl p-4">
                            <p className="text-sm text-gray-600">Klarer Rückenwind (8-10)</p>
                            <p className="mt-1 text-2xl font-bold text-gray-900">{highSupport}</p>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-gray-700">
                        <p>1-4 (eher gegen Veränderung): {lowSupport}</p>
                        <p>5-7 (unentschlossen): {neutralSupport}</p>
                        <p>8-10 (klarer Rückenwind): {highSupport}</p>
                    </div>
                </section>

                <div className="grid gap-6 md:grid-cols-2">
                    <Distribution title="Positionierung (Fokus)" items={countValues(focusValues)} />
                    <Distribution title="Identitätsrichtung" items={countValues(identityDirectionValues)} />
                    <Distribution title="Spontane Wahrnehmung" items={countValues(identityValues)} />
                    <Distribution title="Nutzungsarten" items={countValues(usageValues)} />
                    <Distribution title="Top-Prioritäten" items={countValues(priorityValues)} />
                    <Distribution title="Änderungsbedarf" items={countValues(changeWishValues)} />
                </div>
            </div>
        </main>
    );
}
