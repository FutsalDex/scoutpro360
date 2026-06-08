"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Target, Brain, Crosshair, Zap, Shield, ArrowRight } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { cn } from "@/lib/utils";

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
          LIVE TACTICAL RADAR
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Escenario de Banda */}
        <Card className="lg:col-span-2 border-border/40 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
          <CardHeader className="bg-[#1b263b] p-6 border-b border-border/10">
            <div className="flex items-center gap-3">
              <Crosshair className="h-5 w-5 text-primary" />
              <CardTitle className="text-xs font-black uppercase tracking-widest text-white">
                {t.matchAnalysis.scenarioTitle}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 relative bg-[#001524]">
            {/* Visualización Táctica SVG */}
            <div className="aspect-[16/9] w-full relative overflow-hidden">
               <svg viewBox="0 0 800 450" className="w-full h-full opacity-40">
                  <rect width="800" height="450" fill="#001524" />
                  <line x1="0" y1="225" x2="800" y2="225" stroke="white" strokeWidth="0.5" strokeDasharray="5,5" />
                  <circle cx="400" cy="225" r="80" fill="none" stroke="white" strokeWidth="0.5" />
                  {/* Zona de Banda */}
                  <rect x="0" y="0" width="800" height="80" fill="white" fillOpacity="0.05" />
               </svg>

               {/* Nodos Tácticos Animados */}
               <div className="absolute inset-0 p-12">
                  {/* Atacante en Banda */}
                  <div className="absolute top-[15%] left-[60%] flex flex-col items-center gap-2 group">
                     <div className="h-8 w-8 rounded-full bg-primary border-2 border-white shadow-[0_0_20px_hsl(var(--primary))] flex items-center justify-center animate-pulse">
                        <Zap className="h-4 w-4 text-primary-foreground" />
                     </div>
                     <span className="text-[9px] font-black text-white uppercase tracking-widest">ATACANTE (COMODÍN)</span>
                  </div>

                  {/* Defensor en Reacción */}
                  <div className="absolute top-[35%] left-[55%] flex flex-col items-center gap-2">
                     <div className="h-8 w-8 rounded-full bg-destructive border-2 border-white shadow-[0_0_20px_hsl(var(--destructive))] flex items-center justify-center">
                        <Shield className="h-4 w-4 text-white" />
                     </div>
                     <span className="text-[9px] font-black text-white uppercase tracking-widest">DEFENSOR (INTERCEPTOR)</span>
                  </div>

                  {/* Vector de Pase */}
                  <div className="absolute top-[20%] left-[58%] h-[2px] w-[100px] bg-accent border-accent/50 border-t-2 border-dashed rotate-[45deg] animate-in slide-in-from-left duration-1000 infinite" />
               </div>
            </div>
            <div className="p-8 border-t border-border/10 bg-secondary/10">
              <p className="text-sm italic font-medium text-muted-foreground leading-relaxed">
                "{t.matchAnalysis.scenarioDesc}"
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de Lectura de Juego */}
        <div className="space-y-6">
          <MetricCard 
            title={t.matchAnalysis.metrics.gameReading} 
            value="92" 
            suffix="%" 
            icon={<Brain className="text-primary" />} 
            desc="Alta precisión en detección de pases filtrados."
          />
          <MetricCard 
            title={t.matchAnalysis.metrics.interceptionProb} 
            value="74" 
            suffix="%" 
            icon={<Target className="text-accent" />} 
            desc="Cálculo basado en posición y velocidad del balón."
          />
          <MetricCard 
            title={t.matchAnalysis.metrics.reactionTime} 
            value="0.28" 
            suffix="s" 
            icon={<Activity className="text-primary" />} 
            desc="Superior a la media regional de 0.42s."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DecisionCard 
          title={t.matchAnalysis.decisionMatrix.intercept} 
          prob="74%" 
          risk="Alto" 
          active
        />
        <DecisionCard 
          title={t.matchAnalysis.decisionMatrix.contain} 
          prob="22%" 
          risk="Medio" 
        />
        <DecisionCard 
          title={t.matchAnalysis.decisionMatrix.delay} 
          prob="4%" 
          risk="Bajo" 
        />
      </div>
    </div>
  );
}

function MetricCard({ title, value, suffix, icon, desc }: { title: string, value: string, suffix: string, icon: any, desc: string }) {
  return (
    <Card className="border-border/40 bg-card/40 rounded-3xl p-6 shadow-xl hover:scale-[1.02] transition-all group">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{title}</p>
        <div className="h-8 w-8 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/10 group-hover:bg-primary/10 transition-colors">
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1 mb-2">
        <p className="text-4xl font-black font-headline">{value}</p>
        <span className="text-sm font-black text-primary/60">{suffix}</span>
      </div>
      <p className="text-[10px] text-muted-foreground font-medium italic">{desc}</p>
    </Card>
  );
}

function DecisionCard({ title, prob, risk, active }: { title: string, prob: string, risk: string, active?: boolean }) {
  return (
    <Card className={cn(
      "border-border/40 bg-card/40 rounded-3xl p-6 transition-all cursor-default",
      active ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : ""
    )}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">{title}</h3>
        <Badge variant={active ? "default" : "outline"} className="text-[8px] font-black uppercase tracking-tighter">
          {active ? 'RECOMENDADO' : 'ALTERNATIVO'}
        </Badge>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-3xl font-black">{prob}</span>
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest",
            risk === 'Alto' ? "text-destructive" : risk === 'Medio' ? "text-primary" : "text-accent"
          )}>RIESGO: {risk}</span>
        </div>
        <div className="h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden">
          <div className="h-full bg-primary" style={{ width: prob }} />
        </div>
      </div>
    </Card>
  );
}
