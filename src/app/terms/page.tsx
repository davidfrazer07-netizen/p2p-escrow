export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-sm leading-relaxed text-text">
      <h1 className="wordmark text-xl mb-6">SafeSwap Terms of Service</h1>

      <div className="mb-6 rounded-xl border border-bear/60 bg-bear/10 p-4 text-bear text-xs">
        DRAFT FOR INTERNAL USE ONLY. This document has NOT been reviewed by a lawyer and must not be relied on as a
        compliance document until qualified legal counsel (India-specific, given RBI/FEMA/PMLA considerations for
        crypto/fiat exchange services) has reviewed and approved it.
      </div>

      <h2 className="section-title mt-6 mb-2">Nature of the marketplace</h2>
      <p className="mb-3 text-muted">
        SafeSwap is a peer-to-peer marketplace that connects independent buyers and sellers engaged in crypto-for-fiat
        trades. We are a reputation-and-manual-verification layer and are not a party to any trade conducted through
        the platform.
      </p>

      <h2 className="section-title mt-6 mb-2">User-set pricing</h2>
      <p className="mb-3 text-muted">
        Users set their own prices for all trades. SafeSwap does not quote, recommend, or guarantee any market rate.
        Any price agreed between counterparties is solely their own arrangement.
      </p>

      <h2 className="section-title mt-6 mb-2">Manual review and approval</h2>
      <p className="mb-3 text-muted">
        Every trade requires manual review and approval by SafeSwap&apos;s verification team before being marked
        complete. The platform will not mark a trade as complete without this human confirmation.
      </p>

      <h2 className="section-title mt-6 mb-2">No custody of funds</h2>
      <p className="mb-3 text-muted">
        SafeSwap does not hold, custody, or transmit funds on behalf of users. Fiat and crypto are exchanged directly
        between the two parties outside of any platform-controlled wallet or account. The platform never takes
        possession of user assets.
      </p>

      <h2 className="section-title mt-6 mb-2">KYC requirements</h2>
      <p className="mb-3 text-muted">
        Users must complete know-your-customer verification (name, phone, government ID) before they are permitted to
        trade on SafeSwap.
      </p>

      <h2 className="section-title mt-6 mb-2">Prohibited uses</h2>
      <p className="mb-3 text-muted">
        Users may not use SafeSwap for fraud, money laundering, dealings with sanctioned parties, or the exchange of
        illegal goods or services. Violations may result in suspension or termination.
      </p>

      <h2 className="section-title mt-6 mb-2">Suspension and termination</h2>
      <p className="mb-3 text-muted">
        SafeSwap reserves the right to suspend or terminate any account at its discretion, including where there is
        suspected prohibited use, false KYC, or repeated dispute indicators.
      </p>

      <h2 className="section-title mt-6 mb-2">Dispute process</h2>
      <p className="mb-3 text-muted">
        In a dispute, the verification team reviews the in-app chat log and evidence submitted by both parties. Its
        decision on whether to mark a trade complete is final within the platform. This does not waive either
        party&apos;s legal rights outside the platform.
      </p>

      <h2 className="section-title mt-6 mb-2">Limitation of liability</h2>
      <p className="mb-3 text-muted">
        SafeSwap is not a party to any trade and is not liable for losses arising from sending funds to the wrong
        address, scams, non-payment, or non-delivery by a counterparty. Users transact at their own risk.
      </p>

      <h2 className="section-title mt-6 mb-2">Governing law</h2>
      <p className="mb-3 text-muted">
        These terms are governed by the governing law of India, courts of [CITY] placeholder — fill in before launch.
      </p>
    </main>
  );
}
