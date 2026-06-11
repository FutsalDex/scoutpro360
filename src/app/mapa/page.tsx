"use client"

import React from 'react';
import { TalentMapping } from '@/components/scout/talent-mapping';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MapaPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center p-4">
      <div className="absolute top-8 left-8 z-50">
        <Link href="/">
          <Button variant="ghost" className="bg-white/5 hover:bg-white/10 text-white rounded-xl gap-2">
            <ArrowLeft className="h-4 w-4" /> VOLVER
          </Button>
        </Link>
      </div>

      <main className="w-full max-w-[1400px]">
        <TalentMapping />
      </main>
    </div>
  );
}
