"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Loader2, Crosshair } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers } from "@/lib/services/db-service";
import { Player } from "@/lib/types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

const COUNTRY_COORDS: Record<string, { x: number, y: number }> = {
  "España": { x: 485, y: 165 },
  "Argentina": { x: 315, y: 430 },
  "Brasil": { x: 360, y: 350 },
  "Portugal": { x: 475, y: 170 },
  "Francia": { x: 495, y: 145 },
  "Italia": { x: 512, y: 165 },
  "Alemania": { x: 510, y: 135 },
  "Reino Unido": { x: 482, y: 125 },
  "México": { x: 210, y: 245 },
  "Colombia": { x: 285, y: 315 },
  "Uruguay": { x: 335, y: 430 },
  "Chile": { x: 295, y: 430 },
  "Ecuador": { x: 270, y: 335 },
  "Perú": { x: 280, y: 365 },
  "Bélgica": { x: 500, y: 140 },
  "Países Bajos": { x: 500, y: 135 },
  "Egipto": { x: 565, y: 225 },
  "Marruecos": { x: 485, y: 215 },
  "Nigeria": { x: 515, y: 295 },
  "Japón": { x: 885, y: 195 },
  "Australia": { x: 855, y: 425 },
  "Estados Unidos": { x: 210, y: 175 },
  "Canadá": { x: 195, y: 115 },
  "Rusia": { x: 695, y: 115 },
  "China": { x: 775, y: 205 },
  "India": { x: 705, y: 265 },
  "Sudáfrica": { x: 545, y: 425 },
  "Noruega": { x: 505, y: 85 },
  "Suecia": { x: 525, y: 90 },
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

  const statsByCountry = players.reduce((acc, player) => {
    const country = player.nationality || 'Unknown';
    if (!acc[country]) {
      acc[country] = { count: 0 };
    }
    acc[country].count += 1;
    return acc;
  }, {} as Record<string, { count: number }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-12">
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

      <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden relative min-h-[650px] w-full border-2">
        <CardHeader className="border-b border-border/10 pb-6 relative z-10 bg-background/20 backdrop-blur-md flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-black uppercase tracking-widest text-foreground flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" /> {t.mapping.hotspotsTitle}
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground/60">Análisis geoespacial de la red de captación</CardDescription>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
             <Crosshair className="h-3 w-3 text-primary" />
             <span className="text-[8px] font-black text-primary uppercase tracking-widest">LIVE RADAR</span>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-[calc(100%-80px)] relative">
          <div className="absolute inset-0 grid grid-cols-[repeat(40,minmax(0,1fr))] grid-rows-[repeat(25,minmax(0,1fr))] opacity-[0.05]">
            {[...Array(1000)].map((_, i) => (
              <div key={i} className="border-[0.5px] border-white/10" />
            ))}
          </div>

          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="w-[300%] h-[300%] absolute -top-full -left-full bg-[conic-gradient(from_0deg,transparent_0deg,var(--primary)_5deg,transparent_20deg)] opacity-[0.03] animate-[spin_10s_linear_infinite]" />
          </div>

          <div className="relative h-full w-full flex items-center justify-center p-4 sm:p-12">
             <div className="w-full h-full max-w-[1400px] aspect-[2/1] relative">
                <svg viewBox="0 0 1000 500" className="w-full h-full fill-white/[0.04] stroke-white/20 stroke-[0.3] drop-shadow-[0_0_50px_rgba(0,0,0,0.7)]">
                   <g>
                     <path d="M150,50 L250,45 L320,60 L330,120 L310,180 L280,240 L230,260 L180,250 L140,220 L100,150 L110,80 Z" />
                     <path d="M280,300 L360,295 L410,320 L430,380 L420,470 L360,490 L300,480 L270,380 Z" />
                     <path d="M460,120 L510,100 L560,110 L590,140 L580,190 L530,210 L490,200 L455,150 Z" />
                     <path d="M460,220 L530,210 L590,220 L630,260 L650,350 L620,440 L570,480 L510,470 L450,380 L430,300 Z" />
                     <path d="M590,100 L720,70 L870,85 L960,110 L980,200 L960,300 L870,380 L760,400 L660,350 L600,200 Z" />
                     <path d="M830,410 L930,405 L960,440 L940,490 L860,495 L810,450 Z" />
                   </g>
                </svg>

                {Object.entries(statsByCountry).map(([name, stat]) => {
                  const pos = COUNTRY_COORDS[name];
                  if (!pos) return null;
                  
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
                        <div className="h-12 w-12 bg-primary/20 rounded-full absolute -inset-4 animate-ping opacity-30" />
                        <div className="h-5 w-5 bg-primary rounded-full border-2 border-white shadow-[0_0_25px_hsl(var(--primary))] transition-all group-hover:scale-125 cursor-pointer flex items-center justify-center">
                           <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                        </div>
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#1b263b] px-6 py-5 rounded-2xl border-2 border-primary/30 opacity-0 group-hover:opacity-100 transition-all z-30 pointer-events-none scale-95 group-hover:scale-100 shadow-[0_30px_60px_rgba(0,0,0,0.9)]">
                          <p className="text-[12px] font-black uppercase text-primary tracking-[0.2em]">{name}</p>
                          <div className="flex items-center gap-8 mt-4">
                            <div className="text-center">
                              <p className="text-[9px] text-muted-foreground uppercase font-black">Activos</p>
                              <p className="text-lg font-black text-white">{stat.count}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>

          <div className="absolute bottom-10 left-10 flex items-center gap-8 bg-black/60 p-6 rounded-[2rem] border border-white/10 backdrop-blur-2xl shadow-2xl z-20">
             <div className="flex items-center gap-4">
               <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
               <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white">
                  Red Privada Sincronizada
               </p>
             </div>
             <div className="h-6 w-[1px] bg-white/20" />
             <div className="flex flex-col">
               <p className="text-[10px] font-bold text-muted-foreground uppercase">{players.length} Prospectos</p>
               <p className="text-[8px] font-medium text-primary/60 uppercase tracking-tighter">Última actualización: Ahora</p>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
