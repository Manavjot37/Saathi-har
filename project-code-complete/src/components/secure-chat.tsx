import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Phone, Send, Lock, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { E2eeStatusBadge } from "@/components/e2ee-status-badge";
import { DistressIndicator } from "@/components/distress-indicator";
import {
  appendChat,
  loadChat,
  markChatRead,
  type ChatMessage,
} from "@/lib/saathi-store";
import { initE2EE, type E2EEContext } from "@/lib/crypto-e2ee";

export function SecureChat({
  role,
  title,
  subtitle,
  placeholder,
  sendLabel,
  requestCallLabel,
  onClose,
}: {
  role: "victim" | "counsellor";
  title: string;
  subtitle: string;
  placeholder: string;
  sendLabel: string;
  requestCallLabel: string;
  onClose?: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [e2eeCtx, setE2eeCtx] = useState<E2EEContext | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(markChatRead(role));
    initE2EE(role).then((ctx) => {
      setE2eeCtx(ctx);
    }).catch((err) => {
      console.warn("E2EE init fallback", err);
    });
  }, [role]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string, kind: ChatMessage["kind"] = "text") => {
    if (!text.trim()) return;

    let payloadText = text.trim();
    let isEncrypted = false;

    if (e2eeCtx) {
      try {
        const encryptedPayload = await e2eeCtx.encrypt(payloadText);
        payloadText = JSON.stringify(encryptedPayload);
        isEncrypted = true;
      } catch (err) {
        console.warn("E2EE encryption error, sending plain", err);
      }
    }

    const updated = appendChat({
      from: role,
      text: payloadText,
      kind,
      encrypted: isEncrypted,
    });

    setMessages(updated);
    setDraft("");
  };

  const renderMessageContent = (m: ChatMessage) => {
    if (m.encrypted && e2eeCtx) {
      try {
        const parsed = JSON.parse(m.text);
        if (parsed.iv && parsed.ct) {
          // Decrypt asynchronously or show fallback string
          return <DecryptedText payload={parsed} decryptFn={e2eeCtx.decrypt} fallback={m.text} />;
        }
      } catch {
        // Fallback to raw text if JSON parse fails
      }
    }
    return <p>{m.text}</p>;
  };

  return (
    <div className="flex h-full min-h-[360px] flex-col">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-base font-bold text-foreground">{title}</p>
            <E2eeStatusBadge active={true} />
          </div>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {onClose && (
          <Button size="sm" variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3">
        {messages.map((m) => {
          const mine = m.from === role;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                  mine
                    ? "bg-brand text-brand-foreground"
                    : "border border-border bg-card text-foreground"
                } ${m.kind === "call_request" ? "ring-2 ring-priority/40" : ""}`}
              >
                {renderMessageContent(m)}
                <div
                  className={`mt-1 flex items-center justify-between gap-2 text-[10px] ${
                    mine ? "text-brand-foreground/70" : "text-muted-foreground"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    {m.at}
                    {m.encrypted && (
                      <span title="E2E Encrypted">
                        <Lock className="h-2.5 w-2.5 opacity-80" />
                      </span>
                    )}
                    {mine && m.read && <CheckCircle2 className="h-3 w-3" />}
                  </span>
                  {m.distress && (
                    <DistressIndicator
                      level={m.distress.level}
                      score={m.distress.score}
                      compact={true}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            send(
              role === "victim"
                ? "I'd like a call when you're free, please."
                : "Can we schedule a short call today?",
              "call_request",
            )
          }
        >
          <Phone className="mr-1 h-3.5 w-3.5" /> {requestCallLabel}
        </Button>
      </div>

      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send(draft);
        }}
      >
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="submit" disabled={!draft.trim()}>
          <Send className="mr-1 h-4 w-4" /> {sendLabel}
        </Button>
      </form>
    </div>
  );
}

function DecryptedText({
  payload,
  decryptFn,
  fallback,
}: {
  payload: { iv: string; ct: string };
  decryptFn: (p: { iv: string; ct: string }) => Promise<string>;
  fallback: string;
}) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    decryptFn(payload)
      .then((decrypted) => {
        if (isMounted) setText(decrypted);
      })
      .catch(() => {
        if (isMounted) setText(fallback);
      });
    return () => {
      isMounted = false;
    };
  }, [payload, decryptFn, fallback]);

  if (text === null) {
    return <p className="animate-pulse opacity-70">Decrypting message...</p>;
  }

  return <p>{text}</p>;
}
