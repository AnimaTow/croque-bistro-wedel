import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "feedback.db");

const db = new Database(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
                                            id INTEGER PRIMARY KEY,
                                            identity TEXT,
                                            identityOtherText TEXT,
                                            focus TEXT,
                                            focusSelections TEXT,
                                            focusOtherText TEXT,
                                            identityDirection TEXT,
                                            identityDirectionOtherText TEXT,
                                            usageChannels TEXT,
                                            priorities TEXT,
                                            changeWishes TEXT,
                                            changeWishesOtherText TEXT,
                                            improve TEXT,
                                            nps INTEGER,
                                            publicName TEXT,
                                            voterHash TEXT,
                                            editToken TEXT,
                                            notifyOptIn INTEGER DEFAULT 0,
                                            notifyEmail TEXT,
                                            notifyConsent INTEGER DEFAULT 0,
                                            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

type TableColumn = {
    name: string;
};

const feedbackColumns = db
    .prepare("PRAGMA table_info(feedback)")
    .all() as TableColumn[];

if (!feedbackColumns.some((column) => column.name === "voterHash")) {
    db.exec("ALTER TABLE feedback ADD COLUMN voterHash TEXT");
}

if (!feedbackColumns.some((column) => column.name === "identityOtherText")) {
    db.exec("ALTER TABLE feedback ADD COLUMN identityOtherText TEXT");
}

if (!feedbackColumns.some((column) => column.name === "focusOtherText")) {
    db.exec("ALTER TABLE feedback ADD COLUMN focusOtherText TEXT");
}

if (!feedbackColumns.some((column) => column.name === "focusSelections")) {
    db.exec("ALTER TABLE feedback ADD COLUMN focusSelections TEXT");
}

if (!feedbackColumns.some((column) => column.name === "identityDirection")) {
    db.exec("ALTER TABLE feedback ADD COLUMN identityDirection TEXT");
}

if (!feedbackColumns.some((column) => column.name === "identityDirectionOtherText")) {
    db.exec("ALTER TABLE feedback ADD COLUMN identityDirectionOtherText TEXT");
}

if (!feedbackColumns.some((column) => column.name === "usageChannels")) {
    db.exec("ALTER TABLE feedback ADD COLUMN usageChannels TEXT");
}

if (!feedbackColumns.some((column) => column.name === "priorities")) {
    db.exec("ALTER TABLE feedback ADD COLUMN priorities TEXT");
}

if (!feedbackColumns.some((column) => column.name === "changeWishes")) {
    db.exec("ALTER TABLE feedback ADD COLUMN changeWishes TEXT");
}

if (!feedbackColumns.some((column) => column.name === "changeWishesOtherText")) {
    db.exec("ALTER TABLE feedback ADD COLUMN changeWishesOtherText TEXT");
}

if (!feedbackColumns.some((column) => column.name === "editToken")) {
    db.exec("ALTER TABLE feedback ADD COLUMN editToken TEXT");
}

if (!feedbackColumns.some((column) => column.name === "notifyOptIn")) {
    db.exec("ALTER TABLE feedback ADD COLUMN notifyOptIn INTEGER DEFAULT 0");
}

if (!feedbackColumns.some((column) => column.name === "notifyEmail")) {
    db.exec("ALTER TABLE feedback ADD COLUMN notifyEmail TEXT");
}

if (!feedbackColumns.some((column) => column.name === "notifyConsent")) {
    db.exec("ALTER TABLE feedback ADD COLUMN notifyConsent INTEGER DEFAULT 0");
}

db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_voter_hash
    ON feedback(voterHash)
    WHERE voterHash IS NOT NULL
`);

db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_edit_token
    ON feedback(editToken)
    WHERE editToken IS NOT NULL
`);

export default db;
