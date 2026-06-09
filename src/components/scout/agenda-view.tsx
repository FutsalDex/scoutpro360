
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, MapPin, Clock, FilePlus, ChevronRight, Loader2, User, Plus, Save, X } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToScheduledMatches, getPlayer, saveScheduledMatch, subscribeToPlayers } from "@/lib/services/db-service";
import { ScheduledMatch, Player } from "@/lib/types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface AgendaViewProps {
  onStartScouting: (playerId: string) => void;
  initialPlayerId?: string | null;
  onClearScheduleContext?: () => void;
}

export function AgendaView({ onStartScouting, initialPlayerId, onClearScheduleContext }: AgendaViewProps) {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [matches, setMatches] = useState<ScheduledMatch[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newMatch, setNewMatch] = useState<Partial<ScheduledMatch>>({
    homeTeam: '',
    awayTeam: '',
    category: '',
    dateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    status: 'scheduled',
    playerId: ''
  });

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

    const unsubPlayers = subscribeToPlayers(userId, setPlayers);
    
    return () => {
      unsubMatches();
      unsubPlayers();
    };
  }, [authReady, userId]);

  useEffect(() => {
    if (initialPlayerId) {
      setNewMatch({
        homeTeam: '',
        awayTeam: '',
        category: '',
        dateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        status: 'scheduled',
        playerId: initialPlayerId
      });
      setIsCreateOpen(true);
    }
  }, [initialPlayerId]);

  const handleCreateMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !newMatch.homeTeam || !newMatch.awayTeam || !newMatch.playerId) {
      toast({ variant: "destructive", title: "Campos incompletos" });
      return;
    }

    saveScheduledMatch({
      ...newMatch as Omit<ScheduledMatch, 'id'>,
      scoutId: userId,
      status: 'scheduled'
    });

    toast({ title: t.agenda.form.success });
    setIsCreateOpen(false);
    setNewMatch({
      homeTeam: '',
      awayTeam: '',
      category: '',
      dateTime: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      status: 'scheduled',
      playerId: ''
    });
    if (onClearScheduleContext) onClearScheduleContext();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-1 w-12 bg-accent rounded-full mb-2" />
          <h1 className="text-4xl font-headline font-black text-foreground uppercase tracking-tight">
            {t.agenda.title}
          </h1>
          <p className="text-muted-foreground font-medium">{t.agenda.subtitle}</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open && onClearScheduleContext) onClearScheduleContext();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest h-12 px-8 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              <Plus className="h-4 w-4 mr-2" /> {t.agenda.newMatch}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#1b263b] border-border/40 shadow-2xl rounded-3xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Calendar className="h-5 w-5" /> {t.agenda.form.title}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateMatch} className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.agenda.form.player}</Label>
                  <Select 
                    value={newMatch.playerId} 
                    onValueChange={(v) => setNewMatch({...newMatch, playerId: v})}
                    disabled={!!initialPlayerId}
                  >
                    <SelectTrigger className="h-12 bg-secondary/20 border-border/20 rounded-xl font-bold">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1b263b] border-border/40">
                      {players.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {initialPlayerId && (
                    <p className="text-[8px] font-bold text-accent uppercase tracking-widest italic">Modo de agendamiento directo activo</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.agenda.form.homeTeam}</Label>
                    <Input 
                      value={newMatch.homeTeam} 
                      onChange={(e) => setNewMatch({...newMatch, homeTeam: e.target.value})}
                      className="h-12 bg-secondary/20 border-border/20 rounded-xl font-bold"
                      placeholder="Local"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.agenda.form.awayTeam}</Label>
                    <Input 
                      value={newMatch.awayTeam} 
                      onChange={(e) => setNewMatch({...newMatch, awayTeam: e.target.value})}
                      className="h-12 bg-secondary/20 border-border/20 rounded-xl font-bold"
                      placeholder="Visitante"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.agenda.form.dateTime}</Label>
                  <Input 
                    type="datetime-local"
                    value={newMatch.dateTime} 
                    onChange={(e) => setNewMatch({...newMatch, dateTime: e.target.value})}
                    className="h-12 bg-secondary/20 border-border/20 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t.agenda.form.category}</Label>
                  <Input 
                    placeholder="Ej: Liga Pro / Camp Nou"
                    value={newMatch.category} 
                    onChange={(e) => setNewMatch({...newMatch, category: e.target.value})}
                    className="h-12 bg-secondary/20 border-border/20 rounded-xl font-bold"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => {
                    setIsCreateOpen(false);
                    if (onClearScheduleContext) onClearScheduleContext();
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                >
                  {t.agenda.form.cancel}
                </Button>
                <Button 
                  type="submit" 
                  className="bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest px-8 rounded-xl shadow-lg shadow-primary/20"
                >
                  <Save className="h-4 w-4 mr-2" /> {t.agenda.form.submit}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
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
