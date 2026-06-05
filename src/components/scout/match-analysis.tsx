"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Activity, Target, Shield, Zap } from "lucide-react";
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
          Modo: Análisis Táctico
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalysisMetricCard title="Efectividad en Presión" value="68%" icon={<Target className="text-primary" />} desc="Zona media y alta" />
        <AnalysisMetricCard title="Goles Esperados (xG)" value="1.84" icon={<Activity className="text-accent" />} desc="Promedio por partido" />
        <AnalysisMetricCard title="Solidez Defensiva" value="B+" icon={<Shield className="text-primary" />} desc="Bloque bajo" />
        <AnalysisMetricCard title="Velocidad Transición" value="4.2s" icon={<Zap className="text-accent" />} desc="Defensa-Ataque" />
      </div>

      <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl">
        <CardHeader className="bg-secondary/20 p-8 border-b border-border/10">
          <CardTitle className="text-lg font-black uppercase tracking-[0.15em] font-headline flex items-center gap-3">
            <Video className="h-5 w-5 text-primary" /> Sesiones de Video Táctico
          </CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Desglose visual de comportamientos grupales
          </CardDescription>
        </CardHeader>
        <CardContent className="p-12 text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto border-2 border-dashed border-border/40">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground italic font-medium">Módulo de video análisis en fase de sincronización...</p>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalysisMetricCard({ title, value, icon, desc }: { title: string, value: string, icon: any, desc: string }) {
  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm p-6 hover:border-primary/40 transition-all rounded-2xl">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
        <div className="h-8 w-8 rounded-lg bg-secondary/50 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-black font-headline text-foreground">{value}</p>
        <p className="text-[10px] font-bold text-primary uppercase tracking-widest">{desc}</p>
      </div>
    </Card>
  );
}
