import Link from "next/link";

export default function NotFoundPage() {
  return (
      <main
          className="module-notfound min-h-screen bg-cover bg-center"
          style={{ backgroundImage: "url('/laden.jpg')" }}
      >
        <div className="min-h-screen bg-linear-to-b from-black/55 via-black/65 to-black/75 px-6 py-12">
          <section className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-3xl items-center justify-center">
            <div className="w-full rounded-3xl border border-white/20 bg-white/90 p-8 text-gray-900 shadow-2xl backdrop-blur-sm md:p-12">
              <p className="text-sm font-semibold uppercase tracking-wide text-[var(--brand)]">
                Fehler 404
              </p>
              <h1 className="mt-2 text-3xl font-bold leading-tight md:text-5xl">
                Diese Seite wurde nicht gefunden.
              </h1>
              <p className="mt-4 text-gray-700">
                Das Projekt gehört zu Croque Bistro Wedel. Bitte nutze die Hauptseite
                oder den Zukunftsbereich.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                    href="/"
                    className="btn-primary rounded-2xl px-5 py-3 font-semibold shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
                >
                  Zur Startseite
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
  );
}
