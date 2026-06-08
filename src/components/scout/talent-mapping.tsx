
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
 * Coordenadas calibradas para el mapa realista (viewBox="0 0 1000 500")
 * Se han ajustado para coincidir con el trazado SVG detallado.
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

          {/* Radar Scan Effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             <div className="w-[200%] h-[200%] absolute -top-1/2 -left-1/2 bg-[conic-gradient(from_0deg,transparent_0deg,var(--primary)_10deg,transparent_40deg)] opacity-[0.02] animate-[spin_12s_linear_infinite]" />
          </div>

          <div className="relative h-full w-full flex items-center justify-center p-8 sm:p-12">
             <div className="w-full h-full max-w-[1200px] aspect-[2/1] relative">
                {/* World Map SVG Detallado (Basado en referencia realista) */}
                <svg viewBox="0 0 1000 500" className="w-full h-full fill-white/[0.08] stroke-white/20 stroke-[0.5] drop-shadow-[0_0_40px_rgba(0,0,0,0.6)]">
                   <g>
                     {/* Norteamérica */}
                     <path d="M125,50 L200,45 L280,60 L310,130 L300,200 L250,250 L200,280 L140,260 L90,200 L85,100 Z" />
                     {/* Centroamérica */}
                     <path d="M250,250 L270,270 L260,290 L240,280 Z" />
                     {/* Sudamérica */}
                     <path d="M270,300 L350,290 L400,320 L420,380 L410,480 L350,495 L280,480 L255,380 L260,320 Z" />
                     {/* Groenlandia */}
                     <path d="M350,25 L430,20 L450,60 L430,90 L360,95 Z" />
                     {/* Europa */}
                     <path d="M450,130 L500,105 L550,110 L580,140 L570,190 L520,210 L480,200 L445,150 Z" />
                     {/* Reino Unido & Irlanda */}
                     <path d="M470,90 L490,95 L485,120 L465,115 Z" />
                     {/* África */}
                     <path d="M450,210 L520,200 L580,220 L620,260 L640,350 L610,440 L560,475 L500,460 L440,380 L420,300 Z" />
                     {/* Madagascar */}
                     <path d="M630,380 L650,385 L645,410 L625,405 Z" />
                     {/* Asia */}
                     <path d="M580,100 L700,70 L850,85 L950,110 L970,200 L950,300 L850,380 L750,400 L650,350 L590,200 Z" />
                     {/* India */}
                     <path d="M700,260 L730,270 L725,320 L705,315 Z" />
                     {/* Sudeste Asiático / Indonesia */}
                     <path d="M800,350 L880,360 L870,390 L810,380 Z" />
                     {/* Australia */}
                     <path d="M820,400 L920,395 L950,430 L930,490 L850,495 L800,450 Z" />
                     {/* Nueva Zelanda */}
                     <path d="M940,480 L965,485 L960,500 L945,505 Z" />
                     {/* Japón */}
                     <path d="M890,160 L910,165 L905,200 L885,195 Z" />
                   </g>
                </svg>

                {/* Nodes represent real players from DB */}
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
                        {/* Glow effect */}
                        <div className="h-8 w-8 bg-primary/20 rounded-full absolute -inset-2.5 animate-ping opacity-30" />
                        
                        {/* Pulsing marker */}
                        <div className="h-4 w-4 bg-primary rounded-full border-2 border-white shadow-[0_0_20px_hsl(var(--primary))] transition-all group-hover:scale-150 cursor-pointer" />
                        
                        {/* Interactive Tooltip */}
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

          {/* Sync Legend */}
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

