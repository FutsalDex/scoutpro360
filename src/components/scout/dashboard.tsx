"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, ShieldCheck, ClipboardCheck, TrendingUp, ChevronRight, MapPin, Star, Binoculars } from "lucide-react";
import { Player, ScoutingReport } from "@/lib/types";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers, subscribeToReports, subscribeToGlobalPlayers, subscribeToGlobalReports } from "@/lib/services/db-service";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ScoutDashboardProps {
  userProfile: any;
  onEditPlayer: (id: string) => void;
}

export function ScoutDashboard({ userProfile, onEditPlayer }: ScoutDashboardProps) {
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

    // Directivos ven todo el club, Scouts ven solo su patrimonio
    const unsubPlayers = isManagement 
      ? subscribeToGlobalPlayers(setPlayers)
      : subscribeToPlayers(scoutId, setPlayers);

    const unsubReports = isManagement
      ? subscribeToGlobalReports(setReports)
      : subscribeToReports(scoutId, setReports);

    const timer = setTimeout(() => setLoading(false), 2000);

    return () => {
      unsubPlayers();
      unsubReports();
      clearTimeout(timer);
    };
  }, [authReady, scoutId, isManagement]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="h-16 w-16 rounded-2xl border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">{t.dashboard.stats.syncing}</p>
      </div>
    );
  }

  // Lógica de Métricas de Captación
  const totalInDb = players.length;
  const analyzedCount = players.filter(p => reports.some(r => r.playerId === p.id)).length;
  const identifiedOnly = Math.max(0, totalInDb - analyzedCount);
  const totalReports = reports.length;
  
  const evaluatedPlayers = players.filter(p => (p.currentPIM || 0) > 0);
  const avgPim = evaluatedPlayers.length > 0 
    ? Math.round(evaluatedPlayers.reduce((acc, p) => acc + (p.currentPIM || 0), 0) / evaluatedPlayers.length)
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard title={t.dashboard.stats.detected} value={totalInDb.toString()} icon={<User className="text-primary" />} />
        <StatCard title={t.dashboard.stats.identified} value={identifiedOnly.toString()} icon={<Binoculars className="text-accent" />} />
        <StatCard title={t.dashboard.stats.analyzed} value={analyzedCount.toString()} icon={<ShieldCheck className="text-primary" />} />
        <StatCard title={t.dashboard.stats.reports} value={totalReports.toString()} icon={<ClipboardCheck className="text-accent" />} />
        <StatCard title={t.dashboard.stats.avgPim} value={avgPim.toString()} icon={<TrendingUp className="text-primary" />} />
      </div>

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
                <div key={player.id} className="p-6 flex items-center justify-between hover:bg-primary/5 transition-all cursor-pointer group" onClick={() => onEditPlayer(player.id)}>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 rounded-xl border border-primary/20 shadow-lg">
                      <AvatarFallback className="font-black text-primary bg-primary/10">{player.name[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-black text-sm uppercase group-hover:text-primary transition-colors">{player.name}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-2 font-bold"><MapPin className="h-3 v-3" /> {player.club} · <span className="text-primary uppercase">{player.tacticalRole}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[9px] font-black text-muted-foreground uppercase">PIM</p>
                      <p className="text-xl font-black text-accent">{Math.round(player.currentPIM || 0)}</p>
                    </div>
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

function StatCard({ title, value, icon, suffix = "" }: { title: string, value: string, icon: any, suffix?: string }) {
  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] p-6 hover:scale-[1.03] transition-all cursor-default group shadow-xl">
      <div className="flex justify-between items-start mb-4">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{title}</p>
        <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/10 group-hover:bg-primary/10 transition-colors">{icon}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <p className="text-5xl font-black font-headline tracking-tighter">{value}</p>
        {suffix && <span className="text-xl font-black text-primary/60">{suffix}</span>}
      </div>
    </Card>
  );
}
