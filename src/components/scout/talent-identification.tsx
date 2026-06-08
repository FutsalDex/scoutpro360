"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Binoculars, User, Calendar, MapPin, Save, Loader2, Sparkles } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase/config";
import { savePlayer, saveScheduledMatch } from "@/lib/services/db-service";
import { TACTICAL_ROLES } from "@/lib/types";

export function TalentIdentification({ onComplete }: { onComplete: () => void }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form State
  const [playerName, setPlayerName] = useState("");
  const [currentTeam, setCurrentTeam] = useState("");
  const [position, setPosition] = useState("");
  const [category, setCategory] = useState("");
  const [rival, setRival] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [venue, setVenue] = useState("");
  const [notes, setNotes] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName || !currentTeam) {
      toast({ variant: "destructive", title: "Campos Requeridos", description: "El nombre y el equipo son obligatorios." });
      return;
    }

    const scoutId = auth.currentUser?.uid;
    if (!scoutId) return;

    setLoading(true);
    try {
      // 1. Create a minimal Player record
      const playerId = await savePlayer({
        name: playerName,
        club: currentTeam,
        tacticalRole: position || 'mc',
        nationality: "N/A",
        age: parseInt(category) || 0,
        marketValue: "€0",
        currentPIM: 0,
        grade: 'C',
        scoutId,
        secondaryPositions: category
      });

      // 2. Create a Scheduled Match record if date provided
      if (matchDate) {
        await saveScheduledMatch({
          playerId, // Link to the newly created player
          homeTeam: currentTeam,
          awayTeam: rival || "TBD",
          category: category || "Pro",
          dateTime: matchDate,
          scoutId,
          status: 'scheduled'
        });
      }

      toast({ title: t.talentId.success });
      onComplete();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex flex-col gap-2">
        <div className="h-1 w-12 bg-accent rounded-full mb-2" />
        <h1 className="text-4xl font-headline font-black text-foreground uppercase tracking-tight">
          {t.talentId.title}
        </h1>
        <p className="text-muted-foreground font-medium">{t.talentId.subtitle}</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* SECCIÓN JUGADOR */}
          <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-2xl">
            <CardHeader className="bg-[#1b263b] px-8 py-5 border-b border-accent/20">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-accent" />
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-white">
                  {t.talentId.playerSection}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.playerName}</Label>
                <Input 
                  value={playerName} 
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" 
                  placeholder="Ej: Lamine Yamal" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.currentTeam}</Label>
                <Input 
                  value={currentTeam} 
                  onChange={(e) => setCurrentTeam(e.target.value)}
                  className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" 
                  placeholder="Club Actual" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.position}</Label>
                  <Select value={position} onValueChange={setPosition}>
                    <SelectTrigger className="h-12 bg-secondary/10 border-border/20 rounded-xl text-xs font-bold">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1b263b] border-border/20">
                      {TACTICAL_ROLES.map(role => (
                        <SelectItem key={role.id} value={role.id}>{t.report.tacticalRoles[role.id as keyof typeof t.report.tacticalRoles] || role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.category}</Label>
                  <Input 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" 
                    placeholder="U19 / 2007" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECCIÓN PARTIDO */}
          <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-2xl">
            <CardHeader className="bg-[#1b263b] px-8 py-5 border-b border-primary/20">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-white">
                  {t.talentId.matchSection}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.matchDate}</Label>
                <Input 
                  type="date" 
                  value={matchDate} 
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.rival}</Label>
                <Input 
                  value={rival} 
                  onChange={(e) => setRival(e.target.value)}
                  className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" 
                  placeholder="Equipo Rival" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.venue}</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={venue} 
                    onChange={(e) => setVenue(e.target.value)}
                    className="h-12 pl-10 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" 
                    placeholder="Estadio o Ciudad" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* NOTAS Y ACCIÓN */}
        <div className="space-y-6">
          <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.notes}</Label>
              </div>
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px] bg-secondary/10 border-border/20 rounded-2xl p-4 text-sm italic font-medium" 
                placeholder="Describe brevemente por qué es un talento de interés..." 
              />
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-16 bg-primary text-primary-foreground font-black text-sm uppercase tracking-[0.3em] rounded-3xl shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all"
          >
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="mr-3 h-5 w-5" /> {t.talentId.submit}</>}
          </Button>
        </div>
      </form>
    </div>
  );
}