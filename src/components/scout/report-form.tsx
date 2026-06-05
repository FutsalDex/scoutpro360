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
import { FileText, ChevronRight, ChevronLeft, Activity, User, Target, Shield, Zap as ZapIcon, Heart, Save, Star, Plus, Loader2, Sun, Cloud, CloudRain, Snowflake, Wind, Brain, Sparkles, AlertCircle, Trash2, CheckCircle2 } from "lucide-react";
import { TACTICAL_ROLES, type TacticalRoleConfig, type KPISection, type UserProfile, type Player, type ScoutingReport, type Point, type ScoutingAction } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n/context';
import { cn } from "@/lib/utils";
import { savePlayer, saveReport, getPlayer, getLatestReportForPlayer } from "@/lib/services/db-service";
import { auth } from "@/lib/firebase/config";
import { ALL_COUNTRIES } from "@/lib/data/countries";
import { serverTimestamp } from "firebase/firestore";
import { calculatePlayerImpactMetric } from "@/ai/flows/calculate-player-impact-metric-flow";
import { generateExecutiveSummary } from "@/ai/flows/generate-executive-summary";

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
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-border/10 last:border-0 group px-4 sm:px-6">
    <Label className="text-[11px] font-bold text-foreground sm:w-48 shrink-0 uppercase tracking-tight">{kpi}</Label>
    <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 w-full">
      <div className="flex gap-1 shrink-0 justify-center sm:justify-start w-full sm:w-auto">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onRatingChange(num)}
            className={cn(
              "h-8 w-8 rounded-full border border-border/40 text-[10px] font-bold flex items-center justify-center transition-all",
              rating === num ? "bg-primary text-primary-foreground border-primary shadow-lg scale-110" : "bg-white/5 hover:border-primary/50 text-muted-foreground"
            )}
          >
            {num}
          </button>
        ))}
      </div>
      <Input 
        className="h-9 text-[11px] bg-secondary/10 border-none shadow-none focus-visible:ring-1 border-b border-border/20 rounded-md italic placeholder:opacity-40 flex-1 w-full" 
        placeholder="Añadir nota técnica..." 
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
  const hasImpactColumn = tabType === 'technical' || tabType === 'tactical' || tabType === 'physical' || tabType === 'mental';
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-col gap-6">
        <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
          <div className="bg-[#1b263b] px-4 sm:px-5 py-3 flex items-center gap-2 border-b border-primary/20">
            <Icon className="h-4 w-4 text-primary" />
            <h2 className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider">{t.report.sections[`${tabType}_obs`]}</h2>
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

        {hasImpactColumn && kpiSection.impact && kpiSection.impact.length > 0 && (
          <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-4 sm:px-5 py-3 flex items-center gap-2 border-b border-accent/20">
              <Activity className="h-4 w-4 text-accent" />
              <h2 className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-wider">{t.report.sections[`${tabType}_impact`]}</h2>
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
        <Button type="button" variant="ghost" onClick={() => setActiveTab(prevTab)} className="px-6 sm:px-10 py-6 font-bold text-[11px] uppercase text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-2 h-4 w-4" /> {t.report.actions.previous}
        </Button>
        <Button type="button" onClick={() => setActiveTab(nextTab)} className="px-10 sm:px-16 py-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-2xl rounded-xl text-[13px] transition-all transform hover:scale-105">
          {t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export function ReportForm({ userProfile, editingPlayerId }: ReportFormProps) {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  
  const [activeTab, setActiveTab] = useState("player");
  const [activeRole, setActiveRole] = useState<TacticalRoleConfig>(TACTICAL_ROLES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [reportId, setReportId] = useState<string | null>(null);
  const [scoutingActions, setScoutingActions] = useState<ScoutingAction[]>([]);

  const [isCalculatingPIM, setIsCalculatingPIM] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const [pitchMarker, setPitchMarker] = useState<Point>({ x: 200, y: 300 });
  const [heatmapPoints, setHeatmapPoints] = useState<Point[]>([]);

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
          setScoutingActions(report.actions || []);
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

  const handleAddAction = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setScoutingActions([...scoutingActions, { minute: "", action: "", result: "", notes: "" }]);
  };

  const handleUpdateAction = (index: number, field: keyof ScoutingAction, value: string) => {
    const updated = [...scoutingActions];
    updated[index] = { ...updated[index], [field]: value };
    setScoutingActions(updated);
  };

  const handleRemoveAction = (index: number) => {
    setScoutingActions(scoutingActions.filter((_, i) => i !== index));
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

  const handleCalculatePIM = async () => {
    setIsCalculatingPIM(true);
    try {
      const getSectionMetrics = (section: KPISection) => {
        const result: Record<string, number> = {};
        [...section.observation, ...section.impact].forEach(kpi => {
          if (ratings[kpi]) result[kpi] = ratings[kpi];
        });
        return result;
      };

      const result = await calculatePlayerImpactMetric({
        playerId: editingPlayerId || "temp-player",
        currentEvaluation: {
          tacticalRole: activeRole.name,
          metrics: {
            technical: getSectionMetrics(activeRole.kpis.technical),
            tactical: getSectionMetrics(activeRole.kpis.tactical),
            physical: getSectionMetrics(activeRole.kpis.physical),
            mental: getSectionMetrics(activeRole.kpis.mental),
          }
        },
        historicalClubData: JSON.stringify({ avgPim: 75, topPim: 92, clubStyle: "Possession" })
      });

      handleRatingChange('pim', Math.round(result.playerImpactMetric));
      handleNoteChange('pim_explanation', result.explanation);
      toast({ title: "PIM Calculado", description: `Impacto estimado: ${Math.round(result.playerImpactMetric)}%` });
    } catch (error: any) {
      console.error("AI Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Error de IA", 
        description: error.message || "No se pudo calcular el PIM. Verifica tu conexión." 
      });
    } finally {
      setIsCalculatingPIM(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!playerName) {
      toast({ variant: "destructive", title: "Error", description: "Introduce el nombre del jugador." });
      return;
    }
    
    setIsGeneratingSummary(true);
    try {
      const allScoutNotes = Object.entries(notes)
        .filter(([key]) => !['summary', 'pim_explanation'].includes(key))
        .map(([key, val]) => `${key}: ${val}`)
        .join('\n');

      const result = await generateExecutiveSummary({
        playerName,
        tacticalRole: activeRole.name,
        scoutNotes: allScoutNotes || "Sin notas adicionales.",
        language: language as 'en' | 'es',
        metrics: {
          general: ratings
        }
      });

      handleNoteChange('summary', result.summary);
      toast({ title: "Resumen Generado", description: "La IA ha finalizado el análisis." });
    } catch (error: any) {
      console.error("AI Error:", error);
      toast({ 
        variant: "destructive", 
        title: "Error de IA", 
        description: error.message || "No se pudo generar el resumen." 
      });
    } finally {
      setIsGeneratingSummary(false);
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
        actions: scoutingActions,
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
    <div className="space-y-6 sm:space-y-8 pb-32 max-w-full mx-auto w-full px-1 overflow-x-hidden">
      <div className="flex flex-col gap-4 bg-card/80 backdrop-blur-xl p-4 sm:p-8 rounded-2xl border border-border/50 shadow-2xl sticky top-16 z-40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-6 w-full sm:w-auto">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
              <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
            </div>
            <div className="space-y-0.5 sm:space-y-1 overflow-hidden">
              <h1 className="text-xl sm:text-3xl font-black font-headline uppercase tracking-tight text-foreground leading-tight truncate max-w-[200px] sm:max-w-none">
                {editingPlayerId ? `${playerName}` : t.report.title}
              </h1>
              <p className="text-[9px] sm:text-[11px] text-primary font-bold uppercase tracking-[0.25em]">{t.report.subtitle}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              type="button"
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
        <div className="w-full overflow-x-auto no-scrollbar pb-2 mb-6">
          <TabsList className="flex bg-secondary/15 h-auto p-1.5 border border-border/20 rounded-2xl shadow-inner min-w-max">
            {Object.entries(t.report.tabs).map(([key, label], idx) => (
              <TabsTrigger 
                key={key} 
                value={key} 
                className="flex-none px-5 text-[9px] sm:text-[11px] font-black tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-lg h-11 border border-transparent m-1"
              >
                <span className="mr-1.5 opacity-40 font-code">{idx + 1}</span>
                {label as string}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="player" className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
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
                </CardContent>
              </Card>
            </div>

            <div className="h-full">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md h-full flex flex-col">
                <div className="bg-[#007b83] px-5 py-3 flex items-center gap-3 border-b border-white/10 shrink-0">
                  <Target className="h-4 w-4 text-white" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">2 {t.report.pitch.title}</h2>
                </div>
                <CardContent className="p-4 sm:p-8 flex flex-col items-center justify-center gap-6 flex-1">
                  <div className="w-full max-w-full sm:max-w-[360px] flex-1">
                    <TacticalCanvas 
                      marker={pitchMarker} 
                      onMarkerChange={setPitchMarker}
                      heatmapPoints={heatmapPoints}
                      onHeatmapChange={setHeatmapPoints}
                    />
                  </div>
                  <div className="text-center px-4">
                    <p className="text-[11px] font-black uppercase text-foreground/80">{t.report.pitch.mark}</p>
                    <p className="text-[10px] text-muted-foreground">{t.report.pitch.click}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end mt-10">
            <Button type="button" onClick={() => setActiveTab("context")} className="px-16 py-7 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-2xl text-[15px] transition-all transform hover:scale-105 w-full sm:w-auto">
              {t.report.actions.next}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="context" className="animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
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
              </CardContent>
            </Card>

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
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("player")} className="px-6 sm:px-10 py-6 font-bold text-[11px] uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-2 h-4 w-4" /> {t.report.actions.previous}
            </Button>
            <Button type="button" onClick={() => setActiveTab("technical")} className="px-10 sm:px-16 py-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-2xl rounded-xl text-[13px] transition-all transform hover:scale-105">
              {t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" />
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
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-[#1b263b] border-b border-border/10">
                    <tr>
                      <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-white w-20">{t.report.actions.min}</th>
                      <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-white w-48">{t.report.actions.action}</th>
                      <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-white w-40">{t.report.actions.result}</th>
                      <th className="text-left p-4 text-[10px] font-black uppercase tracking-widest text-white">{t.report.actions.notes}</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/10">
                    {scoutingActions.map((action, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors group">
                        <td className="p-3">
                          <Input 
                            value={action.minute} 
                            onChange={(e) => handleUpdateAction(idx, 'minute', e.target.value)}
                            className="h-9 bg-transparent border-none text-[11px] font-bold text-center" 
                            placeholder="–'" 
                          />
                        </td>
                        <td className="p-3">
                          <Input 
                            value={action.action} 
                            onChange={(e) => handleUpdateAction(idx, 'action', e.target.value)}
                            className="h-9 bg-transparent border-none text-[11px]" 
                            placeholder="Tipo de acción..." 
                          />
                        </td>
                        <td className="p-3">
                          <Input 
                            value={action.result} 
                            onChange={(e) => handleUpdateAction(idx, 'result', e.target.value)}
                            className="h-9 bg-transparent border-none text-[11px]" 
                            placeholder="Resultado..." 
                          />
                        </td>
                        <td className="p-3">
                          <Input 
                            value={action.notes} 
                            onChange={(e) => handleUpdateAction(idx, 'notes', e.target.value)}
                            className="h-9 bg-transparent border-none text-[11px]" 
                            placeholder="Observación..." 
                          />
                        </td>
                        <td className="p-3">
                          <Button 
                            type="button"
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-opacity"
                            onClick={() => handleRemoveAction(idx)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-secondary/10">
                <Button 
                  type="button"
                  variant="ghost" 
                  className="w-full h-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-2 border-dashed border-border/20 rounded-xl hover:bg-white/5"
                  onClick={handleAddAction}
                >
                  <Plus className="h-4 w-4 mr-2" /> {t.report.actions.addEvent}
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-between gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("mental")} className="px-6 sm:px-10 py-6 font-bold text-[11px] uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-2 h-4 w-4" /> {t.report.actions.previous}
            </Button>
            <Button type="button" onClick={() => setActiveTab("evaluation")} className="px-10 sm:px-16 py-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-2xl rounded-xl text-[13px] transition-all transform hover:scale-105">
              {t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="mt-6 animate-in fade-in slide-in-from-bottom-2 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-8">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#2e7d32] px-5 py-3 flex items-center gap-3 border-b border-white/10">
                  <Star className="h-4 w-4 text-white" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.evaluation.strengths.title}</h2>
                </div>
                <CardContent className="p-6 sm:p-8 space-y-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.evaluation.strengths.main}</Label>
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-[11px] font-bold text-muted-foreground w-4">{i}.</span>
                        <Input 
                          className="h-10 bg-secondary/10 border-border/20 text-xs" 
                          placeholder="Fortaleza..." 
                          value={notes[`strength_${i}`] || ""}
                          onChange={(e) => handleNoteChange(`strength_${i}`, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.evaluation.strengths.areas}</Label>
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-[11px] font-bold text-muted-foreground w-4">{i}.</span>
                        <Input 
                          className="h-10 bg-secondary/10 border-border/20 text-xs" 
                          placeholder="Área a mejorar..." 
                          value={notes[`area_${i}`] || ""}
                          onChange={(e) => handleNoteChange(`area_${i}`, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#007b83] px-5 py-3 flex items-center gap-3 border-b border-white/10">
                  <Shield className="h-4 w-4 text-white" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.evaluation.recruitment.title}</h2>
                </div>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.evaluation.recruitment.fitsModel}</Label>
                    <div className="flex gap-2 flex-wrap">
                      {['Sí', 'No', 'Seguimiento'].map(opt => (
                        <Button
                          key={opt}
                          type="button"
                          variant={notes['fit_model'] === opt ? 'default' : 'outline'}
                          onClick={() => handleNoteChange('fit_model', opt)}
                          className="h-9 px-4 text-[11px] font-bold rounded-full border-border/30"
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.evaluation.recruitment.immediateImpact}</Label>
                    <div className="flex gap-2 flex-wrap">
                      {['Alto', 'Medio', 'Bajo'].map(opt => (
                        <Button
                          key={opt}
                          type="button"
                          variant={notes['immediate_impact'] === opt ? 'default' : 'outline'}
                          onClick={() => handleNoteChange('immediate_impact', opt)}
                          className="h-9 px-6 text-[11px] font-bold rounded-full border-border/30"
                        >
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-8">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#007b83] px-5 py-3 flex items-center gap-3 border-b border-white/10">
                  <Activity className="h-4 w-4 text-white" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.evaluation.finalSummary.title}</h2>
                </div>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.evaluation.finalSummary.playerDesc}</Label>
                    <Textarea value={notes['player_general_desc'] || ""} onChange={(e) => handleNoteChange('player_general_desc', e.target.value)} className="min-h-[100px] bg-secondary/10 border-border/20 text-xs" placeholder="Impresión general..." />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.evaluation.finalSummary.recommendation}</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Button 
                        type="button"
                        variant={notes['final_recommendation'] === 'immediate' ? 'default' : 'outline'}
                        onClick={() => handleNoteChange('final_recommendation', 'immediate')}
                        className={cn("h-16 flex flex-col gap-0.5 rounded-xl border-none transition-all", notes['final_recommendation'] === 'immediate' ? "bg-[#2e7d32] text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10")}
                      >
                        <span className="text-[10px] font-black uppercase tracking-tight">{t.report.evaluation.finalSummary.options.immediate}</span>
                        <span className="text-[8px] font-bold opacity-60 uppercase">{t.report.evaluation.finalSummary.options.elite}</span>
                      </Button>
                      <Button 
                        type="button"
                        variant={notes['final_recommendation'] === 'follow' ? 'default' : 'outline'}
                        onClick={() => handleNoteChange('final_recommendation', 'follow')}
                        className={cn("h-16 flex flex-col gap-0.5 rounded-xl border-none transition-all", notes['final_recommendation'] === 'follow' ? "bg-[#007b83] text-white" : "bg-white/5 text-muted-foreground hover:bg-white/10")}
                      >
                        <span className="text-[10px] font-black uppercase tracking-tight">{t.report.evaluation.finalSummary.options.follow}</span>
                        <span className="text-[8px] font-bold opacity-60 uppercase">{t.report.evaluation.finalSummary.options.high}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#fbc02d] px-5 py-3 flex items-center gap-3 border-b border-white/10">
                  <Heart className="h-4 w-4 text-white" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.evaluation.finalRating.title}</h2>
                </div>
                <CardContent className="p-6 sm:p-8 space-y-8 text-center">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t.report.evaluation.finalRating.legend}</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {[
                      { v: 1, c: '#c62828' },
                      { v: 2, c: '#e65100' },
                      { v: 3, c: '#fbc02d' },
                      { v: 4, c: '#2e7d32' },
                      { v: 5, c: '#00695c' }
                    ].map((item, idx) => (
                      <Button
                        key={item.v}
                        type="button"
                        onClick={() => handleRatingChange('final_scout_rating', item.v)}
                        className={cn(
                          "flex-1 min-w-[50px] h-16 sm:h-20 flex flex-col gap-1 rounded-xl border-none transition-all transform hover:scale-105",
                          ratings['final_scout_rating'] === item.v ? "scale-110 shadow-2xl z-10 opacity-100" : "opacity-40"
                        )}
                        style={{ backgroundColor: item.c }}
                      >
                        <span className="text-xl sm:text-2xl font-black font-headline text-white">{item.v}</span>
                        <span className="text-[7px] sm:text-[8px] font-black text-white uppercase tracking-tight leading-none">{t.report.evaluation.finalRating.labels[idx]}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-between gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("actions")} className="px-6 sm:px-10 py-6 font-bold text-[11px] uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-2 h-4 w-4" /> {t.report.actions.previous}
            </Button>
            <Button type="button" onClick={() => setActiveTab("analytics")} className="px-10 sm:px-16 py-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-2xl rounded-xl text-[13px] transition-all transform hover:scale-105">
              {t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6 animate-in zoom-in-95 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-primary/20 bg-[#1b263b]/60 shadow-xl p-6 sm:p-10 rounded-3xl border-2 flex flex-col justify-between min-h-[300px]">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-headline uppercase tracking-[0.15em] text-foreground leading-tight">
                  {t.report.pim.title}
                </h3>
                {ratings['pim'] && (
                  <div className="py-4 animate-in zoom-in duration-500">
                    <p className="text-5xl sm:text-6xl font-black font-headline text-primary">{ratings['pim']}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2">Impact score calculated</p>
                  </div>
                )}
              </div>
              <Button 
                type="button"
                onClick={handleCalculatePIM}
                disabled={isCalculatingPIM}
                className="w-full h-16 bg-primary text-primary-foreground font-black tracking-[0.2em] text-[14px] sm:text-[15px] rounded-2xl shadow-2xl transform hover:scale-105 transition-all mt-6"
              >
                {isCalculatingPIM ? <Loader2 className="h-5 w-5 animate-spin" /> : t.report.pim.calculate}
              </Button>
            </Card>

            <Card className="border-accent/20 bg-[#1b263b]/60 shadow-xl p-6 sm:p-10 rounded-3xl border-2 flex flex-col justify-between min-h-[300px]">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl sm:text-2xl font-black font-headline uppercase tracking-[0.15em] text-foreground leading-tight">
                  {t.report.summary.title}
                </h3>
                {notes['summary'] && (
                  <div className="text-left p-4 bg-background/40 rounded-xl border border-border/10 mt-4 max-h-[200px] overflow-auto animate-in fade-in duration-500">
                    <p className="text-xs text-muted-foreground leading-relaxed italic">"{notes['summary']}"</p>
                  </div>
                )}
              </div>
              <Button 
                type="button"
                variant="secondary" 
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                className="w-full h-16 font-black tracking-[0.2em] text-[12px] sm:text-[13px] rounded-2xl shadow-2xl border-accent/30 uppercase transform hover:scale-105 transition-all bg-secondary/80 hover:bg-secondary text-foreground mt-6"
              >
                {isGeneratingSummary ? <Loader2 className="h-5 w-5 animate-spin" /> : t.report.summary.generate}
              </Button>
            </Card>
          </div>

          <div className="flex justify-start gap-4 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("evaluation")} className="px-6 sm:px-10 py-6 font-bold text-[11px] uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-2 h-4 w-4" /> {t.report.actions.previous}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
