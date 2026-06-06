"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { User, ShieldCheck, ClipboardCheck, Loader2 } from "lucide-react";
import { UserProfile, Player, ScoutingReport } from "@/lib/types";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers, subscribeToReports } from "@/lib/services/db-service";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/config";

interface ScoutDashboardProps {
  userProfile: UserProfile | null;
  onEditPlayer: (id: string) => void;
}

export function ScoutDashboard({ userProfile }: ScoutDashboardProps) {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Player[]>([]);
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoutId, setScoutId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setScoutId(user?.uid ?? null);
      setAuthReady(true);
      if (!user) setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authReady || !scoutId) return;

    const unsubPlayers = subscribeToPlayers((data) => {
      setPlayers(data);
    });

    const unsubReports = subscribeToReports(scoutId, (data) => {
      setReports(data);
      setLoading(false);
    });

    return () => {
      unsubPlayers();
      unsubReports();
    };
  }, [authReady, scoutId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">
          {t.dashboard.stats.syncing}
        </p>
      </div>
    );
  }

  const evaluatedPlayersCount = players.filter(p => p.currentPIM > 0).length;
  const pendingPlayersCount = players.filter(p => p.currentPIM === 0).length;
  const reportsCount = reports.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-headline font-black text-foreground uppercase tracking-tight">
          {t.dashboard.title}
        </h1>
        <p className="text-muted-foreground">{t.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardStatCard 
          title={t.dashboard.stats.pending}
          value={pendingPlayersCount.toString()}
          icon={<User className="text-primary" />}
          description="Esperando evaluación"
          color="border-primary/20"
        />

        <DashboardStatCard 
          title={t.dashboard.stats.evaluated}
          value={evaluatedPlayersCount.toString()}
          icon={<ShieldCheck className="text-accent" />}
          description="Puntuación PIM asignada"
          color="border-accent/20"
        />

        <DashboardStatCard 
          title={t.dashboard.stats.reports}
          value={reportsCount.toString()}
          icon={<ClipboardCheck className="text-primary" />}
          description="Informes 360 completados"
          color="border-primary/20"
        />
      </div>
    </div>
  );
}

function DashboardStatCard({ 
  title, 
  value, 
  icon, 
  description, 
  color 
}: { 
  title: string, 
  value: string, 
  icon: React.ReactNode, 
  description: string,
  color: string
}) {
  return (
    <Card className={`border-2 ${color} bg-card/40 backdrop-blur-md rounded-2xl overflow-hidden hover:scale-[1.02] transition-transform cursor-default group`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-primary transition-colors">
            {title}
          </p>
          <div className="h-10 w-10 rounded-xl bg-secondary/50 flex items-center justify-center border border-border/10">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          <p className="text-5xl font-black font-headline text-foreground">{value}</p>
          <p className="text-[10px] font-medium italic text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}