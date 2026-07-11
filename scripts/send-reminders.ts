import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  Firestore,
  QueryDocumentSnapshot,
  Timestamp,
  getFirestore,
} from "firebase-admin/firestore";
import { sendEmail } from "../src/lib/email";
import {
  DEFAULT_REMINDER_SETTINGS,
  normalizeReminderSettings,
} from "../src/lib/reminderSettings";
import { getEnvVar } from "@/utils";

type ReminderUserDoc = {
  uid: string;
  email: string | null;
  displayName: string | null;
  reminderNextDueAt: Timestamp | null;
  reminderLastSentForDueAt?: Timestamp | null;
  reminderSettings?: {
    emailEnabled?: boolean;
    leadTimeMinutes?: number;
  };
};

type RunOptions = {
  dryRun: boolean;
  maxUsers: number | null;
};

const BATCH_SIZE = 300;
const MAX_WINDOW_MINUTES = 1440;

function parseArgs(): RunOptions {
  const dryRun = process.argv.includes("--dry-run");

  const maxArg = process.argv.find((arg) => arg.startsWith("--max-users="));
  const maxUsers = maxArg ? Number(maxArg.split("=")[1]) : null;

  return {
    dryRun,
    maxUsers:
      Number.isFinite(maxUsers) && (maxUsers as number) > 0 ? maxUsers : null,
  };
}

function initAdmin(): Firestore {
  if (getApps().length === 0) {
    const jsonRaw = getEnvVar("FIREBASE_SERVICE_ACCOUNT_JSON");
    // const credPath = getEnvVar("GOOGLE_APPLICATION_CREDENTIALS");

    if (jsonRaw) {
      const trimmed = jsonRaw.trim();
      const isJsonContent = trimmed.startsWith("{");
      if (!isJsonContent) {
        const absolute = resolve(trimmed);
        const json = JSON.parse(readFileSync(absolute, "utf8")) as Parameters<
          typeof cert
        >[0];
        initializeApp({ credential: cert(json) });
        return getFirestore();
      }

      initializeApp({
        credential: cert(JSON.parse(trimmed) as Parameters<typeof cert>[0]),
      });
    }
    // else if (credPath) {
    //   const absolute = resolve(credPath);
    //   const json = JSON.parse(readFileSync(absolute, "utf8")) as Parameters<
    //     typeof cert
    //   >[0];
    //   initializeApp({ credential: cert(json) });
    // } else {
    //   throw new Error(
    //     "Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON.",
    //   );
    // }
  }

  return getFirestore();
}

function minutesFromNow(minutes: number): Date {
  return new Date(Date.now() + minutes * 60_000);
}

async function syncUserReminderNextDueAt(
  db: Firestore,
  userId: string,
): Promise<Date | null> {
  const setsSnapshot = await db
    .collection("users")
    .doc(userId)
    .collection("sets")
    .orderBy("nextReviewAt", "asc")
    .limit(1)
    .get();

  console.log("setsSnapshot: ", setsSnapshot);

  const earliestTimestamp = setsSnapshot.empty
    ? null
    : (setsSnapshot.docs[0].get("nextReviewAt") as Timestamp | null);
  const earliestDate = earliestTimestamp ? earliestTimestamp.toDate() : null;

  await db.collection("users").doc(userId).set(
    {
      reminderNextDueAt: earliestTimestamp,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return earliestDate;
}

async function buildDueSummary(
  db: Firestore,
  userId: string,
  dueCutoff: Date,
): Promise<{ count: number; titles: string[] }> {
  const dueSetsSnapshot = await db
    .collection("users")
    .doc(userId)
    .collection("sets")
    .where("nextReviewAt", "<=", Timestamp.fromDate(dueCutoff))
    .orderBy("nextReviewAt", "asc")
    .limit(20)
    .get();

  return {
    count: dueSetsSnapshot.size,
    titles: dueSetsSnapshot.docs
      .map((doc) => {
        const title = doc.get("title");
        return typeof title === "string" && title.trim().length > 0
          ? title.trim()
          : "(Untitled set)";
      })
      .slice(0, 5),
  };
}

function composeEmail(
  name: string,
  dueSummary: { count: number; titles: string[] },
): { subject: string; text: string; html: string } {
  const appBaseUrl =
    getEnvVar("APP_BASE_URL")?.trim() || "https://learn-newwords.vercel.app";

  const dashboardUrl = `${appBaseUrl}/dashboard`;

  const subject = `Bạn có ${dueSummary.count} set cần ôn`;

  const greeting = name ? `Chào ${name},` : "Chào bạn,";

  const titleLines = dueSummary.titles.map((title) => `• ${title}`).join("\n");

  const text = [
    greeting,
    "",
    `Hiện có ${dueSummary.count} set đã đến hạn hoặc sắp đến hạn ôn luyện.`,
    dueSummary.titles.length > 0 ? "Một số set tiêu biểu:" : "",
    dueSummary.titles.length > 0 ? titleLines : "",
    "",
    `Mở app để ôn luyện ngay: ${dashboardUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  const titleCards = dueSummary.titles
    .map(
      (title) => `
      <div
        style="
          padding:14px 18px;
          border-bottom:1px solid #eef2f7;
          font-size:15px;
          color:#374151;
        "
      >
        📖 ${title}
      </div>
    `,
    )
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
</head>

<body
  style="
    margin:0;
    padding:32px 20px;
    background:#f5f7fb;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  "
>

<div
  style="
    max-width:600px;
    margin:0 auto;
    background:#ffffff;
    border-radius:20px;
    overflow:hidden;
    border:1px solid #e8ecf3;
  "
>

  <!-- Header -->
  <div
    style="
      background:linear-gradient(135deg,#4f46e5,#7c3aed);
      padding:24px 16px;
      text-align:center;
    "
  >

    <div style="font-size:40px;line-height:1;">
      📚
    </div>

    <h1
      style="
        margin:12px 0 6px;
        color:#ffffff;
        font-size:24px;
        font-weight:700;
      "
    >
      Time to Review!
    </h1>

    <p
      style="
        margin:0;
        color:rgba(255,255,255,.9);
        font-size:15px;
      "
    >
      A few minutes today makes a big difference tomorrow.
    </p>

  </div>

  <!-- Summary -->
  <div
    style="
      margin: 24px;
      padding: 24px 16px;
      background:#f8f7ff;
      border:1px solid #e4e0ff;
      border-radius:16px;
    "
  >

    <div
      style="
        font-size:15px;
        color:#4b5563;
        margin-bottom:12px;
      "
    >
      ${greeting}
    </div>

    <div
      style="
        font-size:17px;
        line-height:1.7;
        color:#111827;
      "
    >
      Hiện có

      <span
        style="
          display:inline-block;
          color:#4f46e5;
          font-weight:700;
        "
      >
        ${dueSummary.count}
      </span>

      <strong>set</strong>
      đã đến hạn hoặc sắp đến hạn ôn luyện.
    </div>

  </div>

  ${
    dueSummary.titles.length > 0
      ? `
  <!-- Sets -->
  <div style="padding:0 24px;">

    <div
      style="
        margin-bottom:14px;
        margin-top:30px;
        font-size:16px;
        font-weight:600;
        color:#111827;
      "
    >
      📚 Một số set tiêu biểu
    </div>

    <div
      style="
        border:1px solid #eef2f7;
        border-radius:14px;
        overflow:hidden;
        background:#ffffff;
      "
    >
      ${titleCards}
    </div>

  </div>
  `
      : ""
  }

  <!-- CTA -->
  <div
    style="
      padding:36px 32px 40px;
      text-align:center;
    "
  >

    <a
      href="${dashboardUrl}"
      style="
        display:inline-block;
        background:#4f46e5;
        color:#ffffff;
        text-decoration:none;
        padding:15px 34px;
        border-radius:999px;
        font-size:16px;
        font-weight:600;
      "
    >
      🚀 Mở app để ôn luyện
    </a>

  </div>

  <!-- Footer -->
  <div
    style="
      background:#fafbfc;
      border-top:1px solid #eef2f7;
      padding:22px;
      text-align:center;
      color:#9ca3af;
      font-size:15px;
    "
  >
    Keep learning, one review at a time 💜
  </div>

</div>

</body>
</html>
  `;

  console.log("send mail:", { subject, text, html });

  return {
    subject,
    text,
    html,
  };
}

function shouldSkipByDuplicate(
  lastSentForDueAt: Timestamp | null | undefined,
  reminderNextDueAt: Date,
): boolean {
  if (!lastSentForDueAt) {
    return false;
  }

  return lastSentForDueAt.toMillis() >= reminderNextDueAt.getTime();
}

async function processUser(
  db: Firestore,
  doc: QueryDocumentSnapshot,
  options: RunOptions,
): Promise<"sent" | "skipped"> {
  // console.log("doc: ", doc);
  const data = doc.data() as ReminderUserDoc;
  const userId = doc.id;
  const email = typeof data.email === "string" ? data.email.trim() : "";
  const displayName =
    typeof data.displayName === "string" ? data.displayName.trim() : "";

  if (!email) {
    return "skipped";
  }

  const reminderNextDueAtRaw = data.reminderNextDueAt;
  if (!(reminderNextDueAtRaw instanceof Timestamp)) {
    await syncUserReminderNextDueAt(db, userId);
    return "skipped";
  }

  const reminderNextDueAt = reminderNextDueAtRaw.toDate();
  const reminderSettings = normalizeReminderSettings(data.reminderSettings);

  if (!reminderSettings.emailEnabled) {
    return "skipped";
  }

  const dueCutoff = minutesFromNow(reminderSettings.leadTimeMinutes);

  if (reminderNextDueAt > dueCutoff) {
    return "skipped";
  }

  if (shouldSkipByDuplicate(data.reminderLastSentForDueAt, reminderNextDueAt)) {
    return "skipped";
  }

  const dueSummary = await buildDueSummary(db, userId, dueCutoff);
  if (dueSummary.count === 0) {
    await syncUserReminderNextDueAt(db, userId);
    return "skipped";
  }

  const emailPayload = composeEmail(displayName, dueSummary);

  if (!options.dryRun) {
    await sendEmail({
      to: email,
      subject: emailPayload.subject,
      text: emailPayload.text,
      html: emailPayload.html,
    });

    await db
      .collection("users")
      .doc(userId)
      .set(
        {
          reminderLastSentAt: FieldValue.serverTimestamp(),
          reminderLastSentForDueAt: Timestamp.fromDate(reminderNextDueAt),
          reminderSettings,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
  }

  return "sent";
}

async function run() {
  const options = parseArgs();
  const db = initAdmin();

  const now = new Date();
  const upperBound = minutesFromNow(MAX_WINDOW_MINUTES);

  let sent = 0;
  let skipped = 0;
  let scanned = 0;

  let lastDoc: QueryDocumentSnapshot | null = null;

  while (true) {
    let userQuery = db
      .collection("users")
      .where("reminderNextDueAt", "<=", Timestamp.fromDate(upperBound))
      .orderBy("reminderNextDueAt", "asc")
      .limit(BATCH_SIZE);

    if (lastDoc) {
      userQuery = userQuery.startAfter(lastDoc);
    }

    const snapshot = await userQuery.get();

    if (snapshot.empty) {
      break;
    }

    for (const doc of snapshot.docs) {
      if (options.maxUsers && scanned >= options.maxUsers) {
        break;
      }

      scanned += 1;
      const result = await processUser(db, doc, options);
      if (result === "sent") {
        sent += 1;
      } else {
        skipped += 1;
      }
    }

    if (options.maxUsers && scanned >= options.maxUsers) {
      break;
    }

    lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
  }

  // Ensure stable defaults for all users touched via settings screen even when not sent.
  if (!options.dryRun && sent > 0) {
    console.log("Reminder sender completed", {
      mode: "send",
      sent,
      skipped,
      scanned,
      startedAt: now.toISOString(),
      defaultLeadTimeMinutes: DEFAULT_REMINDER_SETTINGS.leadTimeMinutes,
    });
    return;
  }

  console.log("Reminder sender completed", {
    mode: options.dryRun ? "dry-run" : "send",
    sent,
    skipped,
    scanned,
    startedAt: now.toISOString(),
    defaultLeadTimeMinutes: DEFAULT_REMINDER_SETTINGS.leadTimeMinutes,
  });
}

run().catch((error: unknown) => {
  console.error("Failed to run reminder sender", error);
  process.exit(1);
});
