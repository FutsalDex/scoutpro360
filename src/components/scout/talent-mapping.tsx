
"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, Loader2, Crosshair } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers } from "@/lib/services/db-service";
import { Player } from "@/lib/types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";

// Coordenadas calibradas para el nuevo SVG detallado (viewBox="0 0 1000 500")
const COUNTRY_COORDS: Record<string, { x: number, y: number }> = {
  "España": { x: 485, y: 155 },
  "Argentina": { x: 315, y: 420 },
  "Brasil": { x: 345, y: 345 },
  "Portugal": { x: 475, y: 160 },
  "Francia": { x: 495, y: 145 },
  "Italia": { x: 510, y: 160 },
  "Alemania": { x: 505, y: 130 },
  "Reino Unido": { x: 485, y: 120 },
  "México": { x: 210, y: 235 },
  "Colombia": { x: 285, y: 305 },
  "Uruguay": { x: 335, y: 420 },
  "Chile": { x: 295, y: 420 },
  "Ecuador": { x: 270, y: 325 },
  "Perú": { x: 280, y: 355 },
  "Bélgica": { x: 498, y: 135 },
  "Países Bajos": { x: 498, y: 130 },
  "Egipto": { x: 565, y: 215 },
  "Marruecos": { x: 485, y: 205 },
  "Nigeria": { x: 515, y: 285 },
  "Japón": { x: 885, y: 185 },
  "Australia": { x: 855, y: 415 },
  "Estados Unidos": { x: 210, y: 165 },
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

      <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden relative min-h-[650px] w-full">
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
        
        <CardContent className="p-0 h-[calc(100%-80px)] relative">
          {/* Tactical Grid Background */}
          <div className="absolute inset-0 grid grid-cols-[repeat(30,minmax(0,1fr))] grid-rows-[repeat(20,minmax(0,1fr))] opacity-[0.03]">
            {[...Array(600)].map((_, i) => (
              <div key={i} className="border-[0.5px] border-white/20" />
            ))}
          </div>

          {/* Radar Sweep Effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="w-[200%] h-[200%] absolute -top-1/2 -left-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,var(--primary)_10deg,transparent_40deg)] opacity-[0.02] animate-[spin_12s_linear_infinite]" />
          </div>

          <div className="relative h-full w-full flex items-center justify-center p-8 sm:p-12">
             <div className="w-full h-full max-w-[1200px] aspect-[2/1] relative">
                {/* World Map SVG Detailed Silhouette */}
                <svg viewBox="0 0 1000 500" className="w-full h-full fill-white/[0.08] stroke-white/20 stroke-[0.5] drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                   <g>
                     {/* Norteamérica */}
                     <path d="M120,80 L280,80 L310,180 L240,280 L140,240 L80,180 Z" />
                     <path d="M100,50 L200,40 L180,70 Z" /> {/* Groenlandia */}
                     
                     {/* Sudamérica */}
                     <path d="M280,290 L380,290 L400,460 L330,495 L270,360 Z" />
                     
                     {/* Europa */}
                     <path d="M460,110 L560,100 L580,180 L500,190 L450,160 Z" />
                     <path d="M440,80 L470,70 L460,90 Z" /> {/* Islandia */}
                     
                     {/* África */}
                     <path d="M460,200 L600,210 L640,340 L570,470 L500,400 L440,260 Z" />
                     <path d="M640,350 L660,360 L650,400 Z" /> {/* Madagascar */}
                     
                     {/* Asia y Rusia */}
                     <path d="M560,60 L920,50 L980,250 L850,400 L620,400 L580,200 Z" />
                     
                     {/* Sudeste Asiático e Islas */}
                     <path d="M780,330 L830,330 L820,360 Z" />
                     <path d="M850,300 L880,300 L870,330 Z" />
                     
                     {/* Australia */}
                     <path d="M800,390 L920,390 L940,480 L840,490 Z" />
                     <path d="M950,470 L970,470 L960,495 Z" /> {/* N.Zelanda */}
                   </g>
                </svg>

                {/* Nodes represent real players from DB */}
                {Object.entries(statsByCountry).map(([name, stat]) => {
                  const pos = COUNTRY_COORDS[name];
                  if (!pos) return null; // No renderizar si no tenemos coordenadas para el país
                  
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
                        <div className="h-8 w-8 bg-primary/20 rounded-full absolute -inset-2.5 animate-ping opacity-30" />
                        <div className="h-4 w-4 bg-primary rounded-full border-2 border-white shadow-[0_0_20px_hsl(var(--primary))] transition-all group-hover:scale-150 cursor-pointer" />
                        
                        {/* Tooltip on hover */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/95 px-4 py-3 rounded-2xl border border-primary/40 opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none scale-90 group-hover:scale-100 shadow-2xl">
                          <p className="text-[11px] font-black uppercase text-primary tracking-widest">{name}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <div className="text-center">
                              <p className="text-[9px] text-muted-foreground uppercase font-bold">Talento</p>
                              <p className="text-sm font-black text-white">{stat.count}</p>
                            </div>
                            <div className="h-6 w-[1px] bg-white/10" />
                            <div className="text-center">
                              <p className="text-[9px] text-muted-foreground uppercase font-bold">PIM AVG</p>
                              <p className="text-sm font-black text-accent">{stat.avgPim}%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>

          <div className="absolute bottom-10 left-10 flex items-center gap-6 bg-black/60 p-5 rounded-2xl border border-white/5 backdrop-blur-xl">
             <div className="flex items-center gap-3">
               <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
               <p className="text-[10px] font-black uppercase tracking-widest text-white/80">
                  Nodos de Talento Sincronizados
               </p>
             </div>
             <div className="h-4 w-[1px] bg-white/10" />
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
               {players.length} Prospectos en Red Privada
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
