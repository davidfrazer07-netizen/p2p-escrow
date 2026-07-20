export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-sm leading-relaxed text-text">
      <h1 className="wordmark text-xl mb-6">SafeSwap Privacy Policy</h1>

      <div className="mb-6 rounded-xl border border-bear/60 bg-bear/10 p-4 text-bear text-xs">
        DRAFT FOR INTERNAL USE ONLY. This document has NOT been reviewed by a lawyer and must not be relied on as a
        compliance document until qualified legal counsel (India-specific, given RBI/FEMA/PMLA considerations for
        crypto/fiat exchange services) has reviewed and approved it.
      </div>

      <h2 className="section-title mt-6 mb-2">What we collect</h2>
      <p className="mb-3 text-muted">
        We collect your name, email (via Google sign-in), phone number, government ID image, transaction history, and
        in-app chat messages.
      </p>

      <h2 className="section-title mt-6 mb-2">Why we collect it</h2>
      <p className="mb-3 text-muted">
        Data is used for KYC and fraud prevention, dispute resolution, and regulatory recordkeeping required for
        crypto/fiat exchange services in India.
      </p>

      <h2 className="section-title mt-6 mb-2">ID document storage</h2>
      <p className="mb-3 text-muted">
        Government ID documents are stored in a private, access-restricted store and are viewable only by the
        verification team.
      </p>

      <h2 className="section-title mt-6 mb-2">Chat visibility</h2>
      <p className="mb-3 text-muted">
        Chat messages tied to a trade are visible to both trade participants and to the verification team. They are
        never visible to other users.
      </p>

      <h2 className="section-title mt-6 mb-2">No sale of data</h2>
      <p className="mb-3 text-muted">SafeSwap does not sell user data to any third party.</p>

      <h2 className="section-title mt-6 mb-2">Disclosure to authorities and counterparties</h2>
      <p className="mb-3 text-muted">
        Data may be disclosed to law enforcement or regulators where legally required, and to the counterparty in a
        trade specifically for recovery purposes if a dispute or suspected fraud makes that necessary. If a
        transaction goes wrong, we may share the other party&apos;s verified identity details with you, and yours
        with them, to assist recovery — this is why ID verification is mandatory.
      </p>

      <h2 className="section-title mt-6 mb-2">Data retention</h2>
      <p className="mb-3 text-muted">
        KYC and transaction records are retained per applicable Indian recordkeeping requirements, for at least [X
        years] — confirm with counsel.
      </p>

      <h2 className="section-title mt-6 mb-2">Your rights</h2>
      <p className="mb-3 text-muted">
        You may request your own data and request account closure, subject to records the platform must legally
        retain.
      </p>

      <h2 className="section-title mt-6 mb-2">Disclaimer</h2>
      <p className="mb-3 text-muted">
        SafeSwap is not responsible for lost funds. Identity-sharing for recovery purposes is best-effort assistance,
        not a guarantee of fund recovery.
      </p>
    </main>
  );
}
