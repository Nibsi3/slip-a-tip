import { redirect } from "next/navigation";

/**
 * Short redirect route: /tip/s/[paymentId]
 * Stitch uses this as the redirect_url after payment — keeps the URL clean.
 * We immediately forward to the success page with the reference.
 */
export default async function ShortSuccessRedirect({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  redirect(`/tip/success?reference=${encodeURIComponent(paymentId)}`);
}
