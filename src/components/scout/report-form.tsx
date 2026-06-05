"use client"

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TacticalCanvas } from "./tactical-canvas";
import { FileText, ChevronRight, ChevronLeft, Activity, User, Target, Shield, Zap as ZapIcon, Heart, Save, Star, Plus, Loader2, Sun, Cloud, CloudRain, Snowflake, Wind } from "lucide-react";
import { TACTICAL_ROLES, type TacticalRoleConfig, type KPISection, type UserProfile, type Player, type ScoutingReport, type Point } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n/context';
import { cn } from "@/lib/utils";
import { savePlayer, saveReport, getPlayer, getLatestReportForPlayer } from "@/lib/services/db-service";
import { auth } from "@/lib/firebase/config";
import { ALL_COUNTRIES } from "@/lib/data/countries";
import { serverTimestamp } from "firebase/firestore";

interface ReportFormProps {
  userProfile: UserProfile | null;
  editingPlayerId: string | null;
}

const RatingRow = ({ 
  kpi, 
  rating, 
  onRatingChange, 
  note, 
  onNoteChange 
}: { 
  kpi: string, 
  rating?: number, 
  onRatingChange: (value: number) => void,
  note?: string,
  onNoteChange: (value: string) => void
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-b border-border/10 last:border-0 group px-4 sm:px-6">
    <Label className="text-[11px] font-medium text-foreground sm:w-48 shrink-0">{kpi}</Label>
    <div className="flex items-center gap-4 flex-1">
      <div className="flex gap-1 shrink-0">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onRatingChange(num)}
            className={cn(
              "h-7 w-7 rounded-full border border-border/40 text-[10px] font-bold flex items-center justify-center transition-all",
              rating === num ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-white/5 hover:border-primary/50 text-muted-foreground"
            )}
          >
            {num}
          </button>
        ))}
      </div>
      <Input 
        className="h-8 text-[11px] bg-secondary/10 border-none shadow-none focus-visible:ring-1 border-b border-border/20 rounded-md italic placeholder:opacity-40 flex-1" 
        placeholder="Nota..." 
        value={note || ""}
        onChange={(e) => onNoteChange(e.target.value)}
      />
    </div>
  </div>
);

const EvaluationModule = ({ 
  icon: Icon, 
  kpiSection, 
  nextTab, 
  prevTab, 
  tabType,
  ratings,
  onRatingChange,
  notes,
  onNoteChange,
  setActiveTab,
  t
}: { 
  icon: any, 
  kpiSection: KPISection, 
  nextTab: string, 
  prevTab: string, 
  tabType: string,
  ratings: Record<string, number>,
  onRatingChange: (kpi: string, val: number) => void,
  notes: Record<string, string>,
  onNoteChange: (kpi: string, val: string) => void,
  setActiveTab: (tab: string) => void,
  t: any
}) => {
  const hasImpactColumn = tabType === 'technical';
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col gap-6">
        <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
          <div className="bg-[#1b263b] px-4 sm:px-5 py-3 flex items-center gap-2 border-b border-primary/20">
            <Icon className="h-4 w-4 text-primary" />
            <h2 className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider">{t.report.sections[`${tabType}_obs`]}</h2>
          </div>
          <CardContent className="p-0">
            {kpiSection.observation.map(kpi => (
              <RatingRow 
                key={kpi} 
                kpi={kpi} 
                rating={ratings[kpi]} 
                onRatingChange={(val) => onRatingChange(kpi, val)}
                note={notes[kpi]}
                onNoteChange={(val) => onNoteChange(kpi, val)}
              />
            ))}
          </CardContent>
        </Card>

        {hasImpactColumn && (
          <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-4 sm:px-5 py-3 flex items-center gap-2 border-b border-accent/20">
              <Activity className="h-4 w-4 text-accent" />
              <h2 className="text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wider">{t.report.sections[`${tabType}_impact`]}</h2>
            </div>
            <CardContent className="p-0">
              {kpiSection.impact.map(kpi => (
                <RatingRow 
                  key={kpi} 
                  kpi={kpi} 
                  rating={ratings[kpi]} 
                  onRatingChange={(val) => onRatingChange(kpi, val)}
                  note={notes[kpi]}
                  onNoteChange={(val) => onNoteChange(kpi, val)}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex justify-between gap-4 pt-10">
        <Button variant="ghost" onClick={() => setActiveTab(prevTab)} className="px-10 py-6 font-bold text-[11px] uppercase text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-3 h-4 w-4" /> {t.report.actions.previous}
        </Button>
        <Button onClick={() => setActiveTab(nextTab)} className="px-16 py-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-2xl rounded-xl text-[13px] transition-all transform hover:scale-105">
          {t.report.actions.next} <ChevronRight className="ml-3 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export function ReportForm({ userProfile, editingPlayerId }: ReportFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState("player");
  const [activeRole, setActiveRole] = useState<TacticalRoleConfig>(TACTICAL_ROLES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);

  // Pitch State
  const [pitchMarker, setPitchMarker] = useState<Point>({ x: 200, y: 300 });
  const [heatmapPoints, setHeatmapPoints] = useState<Point[]>([]);

  // Form states
  const [playerName, setPlayerName] = useState("");
  const [dorsal, setDorsal] = useState("");
  const [clubName, setClubName] = useState("");
  const [rivalName, setRivalName] = useState("");
  const [competition, setCompetition] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [nationality, setNationality] = useState("");
  const [marketValue, setMarketValue] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [minPlayed, setMinPlayed] = useState("90");
  const [secondaryPositions, setSecondaryPositions] = useState("");
  const [dominantFoot, setDominantFoot] = useState("");
  const [physicalCondition, setPhysicalCondition] = useState("");
  const [scoutName, setScoutName] = useState("");

  useEffect(() => {
    if (editingPlayerId) {
      const loadData = async () => {
        const player = await getPlayer(editingPlayerId);
        const report = await getLatestReportForPlayer(editingPlayerId);

        if (player) {
          setPlayerName(player.name || "");
          setClubName(player.club || "");
          setNationality(player.nationality || "");
          setMarketValue(player.marketValue || "");
          setBirthDate(player.birthDate || "");
          setHeight(player.height || "");
          setWeight(player.weight || "");
          setDominantFoot(player.dominantFoot || "");
          setSecondaryPositions(player.secondaryPositions || "");
          setActiveRole(TACTICAL_ROLES.find(r => r.name === player.tacticalRole) || TACTICAL_ROLES[0]);
        }

        if (report) {
          setReportId(report.id || null);
          setDorsal(report.dorsal || "");
          setRivalName(report.rivalName || "");
          setCompetition(report.competition || "");
          setMatchDate(report.matchDate || "");
          setMinPlayed(report.minPlayed || "90");
          setPhysicalCondition(report.physicalCondition || "");
          setSelectedRoles(report.selectedRoles || []);
          setRatings(report.ratings || {});
          setNotes(report.notes || {});
          setScoutName(report.scoutName || "");
          if (report.pitchPosition) setPitchMarker(report.pitchPosition);
          if (report.heatmapPoints) setHeatmapPoints(report.heatmapPoints);
        }
      };
      loadData();
    }
  }, [editingPlayerId]);

  useEffect(() => {
    if (!editingPlayerId) {
      if (userProfile?.displayName) {
        setScoutName(userProfile.displayName);
      } else if (userProfile?.email) {
        setScoutName(userProfile.email.split('@')[0]);
      }
    }
  }, [userProfile, editingPlayerId]);

  const handleRatingChange = (kpi: string, value: number) => {
    setRatings(prev => ({ ...prev, [kpi]: value }));
  };

  const handleNoteChange = (kpi: string, value: string) => {
    setNotes(prev => ({ ...prev, [kpi]: value }));
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const toggleArrayNote = (key: string, value: string) => {
    const current = notes[key] ? JSON.parse(notes[key]) : [];
    const updated = current.includes(value) 
      ? current.filter((v: string) => v !== value) 
      : [...current, value];
    handleNoteChange(key, JSON.stringify(updated));
  };

  const isSelectedInNote = (key: string, value: string) => {
    if (!notes[key]) return false;
    try {
      const current = JSON.parse(notes[key]);
      return Array.isArray(current) && current.includes(value);
    } catch {
      return false;
    }
  };

  const handleSaveAll = async () => {
    if (!playerName) {
      toast({ variant: "destructive", title: "Nombre requerido", description: "Debes introducir el nombre del jugador." });
      setActiveTab("player");
      return;
    }

    setIsSaving(true);
    try {
      const playerId = await savePlayer({
        name: playerName,
        age: birthDate ? new Date().getFullYear() - new Date(birthDate).getFullYear() : 0,
        club: clubName || "Sin club",
        nationality: nationality || "Desconocida",
        marketValue: marketValue || "€0",
        currentPIM: ratings['pim'] || 0,
        tacticalRole: activeRole.name,
        grade: 'C',
        birthDate,
        height,
        weight,
        dominantFoot,
        secondaryPositions
      }, editingPlayerId || undefined);

      await saveReport({
        playerId,
        playerName,
        scoutId: auth.currentUser?.uid || "guest",
        scoutName: scoutName || "Invitado",
        pimScore: ratings['pim'] || 0,
        summary: notes['summary'] || "",
        ratings: ratings,
        notes: notes,
        dorsal,
        rivalName,
        competition,
        matchDate,
        minPlayed,
        physicalCondition,
        selectedRoles,
        pitchPosition: pitchMarker,
        heatmapPoints: heatmapPoints,
        createdAt: serverTimestamp()
      }, reportId || undefined);

      toast({ title: "¡Éxito!", description: "El informe ha sido guardado correctamente." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar" });
    } finally {
      setIsSaving(false);
    }
  };

  const WeatherIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'Sol': case 'Sun': return <Sun className="h-3 w-3" />;
      case 'Nublado': case 'Cloudy': return <Cloud className="h-3 w-3" />;
      case 'Lluvia': case 'Rain': return <CloudRain className="h-3 w-3" />;
      case 'Frío': case 'Cold': return <Snowflake className="h-3 w-3" />;
      case 'Viento': case 'Wind': return <Wind className="h-3 w-3" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-32 max-w-[1400px] mx-auto w-full px-1">
      <div className="flex flex-col gap-4 bg-card/80 backdrop-blur-xl p-4 sm:p-8 rounded-2xl border border-border/50 shadow-2xl sticky top-20 z-40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
              <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <h1 className="text-xl sm:text-3xl font-black font-headline uppercase tracking-tight text-foreground leading-tight">
                {editingPlayerId ? `EDITANDO: ${playerName}` : t.report.title}
              </h1>
              <p className="text-[9px] sm:text-[11px] text-primary font-bold uppercase tracking-[0.25em]">{t.report.subtitle}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none h-10 px-3 bg-background/50 text-[10px] font-bold border-border/50 uppercase tracking-widest"
              onClick={handleSaveAll}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Save className="h-3.5 w-3.5 mr-1.5" />}
              {t.report.actions.save}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex bg-secondary/15 h-auto p-1.5 border border-border/20 rounded-2xl mb-8 shadow-inner flex-wrap justify-center">
          {Object.entries(t.report.tabs).map(([key, label], idx) => (
            <TabsTrigger 
              key={key} 
              value={key} 
              className="flex-none sm:flex-1 text-[9px] sm:text-[11px] font-black tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-lg h-11 border border-transparent m-1 px-4"
            >
              <span className="mr-1.5 opacity-40 font-code">{idx + 1}</span>
              {label as string}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="player" className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* 1 INFORMACIÓN DEL JUGADOR */}
            <div className="h-full">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md h-full flex flex-col">
                <div className="bg-[#007b83] px-4 py-3 flex items-center gap-3 border-b border-white/10 shrink-0">
                  <User className="h-4 w-4 text-white" />
                  <h2 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-[0.15em]">1 {t.report.playerInfo.title}</h2>
                </div>
                <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 sm:px-6 flex-1 overflow-auto pb-6">
                  <div className="col-span-1 sm:col-span-2 space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.name}</Label>
                    <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-sm" placeholder="Nombres del jugador" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.dorsal}</Label>
                    <Input value={dorsal} onChange={(e) => setDorsal(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-center" placeholder="-" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.club}</Label>
                    <Input value={clubName} onChange={(e) => setClubName(e.target.value)} className="h-10 bg-secondary/10 border-border/20" placeholder="Club" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.rival}</Label>
                    <Input value={rivalName} onChange={(e) => setRivalName(e.target.value)} className="h-10 bg-secondary/10 border-border/20" placeholder="vs" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.competition}</Label>
                    <Input value={competition} onChange={(e) => setCompetition(e.target.value)} className="h-10 bg-secondary/10 border-border/20" placeholder="Liga / Copa" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.matchDate}</Label>
                    <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="h-10 bg-secondary/10 border-border/20" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.birthDate}</Label>
                    <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="h-10 bg-secondary/10 border-border/20" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.nationality}</Label>
                    <Select value={nationality} onValueChange={setNationality}>
                      <SelectTrigger className="h-10 bg-secondary/10 border-border/20">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {ALL_COUNTRIES.map(country => (
                          <SelectItem key={country} value={country}>{country}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.height}</Label>
                    <Input value={height} onChange={(e) => setHeight(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-center" placeholder="-" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.weight}</Label>
                    <Input value={weight} onChange={(e) => setWeight(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-center" placeholder="-" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.minPlayed}</Label>
                    <Input value={minPlayed} onChange={(e) => setMinPlayed(e.target.value)} className="h-10 bg-secondary/10 border-border/20 text-center" placeholder="90" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.marketValue}</Label>
                    <Input value={marketValue} onChange={(e) => setMarketValue(e.target.value)} className="h-10 bg-secondary/10 border-border/20" placeholder="€0" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.primaryPos}</Label>
                    <Select value={activeRole.id} onValueChange={(v) => setActiveRole(TACTICAL_ROLES.find(r => r.id === v) || TACTICAL_ROLES[0])}>
                      <SelectTrigger className="h-10 bg-secondary/10 border-border/20">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TACTICAL_ROLES.map(role => (
                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.secondaryPos}</Label>
                    <Input value={secondaryPositions} onChange={(e) => setSecondaryPositions(e.target.value)} className="h-10 bg-secondary/10 border-border/20" placeholder="Ej: ED, MCO" />
                  </div>
                  <div className="col-span-1 sm:col-span-2 space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.dominantFoot}</Label>
                    <div className="flex gap-2">
                      {['Derecho', 'Izquierdo', 'Ambos'].map(foot => (
                        <Button
                          key={foot}
                          type="button"
                          variant={dominantFoot === foot ? 'default' : 'outline'}
                          onClick={() => setDominantFoot(foot)}
                          className="h-9 rounded-full px-5 text-[11px] font-bold border-border/40"
                        >
                          {foot}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-1 sm:col-span-2 space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.physicalCondition}</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Excelente', 'Buena', 'Normal', 'Bajo su nivel', 'Lesionado'].map(cond => (
                        <Button
                          key={cond}
                          type="button"
                          variant={physicalCondition === cond ? 'default' : 'outline'}
                          onClick={() => setPhysicalCondition(cond)}
                          className="h-9 rounded-full px-5 text-[11px] font-bold border-border/40"
                        >
                          {cond}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-1 sm:col-span-2 space-y-2">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.scout}</Label>
                    <Input value={scoutName} readOnly className="h-10 bg-secondary/5 border-border/10 cursor-not-allowed opacity-70" placeholder="Nombre del observador" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 2 POSICIÓN EN EL CAMPO */}
            <div className="h-full">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md h-full flex flex-col">
                <div className="bg-[#007b83] px-5 py-3 flex items-center gap-3 border-b border-white/10 shrink-0">
                  <Target className="h-4 w-4 text-white" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">2 {t.report.pitch.title}</h2>
                </div>
                <CardContent className="p-8 flex flex-col items-center justify-center gap-6 flex-1">
                  <div className="w-full max-w-[360px] flex-1">
                    <TacticalCanvas 
                      marker={pitchMarker} 
                      onMarkerChange={setPitchMarker}
                      heatmapPoints={heatmapPoints}
                      onHeatmapChange={setHeatmapPoints}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[11px] font-black uppercase text-foreground/80">{t.report.pitch.mark}</p>
                    <p className="text-[10px] text-muted-foreground">{t.report.pitch.click}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 3 PERFIL GENERAL (IMPRESIÓN GLOBAL) */}
            <div className="h-full">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md h-full flex flex-col">
                <div className="bg-[#1b263b] px-5 py-3 flex items-center gap-3 border-b border-white/10 shrink-0">
                  <Star className="h-4 w-4 text-white fill-white" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">3 {t.report.generalProfile.title}</h2>
                </div>
                <CardContent className="p-0 flex-1 overflow-auto">
                  <div className="divide-y divide-border/10">
                    <RatingRow kpi={t.report.generalProfile.techLevel} rating={ratings['gen_tech']} onRatingChange={(v) => handleRatingChange('gen_tech', v)} note={notes['gen_tech']} onNoteChange={(v) => handleNoteChange('gen_tech', v)} />
                    <RatingRow kpi={t.report.generalProfile.tacticalIntel} rating={ratings['gen_tact']} onRatingChange={(v) => handleRatingChange('gen_tact', v)} note={notes['gen_tact']} onNoteChange={(v) => handleNoteChange('gen_tact', v)} />
                    <RatingRow kpi={t.report.generalProfile.physQuality} rating={ratings['gen_phys']} onRatingChange={(v) => handleRatingChange('gen_phys', v)} note={notes['gen_phys']} onNoteChange={(v) => handleNoteChange('gen_phys', v)} />
                    <RatingRow kpi={t.report.generalProfile.mentalStrength} rating={ratings['gen_ment']} onRatingChange={(v) => handleRatingChange('gen_ment', v)} note={notes['gen_ment']} onNoteChange={(v) => handleNoteChange('gen_ment', v)} />
                    <RatingRow kpi={t.report.generalProfile.compLevel} rating={ratings['gen_comp']} onRatingChange={(v) => handleRatingChange('gen_comp', v)} note={notes['gen_comp']} onNoteChange={(v) => handleNoteChange('gen_comp', v)} />
                    <RatingRow kpi={t.report.generalProfile.potential} rating={ratings['gen_pote']} onRatingChange={(v) => handleRatingChange('gen_pote', v)} note={notes['gen_pote']} onNoteChange={(v) => handleNoteChange('gen_pote', v)} />
                    <RatingRow kpi={t.report.generalProfile.currentLevel} rating={ratings['gen_curr']} onRatingChange={(v) => handleRatingChange('gen_curr', v)} note={notes['gen_curr']} onNoteChange={(v) => handleNoteChange('gen_curr', v)} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 4 ROLES Y FUNCIONES OBSERVADAS */}
            <div className="h-full">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md h-full flex flex-col">
                <div className="bg-[#1b263b] px-5 py-3 flex items-center gap-3 border-b border-white/10 shrink-0">
                  <Activity className="h-4 w-4 text-white" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">4 {t.report.roles.title}</h2>
                </div>
                <CardContent className="p-8 flex items-start justify-center flex-1">
                  <div className="flex flex-wrap gap-2.5 justify-center max-w-lg">
                    {t.report.roles.items.map((role: string) => (
                      <Button
                        key={role}
                        type="button"
                        variant={selectedRoles.includes(role) ? 'default' : 'outline'}
                        onClick={() => toggleRole(role)}
                        className={cn(
                          "h-10 rounded-full px-5 text-[11px] font-bold border-border/40 transition-all",
                          selectedRoles.includes(role) ? "bg-primary text-primary-foreground border-primary" : "bg-white/5 hover:border-primary/50 text-muted-foreground"
                        )}
                      >
                        {role}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end mt-10">
            <Button onClick={() => setActiveTab("context")} className="px-16 py-7 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-2xl text-[15px] transition-all transform hover:scale-105">
              {t.report.actions.next}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="context" className="animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* CONTEXTO DEL PARTIDO */}
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md h-full">
              <div className="bg-[#007b83] px-5 py-3 flex items-center gap-3 border-b border-white/10">
                <Target className="h-4 w-4 text-white" />
                <h2 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.matchContext.title}</h2>
              </div>
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.matchContext.gameStyle}</Label>
                  <div className="flex flex-wrap gap-2">
                    {t.report.matchContext.styles.map((style: string) => (
                      <Button
                        key={style}
                        type="button"
                        variant={notes['match_style'] === style ? 'default' : 'outline'}
                        onClick={() => handleNoteChange('match_style', style)}
                        className="h-9 px-4 text-[11px] font-bold rounded-full border-border/30"
                      >
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.matchContext.system}</Label>
                  <Input 
                    value={notes['match_system'] || ""} 
                    onChange={(e) => handleNoteChange('match_system', e.target.value)}
                    className="h-10 bg-secondary/10 border-border/20 text-sm" 
                    placeholder="Ej: 4-3-3, 4-2-3-1" 
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.matchContext.tempo}</Label>
                  <div className="flex flex-wrap gap-2">
                    {t.report.matchContext.tempos.map((tempo: string) => (
                      <Button
                        key={tempo}
                        type="button"
                        variant={notes['match_tempo'] === tempo ? 'default' : 'outline'}
                        onClick={() => handleNoteChange('match_tempo', tempo)}
                        className="h-9 px-6 text-[11px] font-bold rounded-full border-border/30"
                      >
                        {tempo}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.matchContext.dominance}</Label>
                  <div className="flex flex-wrap gap-2">
                    {t.report.matchContext.dominances.map((dom: string) => (
                      <Button
                        key={dom}
                        type="button"
                        variant={notes['team_dominance'] === dom ? 'default' : 'outline'}
                        onClick={() => handleNoteChange('team_dominance', dom)}
                        className="h-9 px-4 text-[11px] font-bold rounded-full border-border/30"
                      >
                        {dom}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.matchContext.score}</Label>
                  <div className="flex flex-wrap gap-2">
                    {t.report.matchContext.scores.map((score: string) => (
                      <Button
                        key={score}
                        type="button"
                        variant={notes['match_score'] === score ? 'default' : 'outline'}
                        onClick={() => handleNoteChange('match_score', score)}
                        className="h-9 px-4 text-[11px] font-bold rounded-full border-border/30"
                      >
                        {score}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.matchContext.importance}</Label>
                  <div className="flex flex-wrap gap-2">
                    {t.report.matchContext.importances.map((imp: string) => (
                      <Button
                        key={imp}
                        type="button"
                        variant={notes['match_importance'] === imp ? 'default' : 'outline'}
                        onClick={() => handleNoteChange('match_importance', imp)}
                        className="h-9 px-4 text-[11px] font-bold rounded-full border-border/30"
                      >
                        {imp}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.matchContext.weather}</Label>
                  <div className="flex flex-wrap gap-2">
                    {t.report.matchContext.weathers.map((w: string) => (
                      <Button
                        key={w}
                        type="button"
                        variant={notes['weather'] === w ? 'default' : 'outline'}
                        onClick={() => handleNoteChange('weather', w)}
                        className="h-9 px-4 text-[10px] font-black uppercase rounded-full border-border/30 flex items-center gap-2"
                      >
                        <WeatherIcon type={w} />
                        {w}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* COMPORTAMIENTO SIN BALÓN */}
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md h-full">
              <div className="bg-[#1b263b] px-5 py-3 flex items-center gap-3 border-b border-white/10">
                <Shield className="h-4 w-4 text-white" />
                <h2 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.matchContext.behaviorTitle}</h2>
              </div>
              <CardContent className="p-6 sm:p-8 space-y-8">
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.matchContext.withoutPossession}</Label>
                  <div className="flex flex-wrap gap-2">
                    {t.report.matchContext.behaviors.map((beh: string) => (
                      <Button
                        key={beh}
                        type="button"
                        variant={isSelectedInNote('without_possession', beh) ? 'default' : 'outline'}
                        onClick={() => toggleArrayNote('without_possession', beh)}
                        className="h-9 px-4 text-[11px] font-bold rounded-full border-border/30"
                      >
                        {beh}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.matchContext.bodyLanguage}</Label>
                  <div className="flex flex-wrap gap-2">
                    {t.report.matchContext.languages.map((lang: string) => (
                      <Button
                        key={lang}
                        type="button"
                        variant={isSelectedInNote('body_language', lang) ? 'default' : 'outline'}
                        onClick={() => toggleArrayNote('body_language', lang)}
                        className="h-9 px-4 text-[11px] font-bold rounded-full border-border/30"
                      >
                        {lang}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.matchContext.tacticalRoleInMatch}</Label>
                  <Textarea 
                    value={notes['behavior_tactical_role'] || ""}
                    onChange={(e) => handleNoteChange('behavior_tactical_role', e.target.value)}
                    className="min-h-[120px] bg-secondary/10 border-border/20 text-sm"
                    placeholder={t.report.matchContext.placeholderRole}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between gap-4 pt-10">
            <Button variant="ghost" onClick={() => setActiveTab("player")} className="px-10 py-6 font-bold text-[11px] uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-3 h-4 w-4" /> {t.report.actions.previous}
            </Button>
            <Button onClick={() => setActiveTab("technical")} className="px-16 py-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-2xl rounded-xl text-[13px] transition-all transform hover:scale-105">
              {t.report.actions.next}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="mt-6">
           <EvaluationModule t={t} icon={Shield} kpiSection={activeRole.kpis.technical} nextTab="tactical" prevTab="context" tabType="technical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="tactical" className="mt-6">
           <EvaluationModule t={t} icon={Shield} kpiSection={activeRole.kpis.tactical} nextTab="physical" prevTab="technical" tabType="tactical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="physical" className="mt-6">
           <EvaluationModule t={t} icon={ZapIcon} kpiSection={activeRole.kpis.physical} nextTab="mental" prevTab="tactical" tabType="physical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="mental" className="mt-6">
           <EvaluationModule t={t} icon={Heart} kpiSection={activeRole.kpis.mental} nextTab="actions" prevTab="physical" tabType="mental" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="actions" className="mt-6 animate-in fade-in slide-in-from-bottom-2 space-y-6">
          <Card className="border-border/40 shadow-2xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-4 py-3 flex items-center gap-3 border-b border-primary/20">
              <Star className="h-4 w-4 text-primary fill-primary" />
              <h2 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.sections.actions_title}</h2>
            </div>
            <CardContent className="p-8">
              <Button variant="ghost" className="w-full h-16 text-[11px] font-black uppercase tracking-widest text-muted-foreground border-2 border-dashed border-border/20 rounded-xl">
                <Plus className="h-5 w-5 mr-3" /> {t.report.actions.addEvent}
              </Button>
            </CardContent>
          </Card>
          <div className="flex justify-between gap-4 pt-10">
            <Button variant="ghost" onClick={() => setActiveTab("mental")} className="px-10 py-6 font-bold text-[11px] uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-3 h-4 w-4" /> {t.report.actions.previous}
            </Button>
            <Button onClick={() => setActiveTab("evaluation")} className="px-16 py-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-2xl rounded-xl text-[13px] transition-all transform hover:scale-105">
              {t.report.actions.next}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="mt-6 animate-in fade-in slide-in-from-bottom-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#2e7d32] px-5 py-3 flex items-center gap-3 border-b border-white/10">
                <Star className="h-4 w-4 text-white" />
                <h2 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.final_evaluation.strengths.title}</h2>
              </div>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-4">
                  <Label className="text-[11px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.strengths.strengths_title}</Label>
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-[11px] font-bold text-muted-foreground w-4">{i}.</span>
                      <Input 
                        className="h-11 bg-secondary/10 border-border/20 text-[12px]" 
                        placeholder="Fortaleza..." 
                        value={notes[`strength_${i}`] || ""}
                        onChange={(e) => handleNoteChange(`strength_${i}`, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-between gap-4 pt-10">
            <Button variant="ghost" onClick={() => setActiveTab("actions")} className="px-10 py-6 font-bold text-[11px] uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-3 h-4 w-4" /> {t.report.actions.previous}
            </Button>
            <Button onClick={() => setActiveTab("analytics")} className="px-16 py-6 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-xl text-[13px] transition-all transform hover:scale-105">
              {t.report.actions.next}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6 animate-in zoom-in-95 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-primary/20 bg-primary/5 shadow-inner p-10 rounded-3xl border-2">
              <div className="text-center space-y-8">
                <h3 className="text-2xl font-black font-headline uppercase tracking-[0.15em] text-foreground">{t.report.pim.title}</h3>
                <Button className="w-full h-16 bg-primary text-primary-foreground font-black tracking-[0.2em] text-[15px] rounded-2xl shadow-2xl transform hover:scale-105 transition-all">
                  {t.report.pim.calculate}
                </Button>
              </div>
            </Card>
            <Card className="border-accent/20 bg-accent/5 shadow-inner p-10 rounded-3xl border-2">
              <div className="text-center space-y-8">
                <h3 className="text-2xl font-black font-headline uppercase tracking-[0.15em] text-foreground">{t.report.summary.title}</h3>
                <Button variant="secondary" className="w-full h-16 font-black tracking-[0.2em] text-[13px] rounded-2xl shadow-2xl border-accent/30 uppercase transform hover:scale-105 transition-all">
                  {t.report.summary.generate}
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}