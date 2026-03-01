"use client";

function getOrderCta() {
  if (typeof navigator === "undefined") {
    return {
      href: "https://shop.croque-bistro.de/",
      label: "Zur Browser-Bestellung",
    };
  }

  const ua = navigator.userAgent.toLowerCase();
  const isAndroid = ua.includes("android");
  const isIOS = /iphone|ipad|ipod/.test(ua);

  if (isIOS) {
    return {
      href: "https://apps.apple.com/de/app/croque-bistro-wedel/id1499632332",
      label: "iPhone App öffnen / laden",
    };
  }

  if (isAndroid) {
    return {
      href: "https://play.google.com/store/apps/details?id=de.simplydelivery.croquebistrowedel&hl=gsw",
      label: "Android App öffnen / laden",
    };
  }

  return {
    href: "https://shop.croque-bistro.de/",
    label: "Zur Browser-Bestellung",
  };
}

export default function HomePage() {
  const orderCta = getOrderCta();
  const surveyUrl = process.env.NEXT_PUBLIC_SURVEY_URL ?? "/zukunft";

  return (
      <main
          className="module-home min-h-screen bg-cover bg-center text-gray-900"
          style={{ backgroundImage: "url('/laden.jpg')" }}
      >
        <div className="min-h-screen bg-linear-to-b from-black/55 via-black/65 to-black/75">
        <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
          <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
            <div className="space-y-6">
              <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-1 text-sm font-medium text-white">
                Croque Bistro
              </p>

              <h1 className="text-4xl font-bold leading-tight text-white md:text-6xl">
                Willkommen bei
                <br />
                Croque Bistro
              </h1>

              <p className="max-w-xl text-lg text-white/85">
                Wir möchten unsere Zukunft gemeinsam mit unseren Gästen gestalten.
                Teile uns in der Umfrage mit, wie klar wir uns rund um Croques,
                Pizza und Pasta positionieren sollten.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                    href={surveyUrl}
                    className="btn-primary rounded-2xl px-6 py-3 font-semibold shadow-lg transition hover:scale-[1.02] hover:shadow-xl"
                >
                  Zur Umfrage
                </a>

                <a
                    href={orderCta.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-2xl border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:border-white/60"
                >
                  {orderCta.label}
                </a>
              </div>

              <p className="text-sm text-white/75">
                Alternativ immer online bestellen:{" "}
                <a
                    href="https://shop.croque-bistro.de/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-4"
                >
                  shop.croque-bistro.de
                </a>
              </p>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/90 p-8 shadow-xl backdrop-blur-sm">
              <h2 className="text-2xl font-semibold text-gray-900">Warum diese Umfrage?</h2>
              <ul className="mt-5 space-y-3 text-sm text-gray-700">
                <li>Wir wollen entscheiden, wie klar unser Profil in Zukunft sein soll.</li>
                <li>Deine Rückmeldung hilft bei unserem konkreten Fahrplan.</li>
                <li>Die Teilnahme ist freiwillig und datensparsam gestaltet.</li>
              </ul>
            </div>
          </div>
        </section>
        </div>
      </main>
  );
}
