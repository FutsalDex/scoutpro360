
"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Users, TrendingUp, Globe, Briefcase } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';

export function TalentMapping() {
  const { t } = useTranslation();

  return (
    <div className="space-y-8 animate-in slide-in-from-right duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-foreground">{t.mapping.title}</h1>
          <p className="text-muted-foreground">{t.mapping.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black py-1.5 px-4 tracking-widest uppercase">
            {t.mapping.globalFeed}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Priority Regions - Now more prominent */}
        <div className="lg:col-span-8">
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl h-full">
            <CardHeader className="border-b border-border/10 pb-6">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" /> {t.mapping.priorityRegions}
              </CardTitle>
              <CardDescription>Análisis de rendimiento por zona geográfica y liga</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                <RegionItem name="Brazil (Serie A/B)" count={124} growth="+12%" pim={74} t={t} />
                <RegionItem name="France (Ligue 1/2)" count={86} growth="+5%" pim={78} t={t} />
                <RegionItem name="Argentina (LFP)" count={62} growth="+18%" pim={72} t={t} />
                <RegionItem name="Germany (3. Liga)" count={45} growth="+2%" pim={69} t={t} />
                <RegionItem name="Portugal (Liga Nos)" count={38} growth="+9%" pim={76} t={t} />
                <RegionItem name="Netherlands (Eredivisie)" count={31} growth="+14%" pim={75} t={t} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Logistics and Stats */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-primary/20 bg-primary/5 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-headline flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" /> {t.mapping.logistics}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/20">
                <span className="text-sm font-medium text-muted-foreground">{t.mapping.activeScouts}</span>
                <span className="text-xl font-black text-foreground">24</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/20">
                <span className="text-sm font-medium text-muted-foreground">{t.mapping.flightHours}</span>
                <span className="text-xl font-black text-foreground">1,240 hrs</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/20">
                <span className="text-sm font-medium text-muted-foreground">{t.mapping.reportsGenerated}</span>
                <span className="text-xl font-black text-foreground">3,450</span>
              </div>
              <div className="pt-4">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-4">Eficiencia Operativa</p>
                <Progress value={88} className="h-2 bg-primary/10" />
                <p className="text-[10px] text-muted-foreground mt-2 italic">Basado en cobertura de objetivos Q1</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-muted-foreground tracking-tighter">Tendencia Global</p>
                  <p className="text-lg font-black text-foreground">+8.4% PIM AVG</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function RegionItem({ name, count, growth, pim, t }: { name: string, count: number, growth: string, pim: number, t: any }) {
  return (
    <div className="space-y-3 group">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{name}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">{count} {t.mapping.identified}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="text-[10px] text-accent font-black">{growth}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">{t.mapping.avgPim}</p>
          <p className="text-xl font-black font-headline text-primary leading-none">{pim}</p>
        </div>
      </div>
      <div className="relative h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden">
        <div 
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000" 
          style={{ width: `${pim}%` }} 
        />
      </div>
    </div>
  );
}
