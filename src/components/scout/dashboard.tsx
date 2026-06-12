
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShieldCheck, ClipboardCheck, ChevronRight, MapPin, Star, Binoculars, TrendingUp, LayoutGrid, Activity, Clock } from "lucide-react";
import { Player, ScoutingReport, TACTICAL_ROLES } from "@/lib/types";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers, subscribeToReports, subscribeToGlobalPlayers, subscribeToGlobalReports } from "@/lib/services/db-service";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface ScoutDashboardProps {
  userProfile: any;
  onViewFicha: (id: string) => void;
}

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

  // Data for Charts - Include all roles
  const positionData = useMemo(() => {
    const counts: Record<string, number> = {};
    
    // Initialize all standard roles
    TACTICAL_ROLES.forEach(role => {
      const roleName = (t.report.tacticalRoles[role.id as keyof typeof t.report.tacticalRoles] || role.name).split(' – ')[0];
      counts[roleName] = 0;
    });

    players.forEach(p => {
      const roleName = (t.report.tacticalRoles[p.tacticalRole as keyof typeof t.report.tacticalRoles] || p.tacticalRole).split(' – ')[0];
      // Only increment if it's one of our expected keys
      if (counts[roleName] !== undefined) {
        counts[roleName]++;
      }
    });

    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [players, t]);

  const liveFeed = useMemo(() => {
    return [...reports]
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      .slice(0, 4);
  }, [reports]);

  const chartConfig = {
    count: { label: t.dashboard.charts.players, color: "hsl(var(--primary))" }
  } satisfies ChartConfig;

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
        <StatCard title={t.dashboard.stats.identified} value={identifiedOnly.toString()} icon={<Binoculars className="text-accent" />} />
        <StatCard title={t.dashboard.stats.analyzed} value={analyzedCount.toString()} icon={<ShieldCheck className="text-primary" />} />
        <StatCard title={t.dashboard.stats.reports} value={totalReports.toString()} icon={<ClipboardCheck className="text-accent" />} />
        <StatCard title={t.dashboard.stats.avgPim} value={avgPim > 0 ? avgPim.toString() : "-"} icon={<TrendingUp className="text-primary" />} highlight />
      </div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Vertical Position Chart */}
        <Card className="lg:col-span-8 border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-2xl">
          <CardHeader className="p-8 pb-4">
             <div className="space-y-1">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 text-white">
                  Distribución Táctica por Posición
                </CardTitle>
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Cobertura total de la red de captación</p>
             </div>
          </CardHeader>
          <CardContent className="p-8 pt-4">
             <div className="h-[350px] w-full">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={positionData} margin={{ top: 20, right: 30, left: -20, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.2} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          fontSize={9} 
                          fontWeight="bold" 
                          stroke="hsl(var(--muted-foreground))"
                          interval={0}
                        />
                        <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))" />
                        <ChartTooltip 
                          cursor={{ fill: 'rgba(224, 176, 80, 0.05)' }}
                          content={<ChartTooltipContent />}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={35}>
                          {positionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={entry.count > 0 ? 1 : 0.1} />
                          ))}
                        </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
             </div>
          </CardContent>
        </Card>

        {/* Live Supply Feed */}
        <Card className="lg:col-span-4 border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-2xl">
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
