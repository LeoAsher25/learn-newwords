import { getEnvVar } from "@/utils";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export interface SendEmailPayload {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

let transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null =
  null;

function getFromEmail(): string {
  return `${getEnvVar("NEXT_PUBLIC_APP_NAME")} ${getEnvVar("REMINDER_FROM_EMAIL")}`;
}

function getSmtpConfig(): SMTPTransport.Options {
  const host = getEnvVar("SMTP_HOST");
  const port = Number(getEnvVar("SMTP_PORT"));
  if (Number.isNaN(port) || port <= 0) {
    throw new Error("SMTP_PORT must be a valid number.");
  }

  const secureEnv = getEnvVar("SMTP_SECURE");
  const secure =
    typeof secureEnv === "string"
      ? secureEnv.trim().toLowerCase() === "true"
      : port === 465;

  return {
    host,
    port,
    secure,
    auth: {
      user: getEnvVar("SMTP_USER"),
      pass: getEnvVar("SMTP_PASS"),
    },
  };
}

function initTransporter() {
  if (transporter) {
    return;
  }

  transporter = nodemailer.createTransport(getSmtpConfig());
}

export async function sendEmail(payload: SendEmailPayload): Promise<void> {
  initTransporter();

  await transporter!.sendMail({
    from: getFromEmail(),
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html,
  });
}
