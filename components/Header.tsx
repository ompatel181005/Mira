"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import LanguageToggle from "./LanguageToggle";
import PrivacyBadge from "./PrivacyBadge";
import TalkToReal from "./TalkToReal";

export default function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="MIRA — Healthcare Navigator home"
          className="flex items-center gap-2 rounded-xl outline-none transition hover:opacity-80 focus-visible:ring-2 focus-visible:ring-medical-600"
        >
          <div className="relative h-10 w-10 overflow-hidden rounded-xl">
            <Image
              src="/logo.png"
              alt="MIRA Logo"
              fill
              className="object-cover"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            MIRA <span className="font-medium text-slate-500 text-sm hidden sm:inline">Healthcare Navigator</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <PrivacyBadge />
          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />
          <TalkToReal />
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}