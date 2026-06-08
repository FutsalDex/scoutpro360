"use client"
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Loader2, Calendar } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToPlayers, subscribeToReports, subscribeToScheduledMatches } from "@/lib/services/db-service";
import { Player, ScoutingReport, ScheduledMatch } from "@/lib/types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { cn } from "@/lib/utils";

interface GlobalDatabaseProps {
  onEditPlayer: (id: string) => void;
}

export function GlobalDatabase({ onEditPlayer }: GlobalDatabaseProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [matches, setMatches] = useState<ScheduledMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try { 
          await user.getIdToken(true); 
        } catch (_) {}
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
      setAuthReady(!!user);
      if (!user) setLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authReady || !userId) return;
    
    const unsubPlayers = subscribeToPlayers(userId, setPlayers);
    const unsubReports = subscribeToReports(userId, setReports);
    const unsubMatches = subscribeToScheduledMatches(userId, setMatches);
    
    const timer = setTimeout(() => setLoading(false), 3000);
    
    return () => {
      unsubPlayers();
      unsubReports();
      unsubMatches();
      clearTimeout(timer);
    };
  }, [authReady, userId]);

  useEffect(() => {
    if (players.length > 0) setLoading(false);
  }, [players]);

  const filteredPlayers = players.filter(p => {
    const search = searchTerm.toLowerCase();
    const name = (p.name || "").toLowerCase();
    const club = (p.club || "").toLowerCase();
    const nationality = (p.nationality || "").toLowerCase();
    
    return name.includes(search) || club.includes(search) || nationality.includes(search);
  });

  const getPlayerStatus = (player: Player) => {
    const hasReport = reports.some(r => r.playerId === player.id);
    if (hasReport) return 'analizado';
    
    const isScheduled = matches.some(m => m.playerId === player.id && m.status === 'scheduled');
    if (isScheduled) return 'agendado';
    
    return 'detectado';
  };

  const statusColors: Record<string, string> = {
    analizado: "bg-primary/20 text-primary border-primary/30",
    agendado: "bg-accent/20 text-accent border-accent/30",
    detectado: "bg-muted-foreground/20 text-muted-foreground border-muted-foreground/30"
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12 overflow-hidden px-1">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-headline font-black text-foreground uppercase tracking-tight">{t.database.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t.database.subtitle}</p>
        </div>
        <Button variant="outline" className="border-primary/30 text-primary font-black text-[10px] uppercase tracking-widest h-10 rounded-xl">
          <Download className="h-4 w-4 mr-2" /> {t.database.export}
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.database.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 bg-card/40 border-border/40 rounded-2xl"
        />
      </div>
      <Card className="border-border/40 bg-card/40 backdrop-blur-sm rounded-2xl overflow-hidden shadow-xl">
        <CardContent className="p-0">
          {filteredPlayers.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-xs uppercase tracking-widest opacity-50">
              {t.database.noRecords}
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {filteredPlayers.map(player => {
                const status = getPlayerStatus(player);
                const birthYear = player.birthDate ? new Date(player.birthDate).getFullYear() : (player.secondaryPositions && /^\d{4}$/.test(player.secondaryPositions) ? player.secondaryPositions : null);

                return (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-5 hover:bg-secondary/20 transition-all cursor-pointer group"
                    onClick={() => onEditPlayer(player.id)}
                  >
                    <div className="flex items-center gap-5">
                      <Avatar className="h-12 w-12 rounded-xl border border-primary/20 group-hover:scale-105 transition-transform shadow-lg">
                        <AvatarFallback className="font-black text-primary bg-primary/10 text-sm">
                          {player.name ? player.name[0].toUpperCase() : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="space-y-1">
                        <p className="font-black text-sm uppercase tracking-tight group-hover:text-primary transition-colors">{player.name || 'Sin nombre'}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {player.club || 'Sin club'} · {player.nationality || 'N/A'}
                            {birthYear && ` · ${t.database.birthYear} ${birthYear}`}
                          </p>
                          <Badge variant="outline" className={cn("px-2 py-0 h-4 text-[8px] font-black uppercase tracking-widest", statusColors[status])}>
                            {t.database.status[status as keyof typeof t.database.status]}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black">PIM</p>
                        <p className="text-xl font-black text-accent">{player.currentPIM || 0}</p>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center font-black text-primary border border-primary/30 shadow-sm">
                        {player.grade || 'C'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}