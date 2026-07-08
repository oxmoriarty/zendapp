"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Copy, Check, Share2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSessionStore } from "@/store/session-store";
import { cn } from "@/lib/utils";

export default function ReceivePage() {
  const user = useSessionStore((s) => s.user);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  const shareUrl = user ? `https://zendapp.app/${user.username}` : "";

  async function copy(text: string, setFlag: (v: boolean) => void) {
    await navigator.clipboard.writeText(text);
    setFlag(true);
    setTimeout(() => setFlag(false), 2000);
  }

  async function share() {
    if (navigator.share) {
      await navigator.share({ title: "Pay me on Zendapp", url: shareUrl });
    } else {
      copy(shareUrl, setCopiedUsername);
    }
  }

  if (!user) return null;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center">
      <h1 className="mb-6 font-display text-xl font-semibold">Receive USDC</h1>

      <Card className="w-full p-8 text-center">
        <p className="mb-1 text-sm text-muted-foreground">Your Zendapp username</p>
        <p className="mb-6 font-display text-2xl font-semibold text-primary">@{user.username}</p>

        <div className="mx-auto mb-6 flex w-fit items-center justify-center rounded-3xl border border-border bg-white p-5">
          <QRCodeSVG value={shareUrl} size={180} fgColor="#150140" bgColor="#ffffff" level="M" />
        </div>

        <p className="text-xs text-muted-foreground">Anyone can scan this to send you USDC instantly</p>
      </Card>

      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        <Button variant="secondary" size="lg" onClick={() => copy(user.username, setCopiedUsername)}>
          {copiedUsername ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiedUsername ? "Copied" : "Copy username"}
        </Button>
        <Button variant="glow" size="lg" onClick={share}>
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </div>

      <button
        onClick={() => setShowAddress((s) => !s)}
        className="mt-8 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        Advanced: wallet address
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showAddress && "rotate-180")} />
      </button>

      {showAddress && (
        <div className="mt-3 flex w-full items-center gap-2 rounded-2xl border border-border bg-surface-sunken p-3">
          <code className="flex-1 truncate text-xs text-muted-foreground">{user.walletAddress}</code>
          <button
            onClick={() => copy(user.walletAddress, setCopiedAddress)}
            className="shrink-0 rounded-lg p-1.5 hover:bg-muted"
          >
            {copiedAddress ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      )}
    </div>
  );
}
