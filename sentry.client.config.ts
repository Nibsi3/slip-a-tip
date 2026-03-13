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
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    environment: process.env.NODE_ENV,

    beforeSend(event) {
      // Strip PII from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((b) => {
          if (b.data?.url) {
            try {
              const url = new URL(b.data.url);
              url.searchParams.delete("token");
              url.searchParams.delete("password");
              b.data.url = url.toString();
            } catch {
              // ignore
            }
          }
          return b;
        });
      }
      return event;
    },
  });
}
