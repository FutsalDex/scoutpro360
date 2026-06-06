"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  TrendingUp, 
  Users, 
  ClipboardCheck, 
  ArrowUpRight, 
  Plus, 
  Calendar, 
  Mic, 
  FolderHeart, 
  Play, 
  StickyNote, 
  Link2, 
  Trash2,
  Loader2
} from "lucide-react";
import { Player, PlayerList, ScheduledMatch, QuickNote } from "@/lib/types";
import { useTranslation } from '@/lib/i18n/context';
import { 
  subscribeToPlayers, 
  subscribeToPlayerLists, 
  subscribeToScheduledMatches, 
  subscribeToQuickNotes,
  createPlayerList,
  createQuickNote,
  deleteQuickNote
} from "@/lib/services/db-service";
import { auth } from "@/lib/firebase/config";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ScoutDashboardProps {
  onEditPlayer: (id: string) => void;
}

export function ScoutDashboard({ onEditPlayer }: ScoutDashboardProps) {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Player[]>([]);
  const [playerLists, setPlayerLists] = useState<PlayerList[]>([]);
  const [matches, setMatches] = useState<ScheduledMatch[]>([]);
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  
  const [newListName, setNewListName] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  
  const currentUser = auth.currentUser;
  const scoutId = currentUser?.uid;

  useEffect(() => {
    // Solo suscribirse si hay un usuario autenticado real (evita errores de permisos con "guest")
    if (!scoutId) return;

    const unsubPlayers = subscribeToPlayers(setPlayers);
    const unsubLists = subscribeToPlayerLists(scoutId, setPlayerLists);
    const unsubMatches = subscribeToScheduledMatches(scoutId, setMatches);
    const unsubNotes = subscribeToQuickNotes(scoutId, (data) => {
      setNotes(data);
      setLoading(false);
    });

    return () => {
      unsubPlayers();
      unsubLists();
      unsubMatches();
      unsubNotes();
    };
  }, [scoutId]);

  const avgPim = players.length > 0 
    ? (players.reduce((acc, p) => acc + p.currentPIM, 0) / players.length).toFixed(1) 
    : "0.0";
  const recruitedCount = players.filter(p => p.grade === 'A' || p.currentPIM > 85).length;

  const handleAddList = async () => {
    if (!newListName || !scoutId) return;
    await createPlayerList(newListName, scoutId);
    setNewListName("");
  };

  const handleAddNote = async () => {
    if (!newNoteText || !scoutId) return;
    await createQuickNote(newNoteText, scoutId);
    setNewNoteText("");
  };

  const simulateVoiceNote = async () => {
    if (!scoutId) return;
    setIsRecording(true);
    setTimeout(async () => {
      await createQuickNote("Observación de voz: El central zurdo del equipo local tiene muy buena salida de balón, seguir en el próximo partido.", scoutId, 'voice');
      setIsRecording(false);
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-32 w-full max-w-full overflow-x-hidden animate-in fade-in duration-500">
      
      {/* 1. BLOC DE NOTAS RÁPIDAS (INBOX) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest">{t.dashboard.quickNotes.title}</h2>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest text-primary">
                <Plus className="h-3 w-3 mr-1" /> {t.dashboard.quickNotes.add}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50">
              <DialogHeader><DialogTitle>{t.dashboard.quickNotes.add}</DialogTitle></DialogHeader>
              <div className="py-4 space-y-4">
                <Input 
                  placeholder={t.dashboard.quickNotes.placeholder} 
                  value={newNoteText} 
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="bg-secondary/10"
                />
                <Button onClick={handleAddNote} className="w-full bg-primary text-primary-foreground font-black uppercase tracking-widest">{t.dashboard.quickNotes.save}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.filter(n => !n.assignedPlayerId).map(note => (
            <Card key={note.id} className="bg-primary/5 border-primary/20 border-l-4 border-l-primary shadow-lg group hover:scale-[1.02] transition-transform">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <Badge className="bg-primary/20 text-primary text-[8px] font-black tracking-tighter uppercase px-2 py-0">
                    {note.type === 'voice' ? '🎙️ Audio' : '📝 Texto'}
                  </Badge>
                  <button onClick={() => deleteQuickNote(note.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <p className="text-xs font-medium italic text-foreground leading-relaxed line-clamp-3">"{note.content}"</p>
                <div className="pt-2 flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-[8px] font-black uppercase tracking-widest flex-1 border-primary/30 text-primary hover:bg-primary/10">
                    <Link2 className="h-2 w-2 mr-1" /> {t.dashboard.quickNotes.assign}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {notes.filter(n => !n.assignedPlayerId).length === 0 && (
            <div className="col-span-full py-8 text-center border-2 border-dashed border-border/20 rounded-2xl">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.dashboard.quickNotes.empty}</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. KPIs PRINCIPALES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatsCard title={t.dashboard.stats.totalPlayers} value={loading ? "..." : players.length.toString()} icon={<Users className="text-primary" />} subtitle={t.dashboard.stats.realData} />
        <StatsCard title={t.dashboard.stats.avgPim} value={loading ? "..." : avgPim} icon={<TrendingUp className="text-primary" />} subtitle={t.dashboard.stats.realAvg} />
        <StatsCard title={t.dashboard.stats.recruitmentStatus} value={t.dashboard.stats.active} icon={<ArrowUpRight className="text-accent" />} subtitle={t.dashboard.stats.season} accent />
        <StatsCard title={t.dashboard.stats.recruited} value={loading ? "..." : recruitedCount.toString()} icon={<ClipboardCheck className="text-accent" />} subtitle={t.dashboard.stats.q1Progress} />
      </div>

      {/* 3. MI CARTERA DE TALENTO (LISTAS PERSONALIZADAS) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderHeart className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest">{t.dashboard.portfolio.title}</h2>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="icon" className="h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:scale-110 transition-transform">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50">
              <DialogHeader><DialogTitle>{t.dashboard.portfolio.create}</DialogTitle></DialogHeader>
              <div className="py-4 space-y-4">
                <Input 
                  placeholder={t.dashboard.portfolio.namePlaceholder} 
                  value={newListName} 
                  onChange={(e) => setNewListName(e.target.value)}
                  className="bg-secondary/10"
                />
                <Button onClick={handleAddList} className="w-full bg-primary text-primary-foreground font-black uppercase tracking-widest">{t.dashboard.portfolio.createBtn}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          {playerLists.map(list => (
            <Card key={list.id} className="min-w-[200px] bg-secondary/20 border-border/40 hover:border-primary/50 transition-all cursor-pointer group shadow-xl">
              <CardContent className="p-6 space-y-4">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform">
                  <FolderHeart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-foreground uppercase tracking-tight truncate">{list.name}</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{list.playerIds.length} {t.dashboard.portfolio.players}</p>
                </div>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-6 w-6 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-[8px] font-bold">
                      {String.fromCharCode(64 + i)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
          {playerLists.length === 0 && (
            <div className="flex-1 py-10 text-center bg-secondary/10 rounded-2xl border-2 border-dashed border-border/20">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.dashboard.portfolio.empty}</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. MI AGENDA DE PARTIDOS (PROGRAMADOR) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-accent" />
          <h2 className="text-sm font-black uppercase tracking-widest">{t.dashboard.agenda.title}</h2>
        </div>
        <Card className="bg-card/40 border-border/40 backdrop-blur-sm shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="p-6 border-b border-border/10 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest">{t.dashboard.agenda.subtitle}</CardTitle>
            </div>
            <Button variant="outline" size="sm" className="text-[10px] font-black uppercase tracking-widest border-accent/30 text-accent">
              <Plus className="h-3 w-3 mr-1" /> {t.dashboard.agenda.addMatch}
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/10">
              {matches.length > 0 ? matches.map(match => (
                <div key={match.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group hover:bg-secondary/20 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-accent/20 flex flex-col items-center justify-center shrink-0 border border-accent/30">
                      <span className="text-[8px] font-black text-accent uppercase">{match.dateTime?.seconds ? new Date(match.dateTime.seconds * 1000).toLocaleString('es', { month: 'short' }) : 'OCT'}</span>
                      <span className="text-lg font-black text-foreground">{match.dateTime?.seconds ? new Date(match.dateTime.seconds * 1000).getDate() : '24'}</span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm sm:text-lg text-foreground uppercase tracking-tight">{match.homeTeam} VS {match.awayTeam}</h4>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{match.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="text-right hidden sm:block mr-4">
                      <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">{t.dashboard.agenda.time}</p>
                      <p className="text-sm font-black text-foreground">16:30</p>
                    </div>
                    <Button 
                      className="w-full sm:w-auto bg-[#ffcc00] text-black hover:bg-[#e6b800] font-black text-[10px] uppercase tracking-widest px-6 h-10 shadow-lg shadow-yellow-500/20"
                    >
                      <Play className="h-4 w-4 mr-2 fill-black" /> {t.dashboard.agenda.startAnalysis}
                    </Button>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-muted-foreground italic text-xs uppercase tracking-widest opacity-50">
                  {t.dashboard.agenda.empty}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 5. TOP TARGETS (SECCIÓN ORIGINAL) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest">{t.dashboard.topTargets}</h2>
          </div>
        </div>
        <Card className="border-border/40 bg-card/40 backdrop-blur-sm shadow-2xl overflow-hidden rounded-2xl">
          <CardContent className="p-0">
            <div className="divide-y divide-border/20">
              {players.slice(0, 5).map(player => (
                <div key={player.id} className="flex items-center justify-between p-4 sm:p-6 hover:bg-secondary/30 transition-colors cursor-pointer group" onClick={() => onEditPlayer(player.id)}>
                  <div className="flex items-center gap-3 sm:gap-6 overflow-hidden flex-1 min-w-0">
                    <Avatar className="h-10 w-10 sm:h-14 sm:w-14 rounded-2xl border-2 border-primary/20 bg-background shrink-0 shadow-lg">
                      <AvatarImage src={`https://picsum.photos/seed/${player.id}/100`} />
                      <AvatarFallback className="font-bold">{player.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 sm:space-y-1 min-w-0 overflow-hidden">
                      <p className="font-black text-sm sm:text-lg text-foreground truncate uppercase tracking-tight">{player.name}</p>
                      <div className="flex items-center gap-2 truncate">
                        <Badge variant="outline" className="text-[7px] sm:text-[9px] h-4 sm:h-5 py-0 font-black bg-primary/10 text-primary border-primary/30 uppercase tracking-tighter">
                          {t.report.tacticalRoles[player.tacticalRole as keyof typeof t.report.tacticalRoles] || player.tacticalRole}
                        </Badge>
                        <span className="text-[9px] sm:text-xs text-muted-foreground font-medium truncate">{player.club}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-8 shrink-0 ml-2">
                    <div className="text-right">
                      <p className="text-[7px] sm:text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-black leading-none mb-1">PIM</p>
                      <p className="text-sm sm:text-2xl font-headline font-black text-accent">{player.currentPIM}</p>
                    </div>
                    <div className="h-9 w-9 sm:h-14 sm:w-14 rounded-xl bg-primary/20 flex items-center justify-center font-black text-primary text-sm sm:text-2xl border border-primary/30 group-hover:scale-105 transition-transform shadow-lg">
                      {player.grade}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 6. BOTÓN FLOTANTE (FAB) PARA NOTA DE VOZ */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
        {isRecording && (
          <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl animate-bounce flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin" /> {t.dashboard.quickNotes.recording}
          </div>
        )}
        <Button 
          onClick={simulateVoiceNote} 
          disabled={isRecording || !scoutId}
          className={cn(
            "h-16 w-16 rounded-full shadow-[0_10px_30px_rgba(224,176,80,0.5)] flex items-center justify-center transition-all hover:scale-110 active:scale-95",
            isRecording ? "bg-red-500 animate-pulse" : "bg-primary"
          )}
        >
          <Mic className={cn("h-7 w-7 text-primary-foreground", isRecording && "animate-pulse")} />
        </Button>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, subtitle, accent }: { title: string, value: string, icon: React.ReactNode, subtitle: string, accent?: boolean }) {
  return (
    <Card className="border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/40 transition-all group overflow-hidden relative rounded-2xl p-4 sm:p-6 shadow-xl w-full">
      <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all pointer-events-none">
        {React.cloneElement(icon as React.ReactElement, { size: 24 })}
      </div>
      <div className="space-y-3 sm:space-y-4">
        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mr-8">{title}</p>
        <div className="flex flex-col gap-1">
          <p className="text-xl sm:text-4xl font-black font-headline tracking-tight text-foreground">{value}</p>
          <p className="text-[9px] sm:text-[10px] font-bold text-accent uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}