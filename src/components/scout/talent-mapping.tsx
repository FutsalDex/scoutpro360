
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

/**
 * Coordenadas técnicas calibradas para el nuevo mapa realista (viewBox="0 0 1000 500")
 */
const COUNTRY_COORDS: Record<string, { x: number, y: number }> = {
  "España": { x: 488, y: 158 },
  "Argentina": { x: 318, y: 425 },
  "Brasil": { x: 355, y: 355 },
  "Portugal": { x: 478, y: 162 },
  "Francia": { x: 498, y: 142 },
  "Italia": { x: 515, y: 162 },
  "Alemania": { x: 512, y: 132 },
  "Reino Unido": { x: 485, y: 122 },
  "México": { x: 215, y: 238 },
  "Colombia": { x: 290, y: 310 },
  "Uruguay": { x: 340, y: 425 },
  "Chile": { x: 300, y: 425 },
  "Ecuador": { x: 275, y: 330 },
  "Perú": { x: 285, y: 360 },
  "Bélgica": { x: 502, y: 138 },
  "Países Bajos": { x: 502, y: 132 },
  "Egipto": { x: 570, y: 218 },
  "Marruecos": { x: 488, y: 208 },
  "Nigeria": { x: 518, y: 288 },
  "Japón": { x: 890, y: 188 },
  "Australia": { x: 860, y: 418 },
  "Estados Unidos": { x: 215, y: 168 },
  "Canadá": { x: 200, y: 110 },
  "Rusia": { x: 700, y: 110 },
  "China": { x: 780, y: 200 },
  "India": { x: 710, y: 260 },
  "Sudáfrica": { x: 550, y: 420 },
  "Noruega": { x: 510, y: 80 },
  "Suecia": { x: 530, y: 85 },
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

      <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden relative min-h-[600px] w-full">
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

          {/* Radar Scan Effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="w-[200%] h-[200%] absolute -top-1/2 -left-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,var(--primary)_10deg,transparent_40deg)] opacity-[0.02] animate-[spin_12s_linear_infinite]" />
          </div>

          <div className="relative h-full w-full flex items-center justify-center p-8 sm:p-12">
             <div className="w-full h-full max-w-[1200px] aspect-[2/1] relative">
                {/* World Map SVG Realista de Alta Fidelidad */}
                <svg viewBox="0 0 1000 500" className="w-full h-full fill-white/[0.08] stroke-white/20 stroke-[0.5] drop-shadow-[0_0_40px_rgba(0,0,0,0.6)]">
                   <g>
                     {/* Norteamérica y Groenlandia */}
                     <path d="M210,50 L280,45 L320,60 L330,120 L310,180 L280,240 L230,260 L180,250 L140,220 L100,150 L110,80 Z" />
                     <path d="M350,20 L440,15 L460,50 L440,90 L360,100 Z" />
                     {/* Sudamérica */}
                     <path d="M280,300 L360,295 L410,320 L430,380 L420,470 L360,490 L300,480 L270,380 Z" />
                     {/* Europa */}
                     <path d="M460,120 L510,100 L560,110 L590,140 L580,190 L530,210 L490,200 L455,150 Z" />
                     {/* África */}
                     <path d="M460,220 L530,210 L590,220 L630,260 L650,350 L620,440 L570,480 L510,470 L450,380 L430,300 Z" />
                     {/* Asia */}
                     <path d="M590,100 L720,70 L870,85 L960,110 L980,200 L960,300 L870,380 L760,400 L660,350 L600,200 Z" />
                     {/* Oceanía */}
                     <path d="M830,410 L930,405 L960,440 L940,490 L860,495 L810,450 Z" />
                     {/* Madagascar e Islas principales */}
                     <circle cx="640" cy="395" r="5" />
                     <circle cx="895" cy="180" r="4" />
                     <circle cx="955" cy="485" r="3" />
                     <circle cx="485" cy="105" r="3" />
                   </g>
                </svg>

                {/* Nodos de Talento Sincronizados con la BD real */}
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
                        {/* Efecto Glow Pulsante */}
                        <div className="h-10 w-10 bg-primary/30 rounded-full absolute -inset-3 animate-ping opacity-20" />
                        
                        {/* Marcador Táctico */}
                        <div className="h-4 w-4 bg-primary rounded-full border-2 border-white shadow-[0_0_20px_hsl(var(--primary))] transition-all group-hover:scale-150 cursor-pointer" />
                        
                        {/* Tooltip Interactivo de Inteligencia */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/95 px-5 py-4 rounded-2xl border border-primary/40 opacity-0 group-hover:opacity-100 transition-all z-20 pointer-events-none scale-90 group-hover:scale-100 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
                          <p className="text-[11px] font-black uppercase text-primary tracking-widest">{name}</p>
                          <div className="flex items-center gap-6 mt-3">
                            <div className="text-center">
                              <p className="text-[9px] text-muted-foreground uppercase font-bold">Prospectos</p>
                              <p className="text-sm font-black text-white">{stat.count}</p>
                            </div>
                            <div className="h-8 w-[1px] bg-white/10" />
                            <div className="text-center">
                              <p className="text-[9px] text-muted-foreground uppercase font-bold">PIM Medio</p>
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

          {/* Leyenda de Sincronización Global */}
          <div className="absolute bottom-8 left-8 flex items-center gap-6 bg-black/70 p-5 rounded-2xl border border-white/5 backdrop-blur-xl shadow-2xl">
             <div className="flex items-center gap-3">
               <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
               <p className="text-[10px] font-black uppercase tracking-widest text-white/90">
                  Nodos de Talento en Red Privada
               </p>
             </div>
             <div className="h-4 w-[1px] bg-white/10" />
             <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
               {players.length} Activos Sincronizados
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
