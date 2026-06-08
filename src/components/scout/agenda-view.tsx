
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, FilePlus, ChevronRight, Loader2, User } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToScheduledMatches, getPlayer } from "@/lib/services/db-service";
import { ScheduledMatch, Player } from "@/lib/types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AgendaViewProps {
  onStartScouting: (playerId: string) => void;
}

export function AgendaView({ onStartScouting }: AgendaViewProps) {
  const { t, language } = useTranslation();
  const [matches, setMatches] = useState<ScheduledMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
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
    
    const unsubMatches = subscribeToScheduledMatches(userId, (data) => {
      const sorted = [...data].sort((a, b) => {
        const dateA = a.dateTime ? new Date(a.dateTime).getTime() : 0;
        const dateB = b.dateTime ? new Date(b.dateTime).getTime() : 0;
        return dateA - dateB;
      });
      setMatches(sorted);
      setLoading(false);
    });
    
    return () => unsubMatches();
  }, [authReady, userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col gap-2">
        <div className="h-1 w-12 bg-accent rounded-full mb-2" />
        <h1 className="text-4xl font-headline font-black text-foreground uppercase tracking-tight">
          {t.agenda.title}
        </h1>
        <p className="text-muted-foreground font-medium">{t.agenda.subtitle}</p>
      </div>

      {matches.length === 0 ? (
        <Card className="border-dashed border-2 border-border/40 bg-card/20 rounded-3xl">
          <CardContent className="p-20 text-center space-y-4 opacity-40">
            <div className="h-16 w-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              {t.agenda.noMatches}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {matches.map((match) => (
            <MatchCard 
              key={match.id} 
              match={match} 
              onStartScouting={onStartScouting} 
              t={t} 
              language={language}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, onStartScouting, t, language }: { match: ScheduledMatch, onStartScouting: (id: string) => void, t: any, language: string }) {
  const [playerName, setPlayerName] = useState<string>("...");

  useEffect(() => {
    if (match.playerId) {
      getPlayer(match.playerId).then(p => {
        if (p) setPlayerName(p.name);
      });
    }
  }, [match.playerId]);

  const isValidDate = match.dateTime && !isNaN(new Date(match.dateTime).getTime());
  const matchDate = isValidDate ? new Date(match.dateTime) : new Date();
  const isToday = isValidDate && new Date().toDateString() === matchDate.toDateString();

  return (
    <Card className={cn(
      "border-border/40 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all group",
      isToday ? "border-accent/40 bg-accent/5 ring-1 ring-accent/20" : ""
    )}>
      <CardHeader className="bg-[#1b263b] px-6 py-4 flex flex-row items-center justify-between border-b border-border/10">
        <div className="flex items-center gap-2">
          <Calendar className={cn("h-4 w-4", isToday ? "text-accent" : "text-primary")} />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">
            {isValidDate ? format(matchDate, 'dd MMM yyyy', { locale: language === 'es' ? es : undefined }) : 'TBD'}
          </span>
        </div>
        {isToday && (
          <Badge className="bg-accent text-accent-foreground text-[8px] font-black uppercase tracking-tighter animate-pulse">
            HOY / TODAY
          </Badge>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.agenda.matchDetails}</p>
              <h3 className="text-lg font-black uppercase tracking-tight text-foreground leading-tight">
                {match.homeTeam} <span className="text-primary italic mx-1">vs</span> {match.awayTeam}
              </h3>
            </div>
            {/* Opcional: Mostrar categoría arriba si es necesario, pero el usuario pidió el campo abajo */}
          </div>

          <div className="p-4 bg-secondary/20 rounded-2xl border border-border/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-0.5">
                <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">OBJETIVO / TARGET</p>
                <p className="text-xs font-black uppercase tracking-tight">{playerName}</p>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-bold text-muted-foreground">{isValidDate ? format(matchDate, 'HH:mm') : '--:--'}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/5 overflow-hidden">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-[10px] font-bold text-muted-foreground truncate">
              {match.category || 'Estadio / Stadium'}
            </span>
          </div>
        </div>

        <Button 
          onClick={() => match.playerId && onStartScouting(match.playerId)}
          disabled={!match.playerId}
          className="w-full h-12 bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
        >
          <FilePlus className="mr-2 h-4 w-4" /> {t.agenda.startScouting}
        </Button>
      </CardContent>
    </Card>
  );
}
