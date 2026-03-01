import { NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import db from "@/lib/db";

export const runtime = "nodejs";

type FeedbackRow = {
    id: number;
    identity: string | null;
    identityOtherText: string | null;
    focus: string;
    focusSelections: string | null;
    focusOtherText: string | null;
    identityDirection: string | null;
    identityDirectionOtherText: string | null;
    usageChannels: string | null;
    priorities: string | null;
    changeWishes: string | null;
    changeWishesOtherText: string | null;
    improve: string | null;
    nps: number;
    publicName: string | null;
    notifyOptIn: number | null;
    notifyEmail: string | null;
    notifyConsent: number | null;
    voterHash: string | null;
    editToken: string | null;
    createdAt: string;
};

function getResultsConfig() {
    const resultsAvailable = process.env.FEEDBACK_RESULTS_ENABLED === "true";
    const resultsPath = process.env.FEEDBACK_RESULTS_PATH ?? "/auswertung";

    return {
        resultsAvailable,
        resultsPath: resultsAvailable ? resultsPath : null,
    };
}

function allowSelfDelete(): boolean {
    return process.env.FEEDBACK_ALLOW_SELF_DELETE === "true";
}

function getCookieValue(req: Request, name: string): string | null {
    const cookieHeader = req.headers.get("cookie");
    if (!cookieHeader) return null;

    const target = cookieHeader
        .split(";")
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith(`${name}=`));

    if (!target) return null;
    return decodeURIComponent(target.slice(name.length + 1));
}

function getClientIp(req: Request): string {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
        return forwardedFor.split(",")[0]?.trim() ?? "";
    }

    return req.headers.get("x-real-ip") ?? "";
}

function buildVoterHash(req: Request): string {
    const pepper = process.env.FEEDBACK_VOTE_PEPPER ?? "local-dev-pepper";
    const ip = getClientIp(req) || "unknown-ip";
    const userAgent = req.headers.get("user-agent") ?? "unknown-ua";

    return createHash("sha256")
        .update(`${pepper}:${ip}:${userAgent}`)
        .digest("hex");
}

function getOwnFeedbackByVoterHash(voterHash: string): FeedbackRow | undefined {
    return db.prepare(`
        SELECT id, identity, identityOtherText, focus, focusSelections, focusOtherText, identityDirection, identityDirectionOtherText, usageChannels, priorities, changeWishes, changeWishesOtherText, improve, nps, publicName, notifyOptIn, notifyEmail, notifyConsent, voterHash, editToken, createdAt
        FROM feedback
        WHERE voterHash = ?
        LIMIT 1
    `).get(voterHash) as FeedbackRow | undefined;
}

function getOwnFeedbackByEditToken(editToken: string): FeedbackRow | undefined {
    return db.prepare(`
        SELECT id, identity, identityOtherText, focus, focusSelections, focusOtherText, identityDirection, identityDirectionOtherText, usageChannels, priorities, changeWishes, changeWishesOtherText, improve, nps, publicName, notifyOptIn, notifyEmail, notifyConsent, voterHash, editToken, createdAt
        FROM feedback
        WHERE editToken = ?
        LIMIT 1
    `).get(editToken) as FeedbackRow | undefined;
}

function resolveOwnFeedback(req: Request): FeedbackRow | undefined {
    const token = getCookieValue(req, "feedback_edit_token");
    if (token) {
        const byToken = getOwnFeedbackByEditToken(token);
        if (byToken) return byToken;
    }

    return getOwnFeedbackByVoterHash(buildVoterHash(req));
}

function ensureEditToken(row: FeedbackRow): string {
    if (row.editToken) return row.editToken;

    const newToken = randomUUID();
    db.prepare("UPDATE feedback SET editToken = ? WHERE id = ?").run(newToken, row.id);
    return newToken;
}

function setVoterCookies(response: NextResponse, editToken: string) {
    response.cookies.set({
        name: "feedback_voted",
        value: "1",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
    });

    response.cookies.set({
        name: "feedback_edit_token",
        value: editToken,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
        path: "/",
    });
}

function clearVoterCookies(response: NextResponse) {
    response.cookies.set({
        name: "feedback_voted",
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
        path: "/",
    });

    response.cookies.set({
        name: "feedback_edit_token",
        value: "",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
        path: "/",
    });
}

function parseIdentity(raw: string | null): string[] {
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

function parseStringArray(raw: string | null): string[] {
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

function toSubmission(row: FeedbackRow) {
    return {
        identity: parseIdentity(row.identity),
        identityOtherText: row.identityOtherText ?? "",
        focus: row.focus,
        focusSelections: parseStringArray(row.focusSelections),
        focusOtherText: row.focusOtherText ?? "",
        identityDirection: row.identityDirection ?? "",
        identityDirectionOtherText: row.identityDirectionOtherText ?? "",
        usageChannels: parseStringArray(row.usageChannels),
        priorities: parseStringArray(row.priorities),
        changeWishes: parseStringArray(row.changeWishes),
        changeWishesOtherText: row.changeWishesOtherText ?? "",
        improve: row.improve ?? "",
        nps: row.nps,
        publicName: row.publicName ?? "",
        notifyOptIn: Boolean(row.notifyOptIn),
        notifyEmail: row.notifyEmail ?? "",
        notifyConsent: Boolean(row.notifyConsent),
        createdAt: row.createdAt,
    };
}

export async function GET(req: Request) {
    const { resultsAvailable, resultsPath } = getResultsConfig();
    const ownFeedback = resolveOwnFeedback(req);
    const voted = Boolean(ownFeedback);

    const response = NextResponse.json({
        voted,
        resultsAvailable,
        resultsPath,
        allowSelfDelete: allowSelfDelete(),
        submission: ownFeedback ? toSubmission(ownFeedback) : null,
    });

    if (ownFeedback) {
        setVoterCookies(response, ensureEditToken(ownFeedback));
    }

    return response;
}

export async function DELETE(req: Request) {
    if (!allowSelfDelete()) {
        return NextResponse.json(
            { error: "Test-Reset ist nicht freigeschaltet." },
            { status: 403 }
        );
    }

    const ownFeedback = resolveOwnFeedback(req);

    if (ownFeedback) {
        db.prepare("DELETE FROM feedback WHERE id = ?").run(ownFeedback.id);
    }

    const response = NextResponse.json({
        success: true,
        deleted: Boolean(ownFeedback),
    });
    clearVoterCookies(response);
    return response;
}

export async function PATCH(req: Request) {
    try {
        const { resultsAvailable } = getResultsConfig();
        if (resultsAvailable) {
            return NextResponse.json(
                { error: "Änderungen sind nach Freischaltung der Auswertung nicht mehr möglich." },
                { status: 423 }
            );
        }

        const ownFeedback = resolveOwnFeedback(req);

        if (!ownFeedback) {
            return NextResponse.json({ error: "Keine Abstimmung gefunden." }, { status: 404 });
        }

        const body = await req.json();

        const publicName = typeof body.publicName === "string"
            ? body.publicName.trim()
            : "";
        const notifyOptIn = body.notifyOptIn === "1" || body.notifyOptIn === "on" || body.notifyOptIn === true;
        const notifyEmail = typeof body.notifyEmail === "string" ? body.notifyEmail.trim() : "";
        const notifyConsent = body.notifyConsent === "1" || body.notifyConsent === "on" || body.notifyConsent === true;

        if (notifyOptIn) {
            const simpleEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!notifyEmail || !simpleEmailPattern.test(notifyEmail)) {
                return NextResponse.json(
                    { error: "Bitte gib eine gültige E-Mail für die Benachrichtigung ein." },
                    { status: 400 }
                );
            }

            if (!notifyConsent) {
                return NextResponse.json(
                    { error: "Bitte bestätige die Einwilligung für die Ergebnis-Benachrichtigung." },
                    { status: 400 }
                );
            }
        }

        db.prepare(`
            UPDATE feedback
            SET publicName = ?, notifyOptIn = ?, notifyEmail = ?, notifyConsent = ?
            WHERE id = ?
        `).run(
            publicName || null,
            notifyOptIn ? 1 : 0,
            notifyOptIn ? notifyEmail : null,
            notifyOptIn && notifyConsent ? 1 : 0,
            ownFeedback.id
        );

        const updated = db.prepare(`
            SELECT id, identity, identityOtherText, focus, focusSelections, focusOtherText, identityDirection, identityDirectionOtherText, usageChannels, priorities, changeWishes, changeWishesOtherText, improve, nps, publicName, notifyOptIn, notifyEmail, notifyConsent, voterHash, editToken, createdAt
            FROM feedback
            WHERE id = ?
            LIMIT 1
        `).get(ownFeedback.id) as FeedbackRow | undefined;
        const response = NextResponse.json({
            success: true,
            submission: updated ? toSubmission(updated) : null,
        });
        setVoterCookies(response, ensureEditToken(ownFeedback));
        return response;
    } catch (error) {
        console.error("Feedback API patch error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { resultsAvailable, resultsPath } = getResultsConfig();

        // Honeypot
        if (body.website) {
            return NextResponse.json({ error: "Bot detected" }, { status: 400 });
        }

        // Basic validation
        if (!body.focus || typeof body.nps === "undefined") {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const nps = Number(body.nps);
        if (!Number.isFinite(nps) || nps < 1 || nps > 10) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const voterHash = buildVoterHash(req);
        const existingVote = getOwnFeedbackByVoterHash(voterHash);

        if (existingVote) {
            const response = NextResponse.json(
                {
                    error: "Du hast bereits abgestimmt.",
                    voted: true,
                    resultsAvailable,
                    resultsPath,
                },
                { status: 429 }
            );
            setVoterCookies(response, ensureEditToken(existingVote));
            return response;
        }

        const rawIdentityValues: unknown[] = Array.isArray(body.identity)
            ? body.identity
            : body.identity
                ? [body.identity]
                : [];
        const identityValues = rawIdentityValues
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);

        if (identityValues.length === 0) {
            return NextResponse.json(
                { error: "Bitte wähle mindestens eine Option in der ersten Frage aus." },
                { status: 400 }
            );
        }

        const identity = JSON.stringify(identityValues);
        const identityOtherText = typeof body.identityOtherText === "string"
            ? body.identityOtherText.trim()
            : "";
        const rawFocusSelections: unknown[] = Array.isArray(body.focus)
            ? body.focus
            : body.focus
                ? [body.focus]
                : [];
        const focusSelections = rawFocusSelections
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
        const focusOtherText = typeof body.focusOtherText === "string"
            ? body.focusOtherText.trim()
            : "";
        const identityDirection = typeof body.identityDirection === "string"
            ? body.identityDirection.trim()
            : "";
        const identityDirectionOtherText = typeof body.identityDirectionOtherText === "string"
            ? body.identityDirectionOtherText.trim()
            : "";
        const rawUsageChannels: unknown[] = Array.isArray(body.usageChannels)
            ? body.usageChannels
            : body.usageChannels
                ? [body.usageChannels]
                : [];
        const usageChannels = rawUsageChannels
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
        const rawPriorities: unknown[] = Array.isArray(body.priorities)
            ? body.priorities
            : body.priorities
                ? [body.priorities]
                : [];
        const priorities = rawPriorities
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
        const rawChangeWishes: unknown[] = Array.isArray(body.changeWishes)
            ? body.changeWishes
            : body.changeWishes
                ? [body.changeWishes]
                : [];
        const changeWishes = rawChangeWishes
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
        const changeWishesOtherText = typeof body.changeWishesOtherText === "string"
            ? body.changeWishesOtherText.trim()
            : "";
        const improveText = typeof body.improve === "string" ? body.improve.trim() : "";
        const notifyOptIn = body.notifyOptIn === "1" || body.notifyOptIn === "on" || body.notifyOptIn === true;
        const notifyEmail = typeof body.notifyEmail === "string" ? body.notifyEmail.trim() : "";
        const notifyConsent = body.notifyConsent === "1" || body.notifyConsent === "on" || body.notifyConsent === true;

        if (identityValues.includes("Sonstiges") && !identityOtherText) {
            return NextResponse.json(
                { error: "Bitte ergänze bei „Sonstiges“, was dir einfällt." },
                { status: 400 }
            );
        }

        if (focusSelections.length === 0) {
            return NextResponse.json(
                { error: "Bitte wähle mindestens eine Fokus-Option aus." },
                { status: 400 }
            );
        }

        const focusHasOther = focusSelections.includes("Sonstiges");
        const focusWithoutOther = focusSelections.filter((item) => item !== "Sonstiges");
        const focusSelectionValid =
            focusSelections.length === 1 ||
            (focusSelections.length === 2 && focusHasOther && focusWithoutOther.length === 1);

        if (!focusSelectionValid) {
            return NextResponse.json(
                { error: "Beim Fokus ist nur eine Auswahl erlaubt oder eine Auswahl plus „Sonstiges“." },
                { status: 400 }
            );
        }

        if (focusHasOther && !focusOtherText) {
            return NextResponse.json(
                { error: "Bitte ergänze bei „Sonstiges“ in der Fokus-Frage deine Angabe." },
                { status: 400 }
            );
        }

        const primaryFocus = focusWithoutOther[0] ?? "Sonstiges";

        if (!identityDirection) {
            return NextResponse.json(
                { error: "Bitte gib an, wofür wir aus deiner Sicht in erster Linie stehen sollten." },
                { status: 400 }
            );
        }

        if (identityDirection === "Sonstiges" && !identityDirectionOtherText) {
            return NextResponse.json(
                { error: "Bitte ergänze bei der Identitätsfrage unter „Sonstiges“ deine Angabe." },
                { status: 400 }
            );
        }

        if (usageChannels.length === 0) {
            return NextResponse.json(
                { error: "Bitte wähle mindestens eine Nutzungsart aus." },
                { status: 400 }
            );
        }

        if (priorities.length === 0 || priorities.length > 3) {
            return NextResponse.json(
                { error: "Bitte wähle 1 bis 3 Prioritäten für unsere Zukunft aus." },
                { status: 400 }
            );
        }

        if (changeWishes.includes("Sonstiges") && !changeWishesOtherText) {
            return NextResponse.json(
                { error: "Bitte ergänze beim Änderungsbedarf unter „Sonstiges“ eine Angabe." },
                { status: 400 }
            );
        }

        if (notifyOptIn) {
            const simpleEmailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!notifyEmail || !simpleEmailPattern.test(notifyEmail)) {
                return NextResponse.json(
                    { error: "Bitte gib eine gültige E-Mail für die Benachrichtigung ein." },
                    { status: 400 }
                );
            }

            if (!notifyConsent) {
                return NextResponse.json(
                    { error: "Bitte bestätige die Einwilligung für die Ergebnis-Benachrichtigung." },
                    { status: 400 }
                );
            }
        }

        const editToken = randomUUID();

        db.prepare(`
            INSERT INTO feedback (identity, identityOtherText, focus, focusSelections, focusOtherText, identityDirection, identityDirectionOtherText, usageChannels, priorities, changeWishes, changeWishesOtherText, improve, nps, publicName, voterHash, editToken, notifyOptIn, notifyEmail, notifyConsent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            identity,
            identityOtherText || null,
            primaryFocus,
            JSON.stringify(focusSelections),
            focusOtherText || null,
            identityDirection,
            identityDirectionOtherText || null,
            JSON.stringify(usageChannels),
            JSON.stringify(priorities),
            JSON.stringify(changeWishes),
            changeWishesOtherText || null,
            improveText,
            nps,
            body.publicName ?? null,
            voterHash,
            editToken,
            notifyOptIn ? 1 : 0,
            notifyOptIn ? notifyEmail : null,
            notifyOptIn && notifyConsent ? 1 : 0
        );

        const response = NextResponse.json({ success: true });
        setVoterCookies(response, editToken);

        return response;

    } catch (error) {
        if (
            error instanceof Error &&
            error.message.includes("UNIQUE constraint failed: feedback.voterHash")
        ) {
            const { resultsAvailable, resultsPath } = getResultsConfig();
            const existingVote = getOwnFeedbackByVoterHash(buildVoterHash(req));
            const response = NextResponse.json(
                {
                    error: "Du hast bereits abgestimmt.",
                    voted: true,
                    resultsAvailable,
                    resultsPath,
                },
                { status: 429 }
            );
            if (existingVote) {
                setVoterCookies(response, ensureEditToken(existingVote));
            }
            return response;
        }

        console.error("Feedback API error:", error);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
