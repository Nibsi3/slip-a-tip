import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const isValidDsn =
  typeof dsn === "string" &&
  dsn.length > 0 &&
  !dsn.includes("...") &&
  /^https?:\/\/[0-9a-f]+@.+\/\d+$/i.test(dsn);

if (isValidDsn) {
  Sentry.init({
    dsn,
    enabled: true,

    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV,

    beforeSend(event) {
      // Never send passwords or tokens to Sentry
      if (event.request?.data) {
        const data = event.request.data as Record<string, unknown>;
        delete data.password;
        delete data.token;
        delete data.totpCode;
      }
      return event;
    },
  });
}
