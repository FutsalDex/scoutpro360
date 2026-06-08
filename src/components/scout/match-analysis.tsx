"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Lock } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';

export function MatchAnalysis() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-foreground uppercase tracking-tight">
            {t.sidebar.matchAnalysis}
          </h1>
          <p className="text-muted-foreground">Análisis táctico profundo del modelo de juego y rendimiento colectivo.</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 font-black uppercase tracking-widest px-4 py-1.5">
          Estado: Desarrollo
        </Badge>
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl border-dashed border-2">
        <CardContent className="p-24 text-center space-y-6 flex flex-col items-center justify-center">
          <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-2xl animate-pulse">
            <Video className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-headline font-black text-foreground uppercase tracking-tighter">Próximamente</h2>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-full border border-border/40">
            <Lock className="h-3 w-3 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Acceso Restringido • Fase Beta</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
