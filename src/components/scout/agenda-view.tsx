
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calendar as CalendarIcon, MapPin, Clock, FilePlus, 
  ChevronRight, Loader2, User, Plus, Save, X, 
  LayoutList, Grid3X3, ChevronLeft
} from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { subscribeToScheduledMatches, getPlayer, saveScheduledMatch, subscribeToPlayers } from "@/lib/services/db-service";
import { ScheduledMatch, Player } from "@/lib/types";
import { auth } from "@/lib/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { cn } from "@/lib/utils";
import { 
  format, startOfMonth, endOfMonth, startOfWeek, 
  endOfWeek, eachDayOfInterval, isSameDay, isSameMonth,
  addMonths, subMonths, isToday 
} from "date-fns";
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
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

  const daysGrid = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  const statuses = [
    { id: 'scheduled', label: t.agenda.status.scheduled, color: 'bg-accent' },
    { id: 'in-progress', label: t.agenda.status.inProgress, color: 'bg-primary' },
    { id: 'completed', label: t.agenda.status.completed, color: 'bg-muted-foreground' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex flex-col gap-2">
          <div className="h-1 w-12 bg-accent rounded-full mb-2" />
          <h1 className="text-4xl font-headline font-black text-foreground uppercase tracking-tight">
            {t.agenda.title}
          </h1>
          <p className="text-muted-foreground font-medium">{t.agenda.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <div className="bg-secondary/20 p-1 rounded-xl border border-border/20 flex gap-1">
            <Button 
              variant={viewMode === 'calendar' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('calendar')}
              className="h-9 px-4 text-[10px] font-black uppercase tracking-widest gap-2"
            >
              <Grid3X3 className="h-3.5 w-3.5" /> {t.agenda.calendarView}
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('list')}
              className="h-9 px-4 text-[10px] font-black uppercase tracking-widest gap-2"
            >
              <LayoutList className="h-3.5 w-3.5" /> {t.agenda.listView}
            </Button>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open && onClearScheduleContext) onClearScheduleContext();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground font-black text-xs uppercase tracking-widest h-11 px-6 rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                <Plus className="h-4 w-4 mr-2" /> {t.agenda.newMatch}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1b263b] border-border/40 shadow-2xl rounded-3xl max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" /> {t.agenda.form.title}
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
                    onClick={() => setIsCreateOpen(false)}
                    className="text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                  >
                    {t.agenda.form.cancel}
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest px-8 rounded-xl"
                  >
                    <Save className="h-4 w-4 mr-2" /> {t.agenda.form.submit}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="space-y-6 animate-in zoom-in-95 duration-500">
          <div className="flex flex-col md:flex-row items-center justify-between bg-card/40 p-4 rounded-2xl border border-border/40 backdrop-blur-md gap-4">
            <h2 className="text-xl font-black uppercase tracking-widest text-primary flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="min-w-[150px] text-center">
                {format(currentDate, 'MMMM yyyy', { locale: es }).toUpperCase()}
              </span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
               {statuses.map(s => (
                 <div key={s.id} className="flex items-center gap-2">
                    <div className={cn("h-3 w-3 rounded-sm", s.color)} />
                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">{s.label}</span>
                 </div>
               ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border-2 border-border/40 bg-card/20 overflow-hidden shadow-2xl">
            <div className="grid grid-cols-[100px_repeat(7,1fr)] bg-secondary/30 border-b border-border/20">
              <div className="p-4 border-r border-border/20 flex items-center justify-center" />
              {['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'].map(day => (
                <div key={day} className="p-4 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r border-border/10 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[100px_repeat(7,1fr)]">
              {daysGrid.map((day, idx) => {
                const dayMatches = matches.filter(m => m.dateTime && isSameDay(new Date(m.dateTime), day));
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isFirstCol = idx % 7 === 0;
                const weekNum = Math.floor(idx / 7) + 1;

                return (
                  <React.Fragment key={idx}>
                    {isFirstCol && (
                      <div className="bg-black/40 border-r border-b border-border/20 flex items-center justify-center p-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/20 rotate-[-90deg] whitespace-nowrap">{t.agenda.week.toUpperCase()} {weekNum}</span>
                      </div>
                    )}
                    <div className={cn(
                      "min-h-[140px] border-r border-b border-border/10 p-2 transition-colors",
                      !isCurrentMonth ? "bg-black/20 opacity-30" : "bg-card/5 hover:bg-white/5",
                      isToday(day) && "bg-primary/5"
                    )}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={cn(
                          "text-[11px] font-black rounded-full h-6 w-6 flex items-center justify-center transition-all",
                          isToday(day) ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground"
                        )}>
                          {format(day, 'd')}
                        </span>
                      </div>
                      
                      <div className="space-y-1.5">
                        {dayMatches.map(m => (
                          <CalendarMatchCard 
                            key={m.id} 
                            match={m} 
                            onClick={() => m.playerId && onStartScouting(m.playerId)} 
                          />
                        ))}
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {matches.length === 0 ? (
            <div className="col-span-full py-20 text-center text-muted-foreground font-black text-[10px] uppercase tracking-widest opacity-40">
              {t.agenda.noMatches}
            </div>
          ) : (
            matches.map((match) => (
              <MatchCard 
                key={match.id} 
                match={match} 
                onStartScouting={onStartScouting} 
                t={t} 
                language={language}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function CalendarMatchCard({ match, onClick }: { match: ScheduledMatch, onClick: () => void }) {
  const [playerName, setPlayerName] = useState<string>("...");

  useEffect(() => {
    if (match.playerId) {
      getPlayer(match.playerId).then(p => { if (p) setPlayerName(p.name); });
    }
  }, [match.playerId]);

  const time = match.dateTime ? format(new Date(match.dateTime), 'HH:mm') : '--:--';

  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full text-left p-2 rounded-lg border-l-4 shadow-sm transition-all hover:scale-[1.03] active:scale-95 group overflow-hidden",
        match.status === 'scheduled' ? "bg-accent/10 border-accent hover:bg-accent/20" : 
        match.status === 'in-progress' ? "bg-primary/10 border-primary hover:bg-primary/20" : 
        "bg-secondary/40 border-muted-foreground hover:bg-secondary"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[7px] font-black text-white/40 uppercase tracking-tighter">{time}</span>
        <div className="h-1.5 w-1.5 rounded-full bg-white/20 group-hover:bg-white transition-colors" />
      </div>
      <p className="text-[9px] font-black uppercase text-foreground leading-tight truncate">{match.homeTeam} v {match.awayTeam}</p>
      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1 truncate">{playerName}</p>
    </button>
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
  const isTodayMatch = isValidDate && isToday(matchDate);

  return (
    <Card className={cn(
      "border-border/40 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all group",
      isTodayMatch ? "border-accent/40 bg-accent/5 ring-1 ring-accent/20" : ""
    )}>
      <CardHeader className="bg-[#1b263b] px-6 py-4 flex flex-row items-center justify-between border-b border-border/10">
        <div className="flex items-center gap-2">
          <CalendarIcon className={cn("h-4 w-4", isTodayMatch ? "text-accent" : "text-primary")} />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">
            {isValidDate ? format(matchDate, 'dd MMM yyyy', { locale: language === 'es' ? es : undefined }) : 'TBD'}
          </span>
        </div>
        {isTodayMatch && (
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
