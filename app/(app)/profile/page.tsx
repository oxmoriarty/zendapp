"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Share2, Settings, Camera } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSessionStore } from "@/store/session-store";

export default function ProfilePage() {
  const user = useSessionStore((s) => s.user);
  if (!user) return null;

  const joined = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const shareUrl = `https://zendapp.app/${user.username}`;

  return (
    <div className="mx-auto max-w-md">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold">Profile</h1>
        <Link href="/settings" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted">
          <Settings className="h-5 w-5" />
        </Link>
      </header>

      <div className="flex flex-col items-center">
        <button className="group relative">
          <Avatar name={user.displayName} src={user.avatarUrl} size={96} />
          <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-primary text-primary-foreground shadow-soft transition-transform group-hover:scale-105">
            <Camera className="h-4 w-4" />
          </span>
        </button>
        <h2 className="mt-4 font-display text-xl font-semibold">{user.displayName}</h2>
        <p className="text-muted-foreground">@{user.username}</p>
      </div>

      <Card className="mt-8 p-6">
        <div className="mx-auto mb-5 flex w-fit items-center justify-center rounded-2xl border border-border bg-white p-4">
          <QRCodeSVG value={shareUrl} size={140} fgColor="#150140" bgColor="#ffffff" level="M" />
        </div>
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => navigator.share?.({ title: "My Zendapp profile", url: shareUrl }).catch(() => {})}
        >
          <Share2 className="h-4 w-4" /> Share profile
        </Button>
      </Card>

      <div className="mt-6 divide-y divide-border rounded-3xl border border-border bg-card px-5">
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Joined" value={joined} />
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
