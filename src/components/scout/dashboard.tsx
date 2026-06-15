
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShieldCheck, ClipboardCheck, ChevronRight, TrendingUp, Activity, Clock, Target } from "lucide-react";
import { Player, ScoutingReport, TACTICAL_ROLES } from "@/lib/types";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers, subscribeToReports, subscribeToGlobalPlayers, subscribeToGlobalReports } from "@/lib/services/db-service";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface ScoutDashboardProps {
  userProfile: any;
  onViewFicha: (id: string) => void;
}

// Coordenadas para el campo táctico (Base 400x600 vertical)
const POSITION_COORDS: Record<string, { x: number, y: number, label: string }> = {
  'po': { x: 200, y: 540, label: 'PO' },
  'dc-def': { x: 200, y: 460, label: 'DC' },
  'ld': { x: 340, y: 440, label: 'LD' },
  'li': { x: 60, y: 440, label: 'LI' },
  'mcd': { x: 200, y: 370, label: 'MCD' },
  'mc': { x: 200, y: 300, label: 'MC' },
  'mco': { x: 200, y: 220, label: 'MCO' },
  'ed': { x: 340, y: 180, label: 'ED' },
  'ei': { x: 60, y: 180, label: 'EI' },
  'sd': { x: 200, y: 130, label: 'SD' },
  'dc-fwd': { x: 200, y: 60, label: 'DC' },
};

export function ScoutDashboard({ userProfile, onViewFicha }: ScoutDashboardProps) {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Player[]>([]);
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [scoutId, setScoutId] = useState<string | null>(null);

  const role = userProfile?.role || 'invitado';
  const isManagement = ['admin', 'gestion', 'director'].includes(role);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setScoutId(user?.uid || null);
      setAuthReady(true);
      if (!user) setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authReady || !scoutId) return;

    const unsubPlayers = isManagement 
      ? subscribeToGlobalPlayers(setPlayers)
      : subscribeToPlayers(scoutId, setPlayers);

    const unsubReports = isManagement
      ? subscribeToGlobalReports(setReports)
      : subscribeToReports(scoutId, setReports);

    const timer = setTimeout(() => setLoading(false), 1000);

    return () => {
      unsubPlayers();
      unsubReports();
      clearTimeout(timer);
    };
  }, [authReady, scoutId, isManagement]);

  const positionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(POSITION_COORDS).forEach(roleId => counts[roleId] = 0);
    
    // Solo contamos jugadores que tengan al menos un informe (BD Scout)
    const analyzedPlayerIds = new Set(reports.map(r => r.playerId));
    
    players.forEach(p => {
      if (analyzedPlayerIds.has(p.id) && counts[p.tacticalRole] !== undefined) {
        counts[p.tacticalRole]++;
      }
    });
    return counts;
  }, [players, reports]);

  const liveFeed = useMemo(() => {
    return [...reports]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 5);
  }, [reports]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="h-16 w-16 rounded-2xl border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">{t.dashboard.stats.syncing}</p>
      </div>
    );
  }

  const totalInDb = players.length;
  const analyzedCount = players.filter(p => reports.some(r => r.playerId === p.id)).length;
  const identifiedOnly = Math.max(0, totalInDb - analyzedCount);
  const totalReports = reports.length;

  const reportsWithPIM = reports.filter(r => (r.pimScore && r.pimScore > 0) || (r.finalScoutRating && r.finalScoutRating > 0));
  const avgPim = reportsWithPIM.length > 0 
    ? Math.round(reportsWithPIM.reduce((acc, curr) => acc + (curr.pimScore || curr.finalScoutRating! * 20), 0) / reportsWithPIM.length)
    : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col gap-2">
        <div className="h-1 w-12 bg-primary rounded-full mb-2" />
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-headline font-black text-foreground uppercase tracking-tight">{t.dashboard.title}</h1>
          {isManagement && <Badge className="bg-primary/20 text-primary border-primary/30 font-black text-[9px] uppercase tracking-widest px-3 py-1">Modo Club</Badge>}
        </div>
        <p className="text-muted-foreground font-medium">{t.dashboard.subtitle}</p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title={t.dashboard.stats.detected} value={totalInDb.toString()} icon={<User className="text-primary" />} />
        <StatCard title={t.dashboard.stats.identified} value={identifiedOnly.toString()} icon={<Target className="text-accent" />} />
        <StatCard title={t.dashboard.stats.analyzed} value={analyzedCount.toString()} icon={<ShieldCheck className="text-primary" />} />
        <StatCard title={t.dashboard.stats.reports} value={totalReports.toString()} icon={<ClipboardCheck className="text-accent" />} />
        <StatCard title={t.dashboard.stats.avgPim} value={avgPim > 0 ? avgPim.toString() : "-"} icon={<TrendingUp className="text-primary" />} highlight />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Tactical Pitch Map */}
        <Card className="lg:col-span-7 border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-2xl flex flex-col">
          <CardHeader className="p-8 pb-4">
             <div className="space-y-1">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 text-white">
                  Mapa de Densidad Táctica
                </CardTitle>
                <p className="text-[10px] text-muted-foreground uppercase font-bold italic">Ocupación de la BD Scout por posición</p>
             </div>
          </CardHeader>
          <CardContent className="p-8 pt-4 flex-1 flex items-center justify-center">
             <div className="relative w-full max-w-[450px] aspect-[2/3] bg-[#001524] rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl">
                {/* SVG Pitch Lines */}
                <svg viewBox="0 0 400 600" className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                  <rect x="10" y="10" width="380" height="580" fill="none" stroke="white" strokeWidth="2" />
                  <line x1="10" y1="300" x2="390" y2="300" stroke="white" strokeWidth="2" />
                  <circle cx="200" cy="300" r="60" fill="none" stroke="white" strokeWidth="2" />
                  <rect x="80" y="10" width="240" height="100" fill="none" stroke="white" strokeWidth="2" />
                  <rect x="80" y="490" width="240" height="100" fill="none" stroke="white" strokeWidth="2" />
                </svg>

                {/* Tactical Nodes */}
                {Object.entries(POSITION_COORDS).map(([id, pos]) => {
                  const count = positionCounts[id] || 0;
                  const isActive = count > 0;
                  
                  return (
                    <div 
                      key={id} 
                      className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
                      style={{ left: `${(pos.x / 400) * 100}%`, top: `${(pos.y / 600) * 100}%` }}
                    >
                      <div className={cn(
                        "flex flex-col items-center gap-1 group",
                        !isActive && "opacity-30"
                      )}>
                        <div className={cn(
                          "h-10 w-10 rounded-full border-2 flex items-center justify-center font-black text-[10px] transition-all duration-300 shadow-lg",
                          isActive 
                            ? "bg-primary border-primary text-primary-foreground scale-110 shadow-primary/30" 
                            : "bg-secondary/80 border-white/20 text-white"
                        )}>
                          {count}
                        </div>
                        <span className="text-[8px] font-black text-white uppercase tracking-tighter bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm border border-white/5">
                          {pos.label}
                        </span>
                      </div>
                    </div>
                  );
                })}

                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-black text-primary/60 uppercase tracking-[0.3em]">
                  ScoutPro 360 Tactical Lab
                </div>
             </div>
          </CardContent>
        </Card>

        {/* Live Supply Feed */}
        <Card className="lg:col-span-5 border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-2xl">
          <CardHeader className="p-8 pb-6 flex flex-row items-center justify-between border-b border-border/10 bg-secondary/5">
             <div className="space-y-1">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-white">Suministro en Vivo</CardTitle>
                <p className="text-[9px] text-primary font-bold uppercase tracking-[0.2em]">INTELIGENCIA TÉCNICA IA</p>
             </div>
             <Badge className="bg-accent/20 text-accent border-accent/30 text-[8px] font-black uppercase tracking-tighter animate-pulse">
               VIVO
             </Badge>
          </CardHeader>
          <CardContent className="p-0">
             {liveFeed.length > 0 ? (
               <div className="divide-y divide-border/10">
                 {liveFeed.map((report, idx) => {
                   const playerClub = players.find(p => p.id === report.playerId)?.club || 'Sin Club';
                   
                   return (
                     <div key={idx} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all group">
                       <div className="flex items-center gap-4">
                         <Avatar className="h-12 w-12 rounded-xl bg-secondary border border-border/40 shadow-lg">
                           <AvatarFallback className="font-black text-sm text-primary">{report.playerName[0].toUpperCase()}</AvatarFallback>
                         </Avatar>
                         <div className="space-y-0.5">
                           <p className="text-sm font-headline font-black uppercase text-white group-hover:text-primary transition-colors leading-tight">
                             {report.playerName}
                           </p>
                           <div className="flex items-center gap-2">
                             <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">{playerClub}</span>
                           </div>
                         </div>
                       </div>
                       <div className="text-right">
                         <div className="flex items-center gap-1 justify-end">
                           <span className="text-xl font-black text-primary font-headline leading-none">{report.pimScore || 0}</span>
                           <span className="text-[8px] font-black text-muted-foreground uppercase">PIM</span>
                         </div>
                         <p className="text-[9px] font-bold text-muted-foreground uppercase mt-1 flex items-center gap-1 justify-end">
                           <Clock className="h-2.5 w-2.5" />
                           {report.createdAt?.seconds ? formatDistanceToNow(new Date(report.createdAt.seconds * 1000), { locale: es, addSuffix: true }).toUpperCase() : 'AHORA'}
                         </p>
                       </div>
                     </div>
                   );
                 })}
                 <div className="p-6 bg-secondary/10">
                   <button className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-muted-foreground hover:text-white uppercase tracking-widest transition-colors border border-white/10 rounded-lg py-3">
                     VER TODA LA ACTIVIDAD <ChevronRight className="h-3 w-3" />
                   </button>
                 </div>
               </div>
             ) : (
               <div className="py-20 text-center flex flex-col items-center gap-3 opacity-30">
                  <Activity className="h-8 w-8 text-muted-foreground" />
                  <p className="text-[9px] font-black uppercase tracking-widest">Esperando informes de campo...</p>
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, highlight = false }: { title: string, value: string, icon: any, highlight?: boolean }) {
  return (
    <Card className={`border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] p-6 hover:scale-[1.03] transition-all cursor-default group shadow-xl ${highlight ? 'ring-1 ring-primary/30 bg-primary/5' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{title}</p>
        <div className={`h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/10 group-hover:bg-primary/10 transition-colors ${highlight ? 'border-primary/20' : ''}`}>{icon}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <p className={`text-5xl font-black font-headline tracking-tighter ${highlight ? 'text-primary drop-shadow-[0_0_15px_rgba(224,176,80,0.3)]' : ''}`}>{value}</p>
      </div>
    </Card>
  );
}
