"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Profile, Message } from "@/lib/types";
import { GlassCard } from "@/components/ui";

function shortId(id: string) {
  return id.slice(0, 8);
}

export default function Chat({ orderId, profile }: { orderId: string; profile: Profile }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let active = true;

    client
      .from("messages")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (!error && data) setMessages(data as Message[]);
      });

    const channel = client
      .channel(`messages:${orderId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${orderId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();

    return () => {
      active = false;
      client.removeChannel(channel);
    };
  }, [orderId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  async function send() {
    const body = input.trim();
    if (!body || submitting || !supabase) return;
    setSubmitting(true);
    const { error } = await supabase.from("messages").insert({ order_id: orderId, sender_id: profile.id, body });
    setSubmitting(false);
    if (!error) setInput("");
  }

  return (
    <GlassCard className="flex h-96 flex-col p-0">
      <div ref={listRef} className="flex-1 space-y-2 overflow-y-auto p-3">
        {messages.map((m) => {
          const own = m.sender_id === profile.id;
          return (
            <div key={m.id} className={own ? "text-right" : "text-left"}>
              <div
                className={`inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  own ? "bg-accent/20 text-accent-hi" : "bg-surface2 text-text"
                }`}
              >
                <div className="mb-1 text-xs text-muted">{own ? "You" : shortId(m.sender_id)}</div>
                {m.body}
              </div>
            </div>
          );
        })}
        {messages.length === 0 && <p className="p-2 text-sm text-muted">No messages yet.</p>}
      </div>
      <div className="border-t border-line p-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-line bg-bg2 px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
          />
          <button
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-40"
            onClick={send}
            disabled={!input.trim() || submitting}
          >
            Send
          </button>
        </div>
        <div className="mt-2 text-xs text-muted">Visible to our verification team.</div>
      </div>
    </GlassCard>
  );
}
