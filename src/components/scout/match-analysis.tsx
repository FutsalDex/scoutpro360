"use client"

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Clock } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';

export function MatchAnalysis() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-foreground uppercase tracking-tight">
            {t.matchAnalysis.title}
          </h1>
          <p className="text-muted-foreground">{t.matchAnalysis.subtitle}</p>
        </div>
        <Badge className="bg-primary/20 text-primary border-primary/30 font-black uppercase tracking-widest px-4 py-1.5">
          LAB STATUS: INACTIVE
        </Badge>
      </div>

      <Card className="border-dashed border-2 border-border/40 bg-card/20 rounded-[2.5rem] overflow-hidden min-h-[400px] flex items-center justify-center">
        <CardContent className="p-12 text-center space-y-6">
          <div className="relative inline-block">
            <div className="h-24 w-24 rounded-3xl bg-secondary/50 flex items-center justify-center mx-auto border border-border/20">
              <Video className="h-10 w-10 text-muted-foreground opacity-40" />
            </div>
            <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-background border-4 border-card flex items-center justify-center">
              <Clock className="h-4 w-4 text-primary animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black uppercase tracking-widest text-foreground">
              {t.matchAnalysis.comingSoon}
            </h3>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-[0.2em] max-w-md mx-auto italic">
              {t.matchAnalysis.comingSoonDesc}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
