
"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MapPin, Users, TrendingUp, Globe, Briefcase, Loader2, Crosshair } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers } from "@/lib/services/db-service";
import { Player } from "@/lib/types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

// Coordenadas aproximadas para centrar los nodos en el SVG 1000x500
const COUNTRY_COORDS: Record<string, { x: number, y: number }> = {
  "España": { x: 480, y: 155 },
  "Argentina": { x: 310, y: 410 },
  "Brasil": { x: 340, y: 340 },
  "Portugal": { x: 470, y: 160 },
  "Francia": { x: 490, y: 140 },
  "Italia": { x: 515, y: 155 },
  "Alemania": { x: 505, y: 125 },
  "Reino Unido": { x: 485, y: 110 },
  "México": { x: 200, y: 230 },
  "Colombia": { x: 280, y: 300 },
  "Uruguay": { x: 330, y: 410 },
  "Chile": { x: 290, y: 410 },
  "Ecuador": { x: 265, y: 320 },
  "Perú": { x: 275, y: 350 },
  "Bélgica": { x: 495, y: 120 },
  "Países Bajos": { x: 495, y: 115 },
  "Egipto": { x: 560, y: 210 },
  "Marruecos": { x: 480, y: 200 },
  "Nigeria": { x: 510, y: 280 },
  "Japón": { x: 880, y: 180 },
  "Australia": { x: 850, y: 410 },
  "Estados Unidos": { x: 200, y: 160 },
};

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
    .slice(0, 10);

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
          <h1 className="text-3xl font-headline font-black text-foreground uppercase tracking-tight">{t.mapping.title}</h1>
          <p className="text-muted-foreground text-sm">{t.mapping.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-black py-1.5 px-4 tracking-widest uppercase flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {t.mapping.globalFeed}
          </Badge>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl h-full overflow-hidden relative min-h-[550px]">
            <CardHeader className="border-b border-border/10 pb-6 relative z-10 bg-background/20 backdrop-blur-md flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground flex items-center gap-3">
                  <Globe className="h-5 w-5 text-primary" /> {t.mapping.hotspotsTitle}
                </CardTitle>
                <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">{t.mapping.hotspotsDesc}</CardDescription>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
                 <Crosshair className="h-3 w-3 text-primary" />
                 <span className="text-[8px] font-black text-primary uppercase tracking-widest">LIVE RADAR</span>
              </div>
            </CardHeader>
            <CardContent className="p-0 h-full relative">
              {/* Tactical Grid Background */}
              <div className="absolute inset-0 grid grid-cols-[repeat(20,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] opacity-[0.05]">
                {[...Array(400)].map((_, i) => (
                  <div key={i} className="border-[0.5px] border-white/20" />
                ))}
              </div>

              {/* Radar Sweep Effect */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                 <div className="w-[200%] h-[200%] absolute -top-1/2 -left-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,var(--primary)_10deg,transparent_40deg)] opacity-[0.03] animate-[spin_10s_linear_infinite]" />
              </div>

              <div className="relative h-full w-full flex items-center justify-center p-8 sm:p-12 overflow-hidden">
                 <div className="w-full h-full relative">
                    {/* World Map SVG Silhouette - Professional Representation */}
                    <svg viewBox="0 0 1000 500" className="w-full h-full fill-white/10 drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                       <g className="world-path">
                         {/* North America */}
                         <path d="M124,105 L260,105 L280,180 L230,260 L180,240 L100,200 L80,140 Z" />
                         {/* South America */}
                         <path d="M260,280 L360,280 L380,450 L320,490 L260,350 Z" />
                         {/* Europe */}
                         <path d="M460,100 L540,100 L550,180 L480,180 L450,150 Z" />
                         {/* Africa */}
                         <path d="M460,200 L580,200 L620,330 L550,450 L480,380 L440,250 Z" />
                         {/* Asia */}
                         <path d="M550,60 L850,60 L920,250 L800,380 L600,380 L560,200 Z" />
                         {/* Australia */}
                         <path d="M780,380 L900,380 L920,470 L820,480 Z" />
                       </g>
                    </svg>

                    {/* Nodes represent real players from DB */}
                    {Object.entries(statsByCountry).map(([name, stat]) => {
                      const pos = COUNTRY_COORDS[name] || { x: 500, y: 250 }; // Fallback central si no hay coord
                      return (
                        <div 
                          key={name}
                          className="absolute group"
                          style={{
                            top: `${(pos.y / 500) * 100}%`,
                            left: `${(pos.x / 1000) * 100}%`
                          }}
                        >
                          <div className="relative -translate-x-1/2 -translate-y-1/2">
                            <div className="h-6 w-6 bg-primary/20 rounded-full absolute -inset-1.5 animate-ping opacity-40" />
                            <div className="h-3 w-3 bg-primary rounded-full border-2 border-white shadow-[0_0_15px_hsl(var(--primary))] transition-transform group-hover:scale-150 cursor-pointer" />
                            
                            {/* Tooltip on hover */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/90 px-3 py-2 rounded-xl border border-primary/40 opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none scale-90 group-hover:scale-100">
                              <p className="text-[10px] font-black uppercase text-primary tracking-widest">{name}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <div className="text-center">
                                  <p className="text-[8px] text-muted-foreground uppercase">Talent</p>
                                  <p className="text-xs font-black text-white">{stat.count}</p>
                                </div>
                                <div className="h-4 w-[1px] bg-white/10" />
                                <div className="text-center">
                                  <p className="text-[8px] text-muted-foreground uppercase">PIM</p>
                                  <p className="text-xs font-black text-accent">{stat.avgPim}%</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
            <CardHeader className="border-b border-border/10 pb-4">
              <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-primary" /> {t.mapping.priorityRegions}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {countries.length > 0 ? countries.map(([name, stat]) => (
                  <RegionItem 
                    key={name}
                    name={name} 
                    count={stat.count} 
                    growth="+12%" 
                    pim={stat.avgPim} 
                    t={t} 
                  />
                )) : (
                  <div className="py-12 text-center space-y-3 opacity-40">
                    <MapPin className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      No data in private database
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5 shadow-xl rounded-2xl overflow-hidden">
            <div className="bg-primary/20 p-4 border-b border-primary/30">
               <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-primary">
                <Briefcase className="h-3.5 w-3.5" /> {t.mapping.logistics}
              </CardTitle>
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center p-4 bg-background/50 rounded-2xl border border-border/20 shadow-inner">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tight">{t.mapping.activeScouts}</span>
                <span className="text-xl font-black text-foreground">1 (Active Node)</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-background/50 rounded-2xl border border-border/20 shadow-inner">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-tight">{t.mapping.reportsGenerated}</span>
                <span className="text-xl font-black text-foreground">{players.length}</span>
              </div>
              <div className="pt-2">
                <div className="flex justify-between mb-2">
                  <p className="text-[9px] font-black uppercase text-primary tracking-widest">Network Coverage</p>
                  <span className="text-[9px] font-black text-primary">{(countries.length / 22 * 100).toFixed(0)}%</span>
                </div>
                <Progress value={Math.min(countries.length * 5, 100)} className="h-2 bg-primary/10 rounded-full" />
                <p className="text-[8px] text-muted-foreground mt-3 italic font-medium">Metrics extracted from synchronized Firestore nodes.</p>
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
            <span className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{count} {t.mapping.identified}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="text-[9px] text-accent font-black tracking-widest">{growth}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mb-0.5">{t.mapping.avgPim}</p>
          <p className="text-xl font-black font-headline text-primary leading-none">{pim}%</p>
        </div>
      </div>
      <div className="relative h-1.5 w-full bg-secondary/30 rounded-full overflow-hidden shadow-inner">
        <div 
          className="absolute inset-y-0 left-0 bg-primary transition-all duration-1000 shadow-[0_0_15px_rgba(224,176,80,0.6)] rounded-full" 
          style={{ width: `${pim}%` }} 
        />
      </div>
    </div>
  );
}
