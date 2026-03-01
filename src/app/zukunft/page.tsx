"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import type { ComponentProps } from "react";

type OwnSubmission = {
  identity: string[];
  identityOtherText: string;
  focus: string;
  focusSelections: string[];
  focusOtherText: string;
  identityDirection: string;
  identityDirectionOtherText: string;
  usageChannels: string[];
  priorities: string[];
  changeWishes: string[];
  changeWishesOtherText: string;
  improve: string;
  nps: number;
  publicName: string;
  notifyOptIn: boolean;
  notifyEmail: string;
  notifyConsent: boolean;
  createdAt: string;
};

export default function Page() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPublic, setShowPublic] = useState(false);
  const [identityOtherSelected, setIdentityOtherSelected] = useState(false);
  const [identityOtherText, setIdentityOtherText] = useState("");
  const [identitySelectionCount, setIdentitySelectionCount] = useState(0);
  const [focusSelected, setFocusSelected] = useState(false);
  const [focusSelectionCount, setFocusSelectionCount] = useState(0);
  const [focusOtherSelected, setFocusOtherSelected] = useState(false);
  const [focusOtherText, setFocusOtherText] = useState("");
  const [focusSelectionMessage, setFocusSelectionMessage] = useState<string | null>(null);
  const [identityDirectionSelected, setIdentityDirectionSelected] = useState(false);
  const [identityDirectionOtherSelected, setIdentityDirectionOtherSelected] = useState(false);
  const [identityDirectionOtherText, setIdentityDirectionOtherText] = useState("");
  const [usageSelectionCount, setUsageSelectionCount] = useState(0);
  const [prioritySelectionCount, setPrioritySelectionCount] = useState(0);
  const [priorityLimitMessage, setPriorityLimitMessage] = useState<string | null>(null);
  const [changeWishOtherSelected, setChangeWishOtherSelected] = useState(false);
  const [changeWishOtherText, setChangeWishOtherText] = useState("");
  const [npsSelected, setNpsSelected] = useState(false);
  const [notifyMe, setNotifyMe] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyConsent, setNotifyConsent] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [resultsAvailable, setResultsAvailable] = useState(false);
  const [resultsPath, setResultsPath] = useState<string | null>(null);
  const [allowSelfDelete, setAllowSelfDelete] = useState(false);
  const [mySubmission, setMySubmission] = useState<OwnSubmission | null>(null);
  const [profilePublicName, setProfilePublicName] = useState("");
  const [profileNotifyMe, setProfileNotifyMe] = useState(false);
  const [profileNotifyEmail, setProfileNotifyEmail] = useState("");
  const [profileNotifyConsent, setProfileNotifyConsent] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [deletingVote, setDeletingVote] = useState(false);

  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroImageRef = useRef<HTMLDivElement>(null);

  /* ---------------- SCROLL EFFECT (rAF optimized) ---------------- */
  useEffect(() => {
    let ticking = false;
    let rafId: number;

    const update = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight;
      const progress = Math.min(scrollY / heroHeight, 1);

      if (heroContentRef.current) {
        heroContentRef.current.style.opacity = `${1 - progress}`;
        heroContentRef.current.style.transform = `translateY(${progress * 40}px)`;
      }

      if (heroImageRef.current) {
        heroImageRef.current.style.transform = `scale(${1.05 - progress * 0.05})`;
      }

      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        rafId = requestAnimationFrame(update);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    update();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function checkVoteStatus() {
      try {
        const res = await fetch("/api/feedback", {
          method: "GET",
          cache: "no-store",
        });

        if (!res.ok || !active) return;

        const status = (await res.json()) as {
          voted?: boolean;
          resultsAvailable?: boolean;
          resultsPath?: string | null;
          allowSelfDelete?: boolean;
          submission?: OwnSubmission | null;
        };

        setResultsAvailable(Boolean(status.resultsAvailable));
        setResultsPath(status.resultsPath ?? null);
        setAllowSelfDelete(Boolean(status.allowSelfDelete));

        if (status.submission) {
          setMySubmission(status.submission);
          setProfilePublicName(status.submission.publicName ?? "");
          setProfileNotifyMe(Boolean(status.submission.notifyOptIn));
          setProfileNotifyEmail(status.submission.notifyEmail ?? "");
          setProfileNotifyConsent(Boolean(status.submission.notifyConsent));
        }

        if (!status.voted) return;

        if (status.resultsAvailable && status.resultsPath) {
          window.location.assign(status.resultsPath);
          return;
        }

        setAlreadyVoted(true);
        setErrorMessage("Du hast bereits abgestimmt. Die Auswertung wird veröffentlicht, sobald sie freigeschaltet ist.");
      } catch {
        // Ignore status-check errors and keep form usable.
      }
    }

    void checkVoteStatus();

    return () => {
      active = false;
    };
  }, []);

  const reloadOwnSubmission = async () => {
    const res = await fetch("/api/feedback", {
      method: "GET",
      cache: "no-store",
    });

    if (!res.ok) return;

    const status = (await res.json()) as {
      submission?: OwnSubmission | null;
      allowSelfDelete?: boolean;
    };

    setAllowSelfDelete(Boolean(status.allowSelfDelete));

    if (!status.submission) return;

    setMySubmission(status.submission);
    setProfilePublicName(status.submission.publicName ?? "");
    setProfileNotifyMe(Boolean(status.submission.notifyOptIn));
    setProfileNotifyEmail(status.submission.notifyEmail ?? "");
    setProfileNotifyConsent(Boolean(status.submission.notifyConsent));
  };


  /* ---------------- FORM SUBMIT ---------------- */
  const handleSubmit: NonNullable<ComponentProps<"form">["onSubmit"]> = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    const formData = new FormData(e.currentTarget);

    const data: Record<string, unknown> = {};

    formData.forEach((value, key) => {
      if (data[key]) {
        data[key] = Array.isArray(data[key])
            ? [...(data[key] as string[]), value]
            : [data[key], value];
      } else {
        data[key] = value;
      }
    });

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);
    if (res.ok) {
      setDone(true);
      setAlreadyVoted(true);
      void reloadOwnSubmission();
      return;
    }

    const result = (await res.json().catch(() => null)) as {
      error?: string;
      voted?: boolean;
      resultsAvailable?: boolean;
      resultsPath?: string | null;
      submission?: OwnSubmission | null;
    } | null;

    if (res.status === 429 && result?.voted) {
      setResultsAvailable(Boolean(result.resultsAvailable));
      setResultsPath(result.resultsPath ?? null);

      if (result.resultsAvailable && result.resultsPath) {
        window.location.assign(result.resultsPath);
        return;
      }

      setAlreadyVoted(true);
      void reloadOwnSubmission();
    }

    setErrorMessage(result?.error ?? "Beim Absenden ist ein Fehler aufgetreten.");
  };


  const scrollToForm = () => {
    document
        .getElementById("umfrage")
        ?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSummary = () => {
    document
        .getElementById("deine-angaben")
        ?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToQuestion = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const handleUpdateOwnSettings = async () => {
    setProfileMessage(null);

    if (profileNotifyMe) {
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileNotifyEmail.trim());
      if (!emailOk) {
        setProfileMessage("Bitte gib eine gültige E-Mail ein.");
        return;
      }

      if (!profileNotifyConsent) {
        setProfileMessage("Bitte bestätige die Einwilligung für die Benachrichtigung.");
        return;
      }
    }

    setSavingProfile(true);
    const res = await fetch("/api/feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicName: profilePublicName,
        notifyOptIn: profileNotifyMe,
        notifyEmail: profileNotifyEmail,
        notifyConsent: profileNotifyConsent,
      }),
    });

    const result = (await res.json().catch(() => null)) as {
      error?: string;
      submission?: OwnSubmission | null;
    } | null;

    setSavingProfile(false);

    if (!res.ok) {
      setProfileMessage(result?.error ?? "Änderungen konnten nicht gespeichert werden.");
      return;
    }

    if (result?.submission) {
      setMySubmission(result.submission);
      setProfilePublicName(result.submission.publicName ?? "");
      setProfileNotifyMe(Boolean(result.submission.notifyOptIn));
      setProfileNotifyEmail(result.submission.notifyEmail ?? "");
      setProfileNotifyConsent(Boolean(result.submission.notifyConsent));
    }

    setProfileMessage("Änderungen gespeichert.");
  };

  const handleDeleteForTesting = async () => {
    const confirmed = window.confirm("Willst du deine Test-Abstimmung wirklich löschen?");
    if (!confirmed) return;

    setDeletingVote(true);
    setProfileMessage(null);

    const res = await fetch("/api/feedback", {
      method: "DELETE",
      cache: "no-store",
    });

    const result = (await res.json().catch(() => null)) as { error?: string } | null;
    setDeletingVote(false);

    if (!res.ok) {
      setProfileMessage(result?.error ?? "Löschen fehlgeschlagen.");
      return;
    }

    setDone(false);
    setAlreadyVoted(false);
    setErrorMessage(null);
    setMySubmission(null);
    setProfilePublicName("");
    setProfileNotifyMe(false);
    setProfileNotifyEmail("");
    setProfileNotifyConsent(false);
    setProfileMessage("Test-Abstimmung gelöscht. Du kannst erneut abstimmen.");

    setIdentityOtherSelected(false);
    setIdentityOtherText("");
    setIdentitySelectionCount(0);
    setFocusSelected(false);
    setFocusSelectionCount(0);
    setFocusOtherSelected(false);
    setFocusOtherText("");
    setFocusSelectionMessage(null);
    setIdentityDirectionSelected(false);
    setIdentityDirectionOtherSelected(false);
    setIdentityDirectionOtherText("");
    setUsageSelectionCount(0);
    setPrioritySelectionCount(0);
    setPriorityLimitMessage(null);
    setChangeWishOtherSelected(false);
    setChangeWishOtherText("");
    setNpsSelected(false);
    setShowPublic(false);
    setNotifyMe(false);
    setNotifyEmail("");
    setNotifyConsent(false);
  };

  const isFormReady =
      identitySelectionCount > 0 &&
      focusSelected &&
      focusSelectionCount > 0 &&
      (!focusOtherSelected || focusOtherText.trim().length > 0) &&
      identityDirectionSelected &&
      (!identityDirectionOtherSelected || identityDirectionOtherText.trim().length > 0) &&
      usageSelectionCount > 0 &&
      prioritySelectionCount > 0 &&
      prioritySelectionCount <= 3 &&
      (!changeWishOtherSelected || changeWishOtherText.trim().length > 0) &&
      npsSelected &&
      (!identityOtherSelected || identityOtherText.trim().length > 0) &&
      (!notifyMe || (notifyEmail.trim().length > 0 && notifyConsent));

  const missingRequirements: Array<{ label: string; targetId: string }> = [];
  if (identitySelectionCount === 0) {
    missingRequirements.push({
      label: "Bitte wähle mindestens einen Punkt bei „Wenn du spontan an uns denkst…“.",
      targetId: "frage-wahrnehmung",
    });
  }
  if (!focusSelected || focusSelectionCount === 0) {
    missingRequirements.push({
      label: "Bitte wähle eine Option bei „Wenn wir uns klarer positionieren müssten…“.",
      targetId: "frage-fokus",
    });
  }
  if (focusOtherSelected && focusOtherText.trim().length === 0) {
    missingRequirements.push({
      label: "Bitte ergänze den Text zu „Sonstiges“ beim Fokus.",
      targetId: "frage-fokus",
    });
  }
  if (!identityDirectionSelected) {
    missingRequirements.push({
      label: "Bitte wähle eine Option bei „Wofür sollten wir in erster Linie stehen?“.",
      targetId: "frage-identitaetsrichtung",
    });
  }
  if (identityDirectionOtherSelected && identityDirectionOtherText.trim().length === 0) {
    missingRequirements.push({
      label: "Bitte ergänze den Text zu „Sonstiges“ bei der Identitätsrichtung.",
      targetId: "frage-identitaetsrichtung",
    });
  }
  if (usageSelectionCount === 0) {
    missingRequirements.push({
      label: "Bitte wähle mindestens eine Option bei „Wie nutzt du unser Angebot…?“.",
      targetId: "frage-nutzung",
    });
  }
  if (prioritySelectionCount === 0) {
    missingRequirements.push({
      label: "Bitte wähle mindestens ein Thema bei den Zukunftsprioritäten.",
      targetId: "frage-prioritaeten",
    });
  }
  if (changeWishOtherSelected && changeWishOtherText.trim().length === 0) {
    missingRequirements.push({
      label: "Bitte ergänze den Text zu „Sonstiges“ beim Änderungsbedarf.",
      targetId: "frage-aenderungsbedarf",
    });
  }
  if (!npsSelected) {
    missingRequirements.push({
      label: "Bitte gib eine Bewertung für den zukünftigen Kurs ab.",
      targetId: "frage-nps",
    });
  }
  if (identityOtherSelected && identityOtherText.trim().length === 0) {
    missingRequirements.push({
      label: "Bitte ergänze den Text zu „Sonstiges“ bei der spontanen Wahrnehmung.",
      targetId: "frage-wahrnehmung",
    });
  }
  if (notifyMe && notifyEmail.trim().length === 0) {
    missingRequirements.push({
      label: "Bitte gib eine E-Mail für die Ergebnis-Benachrichtigung ein.",
      targetId: "frage-benachrichtigung",
    });
  }
  if (notifyMe && !notifyConsent) {
    missingRequirements.push({
      label: "Bitte bestätige die Einwilligung zur Ergebnis-Benachrichtigung.",
      targetId: "frage-benachrichtigung",
    });
  }

  const isSubmitDisabled = loading || !isFormReady || alreadyVoted;

  return (
      <main className="module-survey bg-app">

        {/* ---------------- HERO WRAPPER (SCROLL AREA) ---------------- */}
        <div className="relative h-[200vh]">

          <section className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">

            {/* Hintergrundbild */}
            <div
                ref={heroImageRef}
                className="hero-image absolute inset-0 bg-cover bg-center will-change-transform"
                style={{ backgroundImage: "url('/laden.jpg')" }}
            />

            {/* dunkler Verlauf */}
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/60 to-black/80" />

            {/* Inhalt */}
            <div
                ref={heroContentRef}
                className="relative z-10 w-full max-w-md md:max-w-3xl px-6 text-center text-white transition-all duration-500 mt-10 md:mt-0 will-change-[transform,opacity]"
            >

              <div className="bg-linear-to-b from-black/60 to-black/40 md:bg-black/55 backdrop-blur-sm rounded-2xl p-6 md:p-12 space-y-6 shadow-xl md:shadow-2xl">

                {alreadyVoted ? (
                    <>
                      <h1 className="text-3xl md:text-6xl font-bold leading-tight">
                        Danke für deine Stimme.
                        <br />
                        Deine Abstimmung ist bereits erfasst.
                      </h1>

                      <p className="text-base md:text-xl text-white/85">
                        Deine Angaben sind sicher gespeichert.
                        <br />
                        Du kannst sie unten einsehen und bei Bedarf anpassen.
                      </p>

                      <div className="space-y-5 text-sm md:text-lg text-white/90 leading-relaxed">
                        {resultsAvailable ? (
                            <p className="font-medium">
                              Die Auswertung ist freigeschaltet.
                            </p>
                        ) : (
                            <p className="font-medium">
                              Die Auswertung ist noch nicht freigeschaltet.
                            </p>
                        )}

                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                          <Link
                              href="/"
                              className="inline-flex items-center justify-center rounded-2xl border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:border-white/60"
                          >
                            Zur Startseite
                          </Link>
                          {resultsAvailable && resultsPath && (
                              <a
                                  href={resultsPath}
                                  className="inline-flex items-center justify-center rounded-2xl btn-primary px-5 py-3 text-sm font-semibold shadow-lg transition hover:shadow-xl"
                              >
                                Zur Auswertung
                              </a>
                          )}
                        </div>
                      </div>
                    </>
                ) : (
                    <>
                      <h1 className="text-3xl md:text-6xl font-bold leading-tight">
                        Unsere Zukunft.
                        <br />
                        Gemeinsam mit euch.
                      </h1>

                      <p className="text-base md:text-xl text-white/85">
                        Es geht nicht um Marketing.
                        <br />
                        Es geht um Identität.
                      </p>

                      <div className="space-y-5 text-sm md:text-lg text-white/90 leading-relaxed">

                        <p>
                          Viele von euch verbinden mit uns vor allem eines:
                          <span className="font-semibold"> Einen richtig guten Croque.</span>
                        </p>

                        <p>Unser Herz schlägt immer noch dafür.</p>

                        <p>
                          Mit der Zeit ist unser Angebot gewachsen.
                          Pizza, Pasta und mehr sind dazugekommen –
                          auch aus wirtschaftlichen Gründen.
                        </p>

                        <p>
                          Haben wir uns zu sehr verzettelt?
                          Oder ist genau diese Vielfalt das,
                          was ihr an uns schätzt?
                        </p>

                        <p className="font-medium">
                          Wir möchten nicht raten.
                          Wir möchten euch fragen.
                        </p>

                      </div>
                    </>
                )}

              </div>


            </div>

            {/* Scroll Hinweis */}
            <button
                onClick={() => {
                  if (alreadyVoted && resultsAvailable && resultsPath) {
                    window.location.assign(resultsPath);
                    return;
                  }

                  if (alreadyVoted) {
                    scrollToSummary();
                    return;
                  }

                  scrollToForm();
                }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-2xl opacity-70 hover:opacity-100 transition cursor-pointer scroll-bounce"
                aria-label={
                  alreadyVoted
                    ? resultsAvailable && resultsPath
                      ? "Zur Auswertung wechseln"
                      : "Zu deinen Angaben scrollen"
                    : "Zur Umfrage scrollen"
                }
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 5v14M12 19l-5-5M12 19l5-5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"/>
              </svg>
            </button>

          </section>

        </div>

        {/* ---------------- UMFRAGE ---------------- */}
        <section
            id="umfrage"
            className="relative z-20 py-20 px-4 flex justify-center bg-app"
        >
          <div className="w-full max-w-2xl bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-100">

          {alreadyVoted ? (
                <div className="space-y-6">
                  {done && (
                      <div className="alert alert-success">
                        <p className="font-medium">
                          Danke ❤️ Deine Meinung fließt in unsere Entscheidung ein.
                        </p>
                      </div>
                  )}

                  <div className="alert alert-warning">
                    <p className="font-medium">
                      Du hast bereits abgestimmt.
                    </p>
                    <p className="mt-2">
                      Eine zweite Stimmabgabe ist nicht möglich.
                    </p>
                  </div>

                  {resultsAvailable && resultsPath ? (
                      <a
                          href={resultsPath}
                          className="inline-flex items-center justify-center w-full py-4 rounded-2xl btn-primary font-semibold tracking-wide shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                      >
                        Zur Auswertung
                      </a>
                  ) : (
                      <div className="alert alert-info">
                        <p>
                          Die Auswertung ist aktuell noch nicht freigeschaltet.
                        </p>
                      </div>
                  )}

                  <Link
                      href="/"
                      className="inline-flex items-center justify-center w-full rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-800 transition hover:border-gray-400 hover:bg-gray-50"
                  >
                    Zur Startseite
                  </Link>

                  {mySubmission ? (
                      <div className="space-y-5">
                        <div id="deine-angaben" className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Deine Angaben</h3>
                          <div className="space-y-3 text-sm text-gray-700">
                            <p>
                              <span className="font-medium">Wahrnehmung:</span>{" "}
                              {mySubmission.identity.length > 0 ? mySubmission.identity.join(", ") : "—"}
                            </p>
                            {mySubmission.identityOtherText && (
                                <p>
                                  <span className="font-medium">Sonstiges:</span> {mySubmission.identityOtherText}
                                </p>
                            )}
                            <p>
                              <span className="font-medium">Fokus:</span>{" "}
                              {mySubmission.focusSelections.length > 0 ? mySubmission.focusSelections.join(", ") : mySubmission.focus}
                            </p>
                            {mySubmission.focusOtherText && (
                                <p>
                                  <span className="font-medium">Fokus - Sonstiges:</span> {mySubmission.focusOtherText}
                                </p>
                            )}
                            <p><span className="font-medium">Identitätsrichtung:</span> {mySubmission.identityDirection || "—"}</p>
                            {mySubmission.identityDirectionOtherText && (
                                <p>
                                  <span className="font-medium">Identitätsrichtung - Sonstiges:</span> {mySubmission.identityDirectionOtherText}
                                </p>
                            )}
                            <p>
                              <span className="font-medium">Nutzungsart:</span>{" "}
                              {mySubmission.usageChannels.length > 0 ? mySubmission.usageChannels.join(", ") : "—"}
                            </p>
                            <p>
                              <span className="font-medium">Prioritäten:</span>{" "}
                              {mySubmission.priorities.length > 0 ? mySubmission.priorities.join(", ") : "—"}
                            </p>
                            <p>
                              <span className="font-medium">Änderungsbedarf:</span>{" "}
                              {mySubmission.changeWishes.length > 0 ? mySubmission.changeWishes.join(", ") : "—"}
                            </p>
                            {mySubmission.changeWishesOtherText && (
                                <p>
                                  <span className="font-medium">Änderungsbedarf - Sonstiges:</span> {mySubmission.changeWishesOtherText}
                                </p>
                            )}
                            <p><span className="font-medium">NPS:</span> {mySubmission.nps}</p>
                            <p>
                              <span className="font-medium">Kommentar:</span>{" "}
                              {mySubmission.improve || "—"}
                            </p>
                          </div>
                        </div>

                        {!resultsAvailable && (
                            <div className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900">
                                Angaben bearbeiten
                              </h3>

                              <div>
                                <label className="block text-sm text-gray-700 mb-2" htmlFor="profilePublicName">
                                  Name für die Auswertung (optional)
                                </label>
                                <input
                                    id="profilePublicName"
                                    type="text"
                                    value={profilePublicName}
                                    onChange={(e) => setProfilePublicName(e.currentTarget.value)}
                                    placeholder="Dein Name"
                                    className="w-full rounded-2xl border border-gray-200 p-4 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)] transition"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  Du kannst auch anonym bleiben oder ein Pseudonym nutzen. Wir veröffentlichen keine personenbezogenen Daten.
                                </p>
                              </div>

                              <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                  <input
                                      type="checkbox"
                                      checked={profileNotifyMe}
                                      onChange={(e) => {
                                        const enabled = e.currentTarget.checked;
                                        setProfileNotifyMe(enabled);
                                        if (!enabled) {
                                          setProfileNotifyEmail("");
                                          setProfileNotifyConsent(false);
                                        }
                                      }}
                                      className="w-5 h-5 accent-[var(--brand)]"
                                  />
                                  <span className="text-gray-700">
        Ich möchte über das Ergebnis informiert werden (freiwillig)
      </span>
                                </label>

                                {profileNotifyMe && (
                                    <div className="space-y-3">
                                      <input
                                          type="email"
                                          value={profileNotifyEmail}
                                          onChange={(e) => setProfileNotifyEmail(e.currentTarget.value)}
                                          placeholder="Deine E-Mail für die einmalige Benachrichtigung"
                                          className="w-full rounded-2xl border border-gray-200 p-4 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)] transition"
                                      />

                                      <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={profileNotifyConsent}
                                            onChange={(e) => setProfileNotifyConsent(e.currentTarget.checked)}
                                            className="mt-1 w-5 h-5 accent-[var(--brand)]"
                                        />
                                        <span className="text-sm text-gray-600">
          Ich willige ein, dass meine E-Mail ausschließlich für eine einmalige Ergebnis-Benachrichtigung genutzt wird (keine Werbung, keine Marketing-Nutzung).
        </span>
                                      </label>
                                    </div>
                                )}
                              </div>

                              {profileMessage && (
                                  <div className="alert alert-muted p-3 text-sm">
                                    {profileMessage}
                                  </div>
                              )}

                              <button
                                  type="button"
                                  onClick={handleUpdateOwnSettings}
                                  disabled={savingProfile}
                                  className="w-full py-4 rounded-2xl btn-primary font-semibold tracking-wide shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
                              >
                                {savingProfile ? "Speichern..." : "Änderungen speichern"}
                              </button>

                              {allowSelfDelete && (
                                  <button
                                      type="button"
                                      onClick={handleDeleteForTesting}
                                      disabled={deletingVote}
                                      className="w-full py-3 rounded-2xl border border-red-300 text-red-700 font-medium bg-red-50 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    {deletingVote ? "Lösche..." : "Test zurücksetzen (Abstimmung löschen)"}
                                  </button>
                              )}
                            </div>
                        )}
                      </div>
                  ) : (
                      <div className="alert alert-muted">
                        Deine Angaben konnten aktuell nicht geladen werden.
                      </div>
                  )}
                </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-12">

                {errorMessage && (
                    <div className="alert alert-error">
                      <p className="font-medium">{errorMessage}</p>
                    </div>
                )}

                <input type="text" name="website" className="hidden" />

                {/* ---------------- WAHRNEHMUNG ---------------- */}
                <div id="frage-wahrnehmung">
                  <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-900">
                    Wenn du spontan an uns denkst – was fällt dir ein?
                  </h2>

                  <p className="text-sm text-gray-500 mb-6">
                    Mehrfachauswahl möglich
                  </p>

                  <div className="space-y-3">
                    {[
                      "Unsere Croques",
                      "Lieferservice",
                      "Pizza",
                      "Pasta",
                      "Atmosphäre",
                      "Treffpunkt im Ort",
                      "Die Vielfalt",
                      "Sonstiges"
                    ].map((item) => (
                        <label key={item} className="relative block cursor-pointer group">

                          <input
                              type="checkbox"
                              name="identity"
                              value={item}
                              onChange={(e) => {
                                const form = e.currentTarget.form;
                                if (form) {
                                  const checkedIdentities = form.querySelectorAll('input[name="identity"]:checked').length;
                                  setIdentitySelectionCount(checkedIdentities);
                                }

                                if (item === "Sonstiges") {
                                  const isChecked = e.currentTarget.checked;
                                  setIdentityOtherSelected(isChecked);
                                  if (!isChecked) {
                                    setIdentityOtherText("");
                                  }
                                }
                              }}
                              className="absolute opacity-0 peer"
                          />

                          <div className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-[var(--brand)] hover:shadow-md transition-all duration-200 group-has-[:checked]:border-[var(--brand)] group-has-[:checked]:bg-[var(--brand-soft)] flex items-center justify-between">

        <span className="text-gray-800">
          {item}
        </span>

                            <div className="w-6 h-6 rounded-full border border-gray-400  flex items-center justify-center transition-all group-has-[:checked]:bg-[var(--brand)] group-has-[:checked]:border-[var(--brand)]">

                              <svg
                                  className="w-4 h-4 opacity-0 group-has-[:checked]:opacity-100 group-has-[:checked]:text-green-500 transition"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>

                            </div>

                          </div>

                        </label>
                    ))}
                  </div>

                  {identityOtherSelected && (
                      <div className="mt-4">
                        <label className="block text-sm text-gray-700 mb-2" htmlFor="identityOtherText">
                          Was meinst du mit „Sonstiges“?
                        </label>
                        <input
                            id="identityOtherText"
                            name="identityOtherText"
                            type="text"
                            required
                            value={identityOtherText}
                            onChange={(e) => setIdentityOtherText(e.currentTarget.value)}
                            placeholder="Deine Ergänzung zu Sonstiges"
                            className="w-full rounded-2xl border border-gray-200 p-4 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)] transition"
                        />
                      </div>
                  )}

                </div>

                {/* ---------------- ZUKUNFT ---------------- */}
                <div id="frage-fokus">
                  <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-900">
                    Wenn wir uns klarer positionieren müssten –
                    wofür sollen wir am stärksten stehen?
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Erlaubt: eine Auswahl oder eine Auswahl + Sonstiges
                  </p>

                  <div className="space-y-3">
                    {[
                      "Vor allem für unsere Croques",
                      "Croques als Schwerpunkt – Pizza & Pasta ergänzend",
                      "Croques und Pizza gleichwertig",
                      "Croques, Pizza & Pasta gleichwertig",
                      "Die Vielfalt ist genau richtig so",
                      "Sonstiges"
                    ].map((item) => (
                        <label key={item} className="relative block cursor-pointer group">

                          <input
                              type="checkbox"
                              name="focus"
                              value={item}
                              onChange={(e) => {
                                const form = e.currentTarget.form;
                                if (!form) return;

                                const selected = Array.from(
                                    form.querySelectorAll<HTMLInputElement>('input[name="focus"]:checked')
                                ).map((input) => input.value);

                                const hasOther = selected.includes("Sonstiges");
                                const withoutOther = selected.filter((value) => value !== "Sonstiges");
                                const valid =
                                    selected.length === 1 ||
                                    (selected.length === 2 && hasOther && withoutOther.length === 1);

                                if (!valid) {
                                  e.currentTarget.checked = false;
                                  setFocusSelectionMessage("Bitte nur eine Auswahl oder eine Auswahl plus „Sonstiges“.");
                                  const corrected = Array.from(
                                      form.querySelectorAll<HTMLInputElement>('input[name="focus"]:checked')
                                  ).map((input) => input.value);
                                  setFocusSelectionCount(corrected.length);
                                  const correctedHasOther = corrected.includes("Sonstiges");
                                  setFocusOtherSelected(correctedHasOther);
                                  if (!correctedHasOther) {
                                    setFocusOtherText("");
                                  }
                                  setFocusSelected(corrected.length > 0);
                                  return;
                                }

                                setFocusSelectionMessage(null);
                                setFocusSelectionCount(selected.length);
                                setFocusSelected(selected.length > 0);
                                setFocusOtherSelected(hasOther);
                                if (!hasOther) {
                                  setFocusOtherText("");
                                }
                              }}
                              className="absolute opacity-0 peer"
                          />

                          <div className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-[var(--brand)] hover:shadow-md transition-all duration-200 group-has-[:checked]:border-[var(--brand)] group-has-[:checked]:bg-[var(--brand-soft)] flex items-center justify-between">

        <span className="text-gray-800">
          {item}
        </span>

                            <div className="w-6 h-6 rounded-full border border-gray-400  flex items-center justify-center transition-all group-has-[:checked]:bg-[var(--brand)] group-has-[:checked]:border-[var(--brand)]">

                              <svg
                                  className="w-4 h-4 text-white opacity-0 group-has-[:checked]:opacity-100 group-has-[:checked]:text-green-500 transition"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>

                            </div>

                          </div>

                        </label>
                    ))}
                  </div>

                  {focusSelectionMessage && (
                      <p className="mt-3 text-sm text-red-600">{focusSelectionMessage}</p>
                  )}

                  {focusOtherSelected && (
                      <div className="mt-4">
                        <label className="block text-sm text-gray-700 mb-2" htmlFor="focusOtherText">
                          Was sollen wir deiner Meinung nach am stärksten fokussieren?
                        </label>
                        <input
                            id="focusOtherText"
                            name="focusOtherText"
                            type="text"
                            required
                            value={focusOtherText}
                            onChange={(e) => setFocusOtherText(e.currentTarget.value)}
                            placeholder="Deine Ergänzung zu Sonstiges"
                            className="w-full rounded-2xl border border-gray-200 p-4 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)] transition"
                        />
                      </div>
                  )}

                </div>

                {/* ---------------- IDENTITÄTSRICHTUNG ---------------- */}
                <div id="frage-identitaetsrichtung">
                  <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-900">
                    Wofür sollten wir aus deiner Sicht in erster Linie stehen?
                  </h2>

                  <div className="space-y-3">
                    {[
                      "Klar für Croques",
                      "Croques im Fokus, Pizza/Pasta als Ergänzung",
                      "Croques und Pizza gleichwertig",
                      "Breite Vielfalt (Croques, Pizza, Pasta)",
                      "Sonstiges"
                    ].map((item) => (
                        <label key={item} className="relative block cursor-pointer group">
                          <input
                              type="radio"
                              name="identityDirection"
                              value={item}
                              required
                              onChange={() => {
                                setIdentityDirectionSelected(true);
                                const isOther = item === "Sonstiges";
                                setIdentityDirectionOtherSelected(isOther);
                                if (!isOther) {
                                  setIdentityDirectionOtherText("");
                                }
                              }}
                              className="absolute opacity-0 peer"
                          />
                          <div className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-[var(--brand)] hover:shadow-md transition-all duration-200 group-has-[:checked]:border-[var(--brand)] group-has-[:checked]:bg-[var(--brand-soft)] flex items-center justify-between">
                            <span className="text-gray-800">{item}</span>
                            <div className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center transition-all group-has-[:checked]:bg-[var(--brand)] group-has-[:checked]:border-[var(--brand)]">
                              <svg
                                  className="w-4 h-4 text-white opacity-0 group-has-[:checked]:opacity-100 transition"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </label>
                    ))}
                  </div>

                  {identityDirectionOtherSelected && (
                      <div className="mt-4">
                        <label className="block text-sm text-gray-700 mb-2" htmlFor="identityDirectionOtherText">
                          Was verstehst du unter „Sonstiges“?
                        </label>
                        <input
                            id="identityDirectionOtherText"
                            name="identityDirectionOtherText"
                            type="text"
                            required
                            value={identityDirectionOtherText}
                            onChange={(e) => setIdentityDirectionOtherText(e.currentTarget.value)}
                            placeholder="Deine Ergänzung zur Identitätsrichtung"
                            className="w-full rounded-2xl border border-gray-200 p-4 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)] transition"
                        />
                      </div>
                  )}
                </div>

                <div id="frage-nutzung">
                  <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-900">
                    Wie nutzt du unser Angebot am häufigsten?
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">Mehrfachauswahl möglich</p>

                  <div className="space-y-3">
                    {[
                      "Im Laden vor Ort",
                      "Abholung",
                      "Lieferservice",
                      "Telefonische Bestellung",
                      "Online-Bestellung"
                    ].map((item) => (
                        <label key={item} className="relative block cursor-pointer group">
                          <input
                              type="checkbox"
                              name="usageChannels"
                              value={item}
                              onChange={(e) => {
                                const form = e.currentTarget.form;
                                if (!form) return;
                                const checkedCount = form.querySelectorAll('input[name="usageChannels"]:checked').length;
                                setUsageSelectionCount(checkedCount);
                              }}
                              className="absolute opacity-0 peer"
                          />
                          <div className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-[var(--brand)] hover:shadow-md transition-all duration-200 group-has-[:checked]:border-[var(--brand)] group-has-[:checked]:bg-[var(--brand-soft)] flex items-center justify-between">
                            <span className="text-gray-800">{item}</span>
                            <div className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center transition-all group-has-[:checked]:bg-[var(--brand)] group-has-[:checked]:border-[var(--brand)]">
                              <svg
                                  className="w-4 h-4 text-white opacity-0 group-has-[:checked]:opacity-100 transition"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </label>
                    ))}
                  </div>
                </div>

                <div id="frage-prioritaeten">
                  <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-900">
                    Welche drei Themen sind dir für unsere Zukunft am wichtigsten?
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">Bitte maximal 3 auswählen</p>

                  <div className="space-y-3">
                    {[
                      "Croque-Qualität",
                      "Klarer Croque-Fokus",
                      "Vielfalt im Angebot",
                      "Liefergeschwindigkeit",
                      "Preis-Leistung",
                      "Konstanz / Verlässlichkeit"
                    ].map((item) => (
                        <label key={item} className="relative block cursor-pointer group">
                          <input
                              type="checkbox"
                              name="priorities"
                              value={item}
                              onChange={(e) => {
                                const form = e.currentTarget.form;
                                if (!form) return;

                                let checkedCount = form.querySelectorAll('input[name="priorities"]:checked').length;
                                if (checkedCount > 3) {
                                  e.currentTarget.checked = false;
                                  checkedCount -= 1;
                                  setPriorityLimitMessage("Maximal 3 Prioritäten möglich.");
                                } else {
                                  setPriorityLimitMessage(null);
                                }

                                setPrioritySelectionCount(checkedCount);
                              }}
                              className="absolute opacity-0 peer"
                          />
                          <div className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-[var(--brand)] hover:shadow-md transition-all duration-200 group-has-[:checked]:border-[var(--brand)] group-has-[:checked]:bg-[var(--brand-soft)] flex items-center justify-between">
                            <span className="text-gray-800">{item}</span>
                            <div className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center transition-all group-has-[:checked]:bg-[var(--brand)] group-has-[:checked]:border-[var(--brand)]">
                              <svg
                                  className="w-4 h-4 text-white opacity-0 group-has-[:checked]:opacity-100 transition"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </label>
                    ))}
                  </div>

                  <p className="mt-3 text-sm text-gray-500">
                    Ausgewählt: {prioritySelectionCount}/3
                  </p>
                  {priorityLimitMessage && (
                      <p className="mt-2 text-sm text-red-600">{priorityLimitMessage}</p>
                  )}
                </div>

                <div id="frage-aenderungsbedarf">
                  <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-900">
                    Wo siehst du den größten Änderungsbedarf?
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">Mehrfachauswahl möglich</p>

                  <div className="space-y-3">
                    {[
                      "Angebot klarer strukturieren",
                      "Mehr Fokus auf Croques",
                      "Lieferprozess verbessern",
                      "Preisstruktur überdenken",
                      "Keine größeren Änderungen",
                      "Sonstiges"
                    ].map((item) => (
                        <label key={item} className="relative block cursor-pointer group">
                          <input
                              type="checkbox"
                              name="changeWishes"
                              value={item}
                              onChange={(e) => {
                                if (item === "Sonstiges") {
                                  const isChecked = e.currentTarget.checked;
                                  setChangeWishOtherSelected(isChecked);
                                  if (!isChecked) {
                                    setChangeWishOtherText("");
                                  }
                                }
                              }}
                              className="absolute opacity-0 peer"
                          />
                          <div className="p-5 rounded-2xl border border-gray-200 bg-white hover:border-[var(--brand)] hover:shadow-md transition-all duration-200 group-has-[:checked]:border-[var(--brand)] group-has-[:checked]:bg-[var(--brand-soft)] flex items-center justify-between">
                            <span className="text-gray-800">{item}</span>
                            <div className="w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center transition-all group-has-[:checked]:bg-[var(--brand)] group-has-[:checked]:border-[var(--brand)]">
                              <svg
                                  className="w-4 h-4 text-white opacity-0 group-has-[:checked]:opacity-100 transition"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="3"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                              >
                                <path d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          </div>
                        </label>
                    ))}
                  </div>

                  {changeWishOtherSelected && (
                      <div className="mt-4">
                        <label className="block text-sm text-gray-700 mb-2" htmlFor="changeWishesOtherText">
                          Was möchtest du zusätzlich ändern?
                        </label>
                        <input
                            id="changeWishesOtherText"
                            name="changeWishesOtherText"
                            type="text"
                            required
                            value={changeWishOtherText}
                            onChange={(e) => setChangeWishOtherText(e.currentTarget.value)}
                            placeholder="Deine Ergänzung zu Sonstiges"
                            className="w-full rounded-2xl border border-gray-200 p-4 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)] transition"
                        />
                      </div>
                  )}
                </div>

                {/* ---------------- FREITEXT ---------------- */}
                <div id="frage-nps">
                  <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-900">
                    Möchtest du uns noch etwas mitgeben?
                  </h2>

                  <textarea
                      name="improve"
                      rows={4}
                      placeholder="Deine Gedanken… (optional)"
                      className="w-full rounded-2xl border border-gray-200 p-5 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)] transition"
                  />
                </div>

                {/* ---------------- NPS ---------------- */}
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold mb-6 text-gray-900">
                    Wie stark würdest du unseren zukünftigen Kurs mittragen?
                  </h2>

                  <p className="text-sm text-gray-500 mb-6">
                    1 = eher dagegen &nbsp;&nbsp; 10 = voll dabei
                  </p>

                  <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                    {[1,2,3,4,5,6,7,8,9,10].map((num) => (
                        <label key={num} className="cursor-pointer">
                          <input
                              type="radio"
                              name="nps"
                              value={num}
                              required
                              onChange={() => setNpsSelected(true)}
                              className="hidden peer"
                          />
                          <div className="py-3 rounded-xl border border-gray-200 text-center peer-checked:bg-[var(--brand)] peer-checked:text-white hover:border-[var(--brand)] transition">{num}</div>
                        </label>
                    ))}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500 md:grid-cols-3">
                    <p>1-4: eher gegen Veränderung</p>
                    <p>5-7: unentschlossen</p>
                    <p>8-10: klarer Rückenwind</p>
                  </div>
                </div>

                {/* ---------------- ÖFFENTLICH ---------------- */}
                <div id="frage-benachrichtigung" className="pt-6 border-t border-gray-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        onChange={(e) => setShowPublic(e.currentTarget.checked)}
                        className="w-5 h-5 accent-[var(--brand)]"
                    />
                    <span className="text-gray-700">
        Ich möchte einen Namen für die Auswertung angeben (freiwillig)
      </span>
                  </label>

                  {showPublic && (
                      <div className="mt-4 space-y-2">
                        <input
                            type="text"
                            name="publicName"
                            placeholder="Name oder Pseudonym"
                            className="w-full rounded-2xl border border-gray-200 p-4 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)] transition"
                        />
                        <p className="text-xs text-gray-500">
                          Optional: Du kannst anonym bleiben. Der Name wird nur für die Auswertung genutzt, nicht für Marketing.
                        </p>
                      </div>
                  )}

                  <div className="mt-6 space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                          type="checkbox"
                          name="notifyOptIn"
                          value="1"
                          checked={notifyMe}
                          onChange={(e) => {
                            const enabled = e.currentTarget.checked;
                            setNotifyMe(enabled);
                            if (!enabled) {
                              setNotifyEmail("");
                              setNotifyConsent(false);
                            }
                          }}
                          className="w-5 h-5 accent-[var(--brand)]"
                      />
                      <span className="text-gray-700">
        Ich möchte über das Ergebnis informiert werden (freiwillig)
      </span>
                    </label>

                    {notifyMe && (
                        <div className="space-y-3">
                          <input
                              type="email"
                              name="notifyEmail"
                              value={notifyEmail}
                              onChange={(e) => setNotifyEmail(e.currentTarget.value)}
                              required
                              placeholder="Deine E-Mail für die einmalige Benachrichtigung"
                              className="w-full rounded-2xl border border-gray-200 p-4 focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-ring)] transition"
                          />

                          <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="notifyConsent"
                                value="1"
                                checked={notifyConsent}
                                onChange={(e) => setNotifyConsent(e.currentTarget.checked)}
                                required
                                className="mt-1 w-5 h-5 accent-[var(--brand)]"
                            />
                            <span className="text-sm text-gray-600">
          Ich willige ein, dass meine E-Mail ausschließlich für eine einmalige Ergebnis-Benachrichtigung genutzt wird (keine Werbung, keine Marketing-Nutzung).
        </span>
                          </label>
                        </div>
                    )}
                  </div>
                </div>

                {!isFormReady && missingRequirements.length > 0 && (
                    <div className="alert alert-warning">
                      <p className="font-semibold">
                        Es fehlen noch Pflichtangaben.
                      </p>
                      <p className="text-sm mt-1">
                        Klicke auf einen Punkt, um direkt zur Frage zu springen.
                      </p>
                      <div className="mt-3 flex flex-col gap-2">
                        {missingRequirements.map((item, index) => (
                            <button
                                key={`${item.targetId}-${index}`}
                                type="button"
                                onClick={() => scrollToQuestion(item.targetId)}
                                className="alert-link text-left text-sm"
                            >
                              {item.label}
                            </button>
                        ))}
                      </div>
                    </div>
                )}

                {/* ---------------- BUTTON ---------------- */}
                <button
                    disabled={isSubmitDisabled}
                    className="w-full py-4 rounded-2xl btn-primary font-semibold tracking-wide shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
                >
                  {loading ? "Senden..." : "Absenden"}
                </button>

              </form>

          )}

          </div>
        </section>

      </main>
  );
}
