"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShieldCheck, ClipboardCheck, ChevronRight, MapPin, Star, Binoculars, TrendingUp, LayoutGrid, Activity } from "lucide-react";
import { Player, ScoutingReport } from "@/lib/types";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers, subscribeToReports, subscribeToGlobalPlayers, subscribeToGlobalReports } from "@/lib/services/db-service";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart, Cell } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

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

  // Data for Charts
  const positionData = useMemo(() => {
    const counts: Record<string, number> = {};
    players.forEach(p => {
      const roleName = (t.report.tacticalRoles[p.tacticalRole as keyof typeof t.report.tacticalRoles] || p.tacticalRole).split(' – ')[0];
      counts[roleName] = (counts[roleName] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [players, t]);

  const pimDistributionData = useMemo(() => {
    const ranges = [
      { name: '0-20', count: 0 },
      { name: '21-40', count: 0 },
      { name: '41-60', count: 0 },
      { name: '61-80', count: 0 },
      { name: '81-100', count: 0 },
    ];
    reports.forEach(r => {
      const score = r.pimScore || (r.finalScoutRating ? r.finalScoutRating * 20 : 0);
      if (score <= 20) ranges[0].count++;
      else if (score <= 40) ranges[1].count++;
      else if (score <= 60) ranges[2].count++;
      else if (score <= 80) ranges[3].count++;
      else ranges[4].count++;
    });
    return ranges;
  }, [reports]);

  const chartConfig = {
    count: { label: t.dashboard.charts.players, color: "hsl(var(--primary))" },
    pim: { label: "PIM Score", color: "hsl(var(--accent))" }
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
  
  const recentPlayers = [...players]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 5);

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

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-2xl">
          <CardHeader className="p-8 pb-4">
             <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
               <LayoutGrid className="h-4 w-4 text-primary" /> {t.dashboard.charts.positions}
             </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
             <div className="h-[300px] w-full">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={positionData} layout="vertical" margin={{ left: 20, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" opacity={0.2} />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          fontSize={10} 
                          fontWeight="bold" 
                          width={80}
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <ChartTooltip 
                          cursor={{ fill: 'rgba(224, 176, 80, 0.05)' }}
                          content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                          {positionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
                          ))}
                        </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
             </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-2xl">
          <CardHeader className="p-8 pb-4">
             <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3">
               <Activity className="h-4 w-4 text-accent" /> {t.dashboard.charts.quality}
             </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0">
             <div className="h-[300px] w-full">
                <ChartContainer config={chartConfig}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pimDistributionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.2} />
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          fontSize={10} 
                          fontWeight="bold" 
                          stroke="hsl(var(--muted-foreground))"
                        />
                        <YAxis axisLine={false} tickLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area 
                          type="monotone" 
                          dataKey="count" 
                          stroke="hsl(var(--accent))" 
                          fillOpacity={1} 
                          fill="url(#colorCount)" 
                          strokeWidth={3} 
                          animationDuration={1500}
                        />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Prospect List */}
      <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-2xl">
        <CardHeader className="p-8 border-b border-border/10 flex flex-row items-center justify-between bg-secondary/10">
          <div>
            <CardTitle className="text-lg font-black uppercase tracking-widest flex items-center gap-2">
              <Star className="h-5 w-5 text-primary fill-primary" /> {t.dashboard.recentProspects.title}
            </CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase font-bold">{t.dashboard.recentProspects.subtitle}</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {recentPlayers.length > 0 ? (
            <div className="divide-y divide-border/10">
              {recentPlayers.map(player => (
                <div key={player.id} className="p-6 flex items-center justify-between hover:bg-primary/5 transition-all cursor-pointer group" onClick={() => onViewFicha(player.id)}>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 rounded-xl border border-primary/20 shadow-lg">
                      <AvatarFallback className="font-black text-primary bg-primary/10">{player.name[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-black text-sm uppercase group-hover:text-primary transition-colors">{player.name}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-2 font-bold"><MapPin className="h-3 w-3" /> {player.club} · <span className="text-primary uppercase">{player.tacticalRole}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center text-muted-foreground font-black text-[10px] uppercase tracking-widest opacity-40">{t.dashboard.recentProspects.noData}</div>
          )}
        </CardContent>
      </Card>
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
