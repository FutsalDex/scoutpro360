"use client"

import React from 'react';
import { TalentMapping } from '@/components/scout/talent-mapping';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe } from "lucide-react";
import Link from "next/link";

export default function MapaPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1d] p-6 lg:p-12 space-y-8 animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <Link href="/">
            <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-white/10 text-white">
              <ArrowLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-primary" />
              <h1 className="text-3xl font-headline font-black text-white uppercase tracking-tight">Geopolítica del Talento</h1>
            </div>
            <p className="text-muted-foreground text-sm font-medium mt-1 uppercase tracking-widest opacity-60">Visión Global de Captación • ScoutPro 360</p>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto">
        <TalentMapping />
      </main>

      <footer className="pt-12 border-t border-white/5 text-center">
         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] opacity-40">
           Sistema de Inteligencia Geoespacial v2.4 • Sincronización de Red de Clubes
         </p>
      </footer>
    </div>
  );
}
