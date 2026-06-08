
"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Users, TrendingUp, Globe, Briefcase, Loader2 } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers } from "@/lib/services/db-service";
import { Player } from "@/lib/types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

export function TalentMapping() {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoutId, setScoutId] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setScoutId(user?.uid || null);
      if (!user) setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!scoutId) return;
    const unsub = subscribeToPlayers(scoutId, (data) => {
      setPlayers(data);
      setLoading(false);
    });
    return () => unsub();
  }, [scoutId]);

  // Agrupar jugadores por país
  const statsByCountry = players.reduce((acc, player) => {
    const country = player.nationality || 'Unknown';
    if (!acc[country]) {
      acc[country] = { count: 0, avgPim: 0, totalPim: 0 };
    }
    acc[country].count += 1;
    acc[country].totalPim += player.currentPIM || 0;
    acc[country].avgPim = Math.round(acc[country].totalPim / acc[country].count);
    return acc;
  }, {} as Record<string, { count: number, avgPim: number, totalPim: number }>);

  const countries = Object.entries(statsByCountry)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

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
        {/* Mapa Mundial Estilizado con Nodos Reales */}
        <div className="lg:col-span-8">
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl h-full overflow-hidden relative min-h-[450px]">
            <CardHeader className="border-b border-border/10 pb-6 relative z-10 bg-background/20 backdrop-blur-md">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" /> {t.mapping.hotspotsTitle}
              </CardTitle>
              <CardDescription>{t.mapping.hotspotsDesc}</CardDescription>
            </CardHeader>
            <CardContent className="p-0 h-full relative">
              {/* Representación Visual Técnica del Mapa */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_100%)] opacity-[0.03] pointer-events-none" />
              
              {/* Tactical Grid Background */}
              <div className="absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] opacity-[0.05]">
                {[...Array(400)].map((_, i) => (
                  <div key={i} className="border-[0.5px] border-white/20" />
                ))}
              </div>

              <div className="relative h-full w-full flex items-center justify-center p-12">
                 <div className="w-full max-w-2xl aspect-video relative opacity-60">
                    {/* SVG Map Silhouette Placeholder */}
                    <svg viewBox="0 0 1000 500" className="w-full h-full fill-white/10">
                       <path d="M150,100 L300,100 L350,150 L300,200 L200,220 L150,150 Z M450,50 L600,50 L650,100 L600,150 L500,180 L450,100 Z M700,150 L850,150 L900,200 L850,300 L750,320 L700,250 Z M200,300 L350,300 L400,350 L350,450 L250,470 L200,400 Z" />
                    </svg>

                    {/* Active Nodes (Representando países con jugadores) */}
                    {countries.map(([name, stat], i) => (
                      <div 
                        key={name}
                        className="absolute animate-pulse"
                        style={{
                          top: `${20 + (i * 12)}%`,
                          left: `${15 + (i * 15)}%`
                        }}
                      >
                        <div className="relative">
                          <div className="h-4 w-4 bg-primary rounded-full blur-[4px] absolute inset-0 animate-ping" />
                          <div className="h-3 w-3 bg-primary rounded-full border-2 border-white/40 shadow-[0_0_15px_hsl(var(--primary))]" />
                          <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 px-2 py-1 rounded border border-primary/30">
                            <p className="text-[8px] font-black uppercase text-primary tracking-tighter">{name}</p>
                            <p className="text-[10px] font-bold text-white leading-none">{stat.count} PL</p>
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

              <div className="absolute bottom-6 left-6 flex items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-xl">
                 <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                 <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    {t.mapping.activeNodes}
                 </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Priority Regions List */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl">
            <CardHeader className="border-b border-border/10">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground flex items-center gap-3">
                <Globe className="h-5 w-5 text-primary" /> {t.mapping.priorityRegions}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {countries.length > 0 ? countries.map(([name, stat]) => (
                  <RegionItem 
                    key={name}
                    name={name} 
                    count={stat.count} 
                    growth="+10%" 
                    pim={stat.avgPim} 
                    t={t} 
                  />
                )) : (
                  <p className="text-xs text-muted-foreground italic text-center py-10 opacity-50">
                    No data available in your private DB.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" /> {t.mapping.logistics}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/20">
                <span className="text-[10px] font-black uppercase text-muted-foreground">{t.mapping.activeScouts}</span>
                <span className="text-xl font-black text-foreground">1</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-background/50 rounded-xl border border-border/20">
                <span className="text-[10px] font-black uppercase text-muted-foreground">{t.mapping.reportsGenerated}</span>
                <span className="text-xl font-black text-foreground">{players.length}</span>
              </div>
              <div className="pt-4">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-4">Eficiencia Operativa</p>
                <Progress value={Math.min(players.length * 10, 100)} className="h-2 bg-primary/10" />
                <p className="text-[9px] text-muted-foreground mt-2 italic">Based on your private scouting activity</p>
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
    <div className="space-y-3 group cursor-default">
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <p className="text-sm font-black text-foreground group-hover:text-primary transition-colors uppercase tracking-tight">{name}</p>
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
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(224,176,80,0.5)]" 
          style={{ width: `${pim}%` }} 
        />
      </div>
    </div>
  );
}
