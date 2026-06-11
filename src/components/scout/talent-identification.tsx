"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { User, Save, Sparkles, Calendar, Phone, Mail, Globe, Hash, Share2, Loader2, MapPin } from "lucide-react";
import { useTranslation } from '@/lib/i18n/context';
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase/config";
import { savePlayer, getPlayer } from "@/lib/services/db-service";
import { TACTICAL_ROLES } from "@/lib/types";
import { ALL_COUNTRIES } from "@/lib/data/countries";

export function TalentIdentification({ onComplete, editingPlayerId }: { onComplete: () => void, editingPlayerId: string | null }) {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [playerName, setPlayerName] = useState("");
  const [currentTeam, setCurrentTeam] = useState("");
  const [position, setPosition] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [nationality, setNationality] = useState("");
  const [dorsal, setDorsal] = useState("");
  const [socials, setSocials] = useState("");
  const [showOnMap, setShowOnMap] = useState(true);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingPlayerId) {
      setLoading(true);
      getPlayer(editingPlayerId).then(p => {
        if (p) {
          setPlayerName(p.name || "");
          setCurrentTeam(p.club || "");
          setPosition(p.tacticalRole || "");
          setBirthDate(p.birthDate || "");
          setPhone(p.phone || "");
          setEmail(p.email || "");
          setNationality(p.nationality || "");
          setDorsal(p.dorsal || "");
          setSocials(p.socials || "");
          setShowOnMap(p.showOnMap !== undefined ? p.showOnMap : true);
        }
        setLoading(false);
      });
    }
  }, [editingPlayerId]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    
    const scoutId = auth.currentUser?.uid;
    if (!scoutId) {
      toast({ variant: "destructive", title: "Error", description: "Debes iniciar sesión para registrar talento." });
      return;
    }

    if (!playerName || !currentTeam) {
      toast({ variant: "destructive", title: "Campos Requeridos", description: "Nombre y club son obligatorios." });
      return;
    }

    savePlayer({
      name: playerName,
      club: currentTeam,
      tacticalRole: position || 'mc',
      nationality: nationality || "N/A",
      age: birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : 0,
      marketValue: "€0",
      grade: 'C',
      scoutId: scoutId,
      birthDate: birthDate,
      phone: phone,
      email: email,
      dorsal: dorsal,
      socials: socials,
      showOnMap: showOnMap
    }, editingPlayerId || undefined);

    toast({ title: t.talentId.success });
    onComplete();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Cargando perfil del jugador...</p>
      </div>
    );
  }

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.playerName}</Label>
                <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" placeholder="Ej: Lamine Yamal" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.currentTeam}</Label>
                <Input value={currentTeam} onChange={(e) => setCurrentTeam(e.target.value)} className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl" placeholder="Club Actual" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.position}</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger className="h-12 bg-secondary/10 border-border/20 rounded-xl font-bold">
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
                <div className="relative">
                  <Input 
                    type="date" 
                    value={birthDate} 
                    onChange={(e) => setBirthDate(e.target.value)} 
                    className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl pl-10" 
                  />
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.phone}</Label>
                <div className="relative">
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl pl-10" placeholder="+34 600 000 000" />
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.email}</Label>
                <div className="relative">
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl pl-10" placeholder="jugador@ejemplo.com" />
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.nationality}</Label>
                <div className="relative">
                  <Select value={nationality} onValueChange={setNationality}>
                    <SelectTrigger className="h-12 bg-secondary/10 border-border/20 rounded-xl font-bold pl-10">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px] bg-[#1b263b] border-border/20">
                      {ALL_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50 z-10" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.dorsal}</Label>
                <div className="relative">
                  <Input value={dorsal} onChange={(e) => setDorsal(e.target.value)} className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl pl-10" placeholder="10" />
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.socials}</Label>
                <div className="relative">
                  <Input value={socials} onChange={(e) => setSocials(e.target.value)} className="h-12 bg-secondary/10 border-border/20 text-sm font-bold rounded-xl pl-10" placeholder="@usuario_ig / @twitter_handle" />
                  <Share2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-white tracking-widest">VISIBILIDAD CARTOGRÁFICA</p>
                  <p className="text-[9px] text-muted-foreground font-medium">¿Mostrar este prospecto en el Mapa de Talentos?</p>
                </div>
              </div>
              <Switch checked={showOnMap} onCheckedChange={setShowOnMap} />
            </div>
          </CardContent>
        </Card>

        {!editingPlayerId && (
          <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.talentId.notes}</Label>
              </div>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[120px] bg-secondary/10 border-border/20 rounded-2xl p-4 text-sm italic font-medium" placeholder="Describe brevemente el potencial observado..." />
            </CardContent>
          </Card>
        )}

        <Button type="submit" className="w-full h-16 bg-primary text-primary-foreground font-black text-sm uppercase tracking-[0.3em] rounded-3xl shadow-2xl shadow-primary/30 hover:scale-[1.02] transition-all">
          <Save className="mr-3 h-5 w-5" /> {t.talentId.submit}
        </Button>
      </form>
    </div>
  );
}