"use client";

import { createContext, useContext, useEffect, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, authConfigured } from "@/lib/supabaseClient";
import { GlassCard, SectionTitle, GhostButton } from "@/components/ui";
import type { Profile } from "@/lib/types";

const ProfileContext = createContext<Profile | null>(null);

// Only ever populated once AuthGate has fully cleared a user (KYC complete,
// kyc_status verified) -- callers below it in the tree can assume non-null.
export function useProfile(): Profile {
  const profile = useContext(ProfileContext);
  if (!profile) throw new Error("useProfile() called outside a verified AuthGate subtree");
  return profile;
}

function KycOnboarding({ profile, userId }: { profile: Profile; userId: string }) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const phoneValid = phone.startsWith("+") && phone.replace(/\D/g, "").length >= 8;
  const canSubmit = fullName.trim().length > 0 && phoneValid && file !== null && !submitting;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !file || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const path = `${userId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("id-proofs").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { error: rowErr } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim(), id_proof_url: path })
        .eq("id", userId);
      if (rowErr) throw rowErr;
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <GlassCard className="max-w-sm text-center">
          <SectionTitle>KYC submitted</SectionTitle>
          <p className="mt-2 text-sm text-muted">Submitted — pending verification by our team.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <GlassCard className="w-full max-w-sm">
        <SectionTitle>Complete KYC to continue</SectionTitle>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted">
            Full name
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-xl border border-line bg-surface2/40 px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            Phone number
            <input
              type="text"
              placeholder="+91XXXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl border border-line bg-surface2/40 px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            ID proof (image or PDF)
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="rounded-xl border border-line bg-surface2/40 px-3 py-2 text-sm text-text file:mr-3 file:rounded-lg file:border-0 file:bg-surface2 file:px-2 file:py-1 file:text-text"
            />
          </label>
          {error && <p className="text-xs text-bear">{error}</p>}
          <GhostButton type="submit" accent disabled={!canSubmit}>
            {submitting ? "Submitting…" : "Submit KYC"}
          </GhostButton>
        </form>
      </GlassCard>
    </div>
  );
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileRetryKey, setProfileRetryKey] = useState(0);

  useEffect(() => {
    if (!authConfigured || !supabase) {
      setLoading(false);
      return;
    }
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user?.id) {
      setProfile(null);
      return;
    }
    let active = true;
    setProfileLoading(true);
    setProfileError(null);
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data) {
          setProfileError(
            error?.message ??
              "No profile record found for this account yet. This usually means the account-creation step didn't finish — try Retry, or contact support if it keeps happening.",
          );
        } else {
          setProfile(data as Profile);
        }
        setProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, [session, profileRetryKey]);

  if (!authConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <GlassCard className="max-w-sm">
          <SectionTitle>Sign-in not configured yet</SectionTitle>
          <p className="mt-2 text-sm text-muted">
            Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, and enable the
            Google OAuth provider in the Supabase project, before this app can be used. This app moves real money —
            there is no guest bypass.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Loading...</div>;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
        <div className="wordmark text-2xl">SAFESWAP</div>
        <GlassCard className="w-full max-w-sm">
          <SectionTitle>Sign in to continue</SectionTitle>
          <p className="mt-2 text-xs text-muted">Google sign-in only — required for KYC and dispute recovery.</p>
          <div className="mt-4">
            <GhostButton
              accent
              className="w-full"
              onClick={() =>
                supabase?.auth.signInWithOAuth({
                  provider: "google",
                  options: { redirectTo: window.location.href },
                })
              }
            >
              Continue with Google
            </GhostButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (profileLoading) {
    return <div className="flex min-h-screen items-center justify-center text-muted">Loading...</div>;
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <GlassCard className="max-w-sm text-center">
          <SectionTitle>Couldn&apos;t load your account</SectionTitle>
          <p className="mt-2 text-sm text-bear">{profileError}</p>
          <div className="mt-4">
            <GhostButton accent onClick={() => setProfileRetryKey((k) => k + 1)}>
              Retry
            </GhostButton>
          </div>
        </GlassCard>
      </div>
    );
  }

  const kycFieldsComplete = Boolean(profile.full_name && profile.phone && profile.id_proof_url);

  if (!kycFieldsComplete) {
    return <KycOnboarding profile={profile} userId={session.user.id} />;
  }

  if (profile.kyc_status === "rejected") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <GlassCard className="max-w-sm text-center">
          <SectionTitle>Verification rejected</SectionTitle>
          <p className="mt-2 text-sm text-muted">
            Our team couldn&apos;t verify your ID proof. Contact support to resubmit.
          </p>
        </GlassCard>
      </div>
    );
  }

  if (profile.kyc_status === "pending") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <GlassCard className="max-w-sm text-center">
          <SectionTitle>Verification pending</SectionTitle>
          <p className="mt-2 text-sm text-muted">Submitted — pending verification by our team.</p>
        </GlassCard>
      </div>
    );
  }

  return <ProfileContext.Provider value={profile}>{children}</ProfileContext.Provider>;
}
