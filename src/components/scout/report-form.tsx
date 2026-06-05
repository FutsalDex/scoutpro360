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
import { FileText, ChevronRight, ChevronLeft, Activity, User, Target, Shield, Zap as ZapIcon, Heart, Save, Star, Plus, Loader2, Brain, Sparkles, Trash2 } from "lucide-react";
import { TACTICAL_ROLES, type KPISection, type UserProfile, type ScoutingReport, type Point, type ScoutingAction } from "@/lib/types";
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
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-5 border-b border-border/10 last:border-0 px-4 sm:px-6 w-full">
    <Label className="text-[11px] font-bold text-foreground sm:w-48 shrink-0 uppercase tracking-tight mb-2 sm:mb-0">{kpi}</Label>
    <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 w-full overflow-hidden">
      <div className="flex gap-1 justify-between w-full sm:w-auto">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onRatingChange(num)}
            className={cn(
              "h-9 w-9 rounded-full border border-border/40 text-[10px] font-bold flex items-center justify-center transition-all",
              rating === num ? "bg-primary text-primary-foreground border-primary shadow-lg scale-110" : "bg-white/5 hover:border-primary/50 text-muted-foreground"
            )}
          >
            {num}
          </button>
        ))}
      </div>
      <Input 
        className="h-10 text-[11px] bg-secondary/10 border-none shadow-none focus-visible:ring-1 border-b border-border/20 rounded-md italic placeholder:opacity-40 flex-1 w-full" 
        placeholder="Nota técnica..." 
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
  const hasImpactColumn = ['technical', 'tactical', 'physical', 'mental'].includes(tabType);
  
  return (
    <div className="space-y-6 w-full overflow-x-hidden">
      <div className="flex flex-col gap-6 w-full">
        <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md w-full">
          <div className="bg-[#1b263b] px-4 py-3 flex items-center gap-2 border-b border-primary/20">
            <Icon className="h-4 w-4 text-primary" />
            <h2 className="text-[10px] font-black text-white uppercase tracking-wider">{t.report.sections[`${tabType}_obs`]}</h2>
          </div>
          <CardContent className="p-0 w-full">
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
          <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md w-full">
            <div className="bg-[#1b263b] px-4 py-3 flex items-center gap-2 border-b border-accent/20">
              <Activity className="h-4 w-4 text-accent" />
              <h2 className="text-[10px] font-black text-white uppercase tracking-wider">{t.report.sections[`${tabType}_impact`]}</h2>
            </div>
            <CardContent className="p-0 w-full">
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

      <div className="flex justify-between gap-3 pt-10">
        <Button type="button" variant="ghost" onClick={() => setActiveTab(prevTab)} className="px-4 py-6 font-bold text-[11px] uppercase text-muted-foreground flex-1 sm:flex-none">
          <ChevronLeft className="mr-2 h-4 w-4" /> {t.report.actions.previous}
        </Button>
        <Button type="button" onClick={() => setActiveTab(nextTab)} className="px-4 py-6 bg-primary text-primary-foreground font-bold rounded-xl text-[11px] sm:text-[13px] transition-all flex-1 sm:flex-none">
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

  // Form Fields
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

  const handleRatingChange = (kpi: string, value: number) => setRatings(prev => ({ ...prev, [kpi]: value }));
  const handleNoteChange = (kpi: string, value: string) => setNotes(prev => ({ ...prev, [kpi]: value }));
  const handleAddAction = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setScoutingActions([...scoutingActions, { minute: "", action: "", result: "", notes: "" }]);
  };
  const handleUpdateAction = (index: number, field: keyof ScoutingAction, value: string) => {
    const updated = [...scoutingActions];
    updated[index] = { ...updated[index], [field]: value };
    setScoutingActions(updated);
  };
  const handleRemoveAction = (index: number) => setScoutingActions(scoutingActions.filter((_, i) => i !== index));

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
      toast({ variant: "destructive", title: "Error de IA", description: error.message || "Fallo en el cálculo." });
    } finally {
      setIsCalculatingPIM(false);
    }
  };

  const handleGenerateSummary = async () => {
    if (!playerName) return toast({ variant: "destructive", title: "Error", description: "Nombre requerido." });
    setIsGeneratingSummary(true);
    try {
      const allScoutNotes = Object.entries(notes)
        .filter(([key]) => !['summary', 'pim_explanation'].includes(key))
        .map(([key, val]) => `${key}: ${val}`)
        .join('\n');
      const result = await generateExecutiveSummary({
        playerName,
        tacticalRole: activeRole.name,
        scoutNotes: allScoutNotes || "Sin notas.",
        language: language as 'en' | 'es',
        metrics: { general: ratings }
      });
      handleNoteChange('summary', result.summary);
      toast({ title: "Resumen Generado" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error de IA", description: error.message });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleSaveAll = async () => {
    if (!playerName) {
      toast({ variant: "destructive", title: "Nombre requerido" });
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
        dorsal, rivalName, competition, matchDate, minPlayed, physicalCondition, selectedRoles,
        pitchPosition: pitchMarker, heatmapPoints,
        createdAt: serverTimestamp()
      }, reportId || undefined);
      toast({ title: "Guardado" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-32 w-full max-w-full overflow-x-hidden">
      <div className="flex flex-col gap-4 bg-card/80 backdrop-blur-xl p-4 sm:p-8 rounded-2xl border border-border/50 shadow-2xl sticky top-16 z-40 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 w-full">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
              <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
            </div>
            <div className="space-y-0.5 overflow-hidden">
              <h1 className="text-xl sm:text-2xl font-black font-headline uppercase tracking-tight text-foreground truncate">
                {editingPlayerId ? playerName : t.report.title}
              </h1>
              <p className="text-[9px] text-primary font-bold uppercase tracking-[0.2em]">{t.report.subtitle}</p>
            </div>
          </div>
          <Button onClick={handleSaveAll} disabled={isSaving} className="w-full sm:w-auto h-11 px-6 bg-primary text-primary-foreground font-black text-[11px] uppercase tracking-widest rounded-xl">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {t.report.actions.save}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-full">
        <TabsList className="flex flex-wrap h-auto bg-secondary/15 p-1 border border-border/20 rounded-2xl w-full gap-1 mb-8">
          {Object.entries(t.report.tabs).map(([key, label]) => (
            <TabsTrigger 
              key={key} 
              value={key} 
              className="flex-1 min-w-[80px] py-3 text-[9px] font-black tracking-tighter data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg h-10 border border-transparent truncate"
            >
              {label as string}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="player" className="animate-in fade-in space-y-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#1b263b] px-4 py-3 flex items-center gap-2 border-b border-primary/20">
                <User className="h-4 w-4 text-primary" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-wider">{t.report.playerInfo.title}</h2>
              </div>
              <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="col-span-full space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.name}</Label>
                  <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="h-10 bg-secondary/10" placeholder="Nombre..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.dorsal}</Label>
                  <Input value={dorsal} onChange={(e) => setDorsal(e.target.value)} className="h-10 bg-secondary/10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.club}</Label>
                  <Input value={clubName} onChange={(e) => setClubName(e.target.value)} className="h-10 bg-secondary/10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.rival}</Label>
                  <Input value={rivalName} onChange={(e) => setRivalName(e.target.value)} className="h-10 bg-secondary/10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.matchDate}</Label>
                  <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="h-10 bg-secondary/10" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.nationality}</Label>
                  <Select value={nationality} onValueChange={setNationality}>
                    <SelectTrigger className="h-10 bg-secondary/10"><SelectValue placeholder="-" /></SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {ALL_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.primaryPos}</Label>
                  <Select value={activeRole.id} onValueChange={(v) => setActiveRole(TACTICAL_ROLES.find(r => r.id === v) || TACTICAL_ROLES[0])}>
                    <SelectTrigger className="h-10 bg-secondary/10"><SelectValue /></SelectTrigger>
                    <SelectContent>{TACTICAL_ROLES.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#1b263b] px-4 py-3 flex items-center gap-2 border-b border-primary/20">
                <Target className="h-4 w-4 text-primary" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-wider">{t.report.pitch.title}</h2>
              </div>
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <TacticalCanvas marker={pitchMarker} onMarkerChange={setPitchMarker} heatmapPoints={heatmapPoints} onHeatmapChange={setHeatmapPoints} />
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-end pt-6">
            <Button onClick={() => setActiveTab("context")} className="w-full sm:w-auto px-16 py-7 bg-primary text-primary-foreground font-black uppercase text-[13px] rounded-2xl transition-transform active:scale-95">
              {t.report.actions.next}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="context" className="animate-in fade-in space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/40 bg-card/40 backdrop-blur-md rounded-xl overflow-hidden">
              <div className="bg-[#1b263b] px-4 py-3 border-b border-primary/20 flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-wider">{t.report.matchContext.title}</h2>
              </div>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.matchContext.gameStyle}</Label>
                  <div className="flex flex-wrap gap-2">
                    {t.report.matchContext.styles.map((style: string) => (
                      <Button key={style} type="button" variant={notes['match_style'] === style ? 'default' : 'outline'} onClick={() => handleNoteChange('match_style', style)} className="h-8 px-4 text-[10px] font-bold rounded-full">
                        {style}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.matchContext.system}</Label>
                  <Input value={notes['match_system'] || ""} onChange={(e) => handleNoteChange('match_system', e.target.value)} className="h-10 bg-secondary/10" placeholder="4-3-3" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/40 rounded-xl overflow-hidden">
              <div className="bg-[#1b263b] px-4 py-3 border-b border-primary/20 flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-wider">{t.report.matchContext.behaviorTitle}</h2>
              </div>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {t.report.matchContext.behaviors.map((beh: string) => (
                    <Button
                      key={beh} type="button" variant={notes['without_possession']?.includes(beh) ? 'default' : 'outline'}
                      onClick={() => {
                         let current = notes['without_possession'] ? JSON.parse(notes['without_possession']) : [];
                         current = current.includes(beh) ? current.filter((i: string) => i !== beh) : [...current, beh];
                         handleNoteChange('without_possession', JSON.stringify(current));
                      }}
                      className="h-8 px-4 text-[10px] font-bold rounded-full"
                    >
                      {beh}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-between gap-3 pt-10">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("player")} className="px-6 py-6 font-bold text-[11px] uppercase text-muted-foreground flex-1 sm:flex-none">
              <ChevronLeft className="mr-2 h-4 w-4" /> {t.report.actions.previous}
            </Button>
            <Button type="button" onClick={() => setActiveTab("technical")} className="px-10 py-6 bg-primary text-primary-foreground font-bold rounded-xl text-[13px] flex-1 sm:flex-none">
              {t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="technical">
           <EvaluationModule t={t} icon={Shield} kpiSection={activeRole.kpis.technical} nextTab="tactical" prevTab="context" tabType="technical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>
        <TabsContent value="tactical">
           <EvaluationModule t={t} icon={Shield} kpiSection={activeRole.kpis.tactical} nextTab="physical" prevTab="technical" tabType="tactical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>
        <TabsContent value="physical">
           <EvaluationModule t={t} icon={ZapIcon} kpiSection={activeRole.kpis.physical} nextTab="mental" prevTab="tactical" tabType="physical" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>
        <TabsContent value="mental">
           <EvaluationModule t={t} icon={Heart} kpiSection={activeRole.kpis.mental} nextTab="actions" prevTab="physical" tabType="mental" ratings={ratings} onRatingChange={handleRatingChange} notes={notes} onNoteChange={handleNoteChange} setActiveTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="actions" className="space-y-6">
          <Card className="border-border/40 shadow-2xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-4 py-3 flex items-center gap-3 border-b border-primary/20">
              <Star className="h-4 w-4 text-primary fill-primary" />
              <h2 className="text-[10px] font-black text-white uppercase tracking-wider">{t.report.sections.actions_title}</h2>
            </div>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {scoutingActions.map((action, idx) => (
                <div key={idx} className="p-5 bg-secondary/10 rounded-xl border border-border/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Label className="text-[9px] font-black uppercase text-primary">Min.</Label>
                      <Input value={action.minute} onChange={(e) => handleUpdateAction(idx, 'minute', e.target.value)} className="h-9 w-20 bg-background/50 text-center font-bold" placeholder="--" />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveAction(idx)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input value={action.action} onChange={(e) => handleUpdateAction(idx, 'action', e.target.value)} className="h-10 bg-background/50" placeholder={t.report.actions.action} />
                    <Input value={action.result} onChange={(e) => handleUpdateAction(idx, 'result', e.target.value)} className="h-10 bg-background/50" placeholder={t.report.actions.result} />
                    <Input value={action.notes} onChange={(e) => handleUpdateAction(idx, 'notes', e.target.value)} className="h-10 bg-background/50 col-span-full" placeholder={t.report.actions.notes} />
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full h-14 border-dashed border-2 border-primary/30 text-primary font-black uppercase tracking-widest text-[10px]" onClick={handleAddAction}>
                <Plus className="h-4 w-4 mr-2" /> {t.report.actions.addEvent}
              </Button>
            </CardContent>
          </Card>
          <div className="flex justify-between gap-3 pt-6">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("mental")} className="px-4 py-6 font-bold text-[11px] uppercase text-muted-foreground flex-1 sm:flex-none">
              <ChevronLeft className="mr-2 h-4 w-4" /> {t.report.actions.previous}
            </Button>
            <Button type="button" onClick={() => setActiveTab("evaluation")} className="px-10 py-6 bg-primary text-primary-foreground font-bold rounded-xl text-[13px] flex-1 sm:flex-none">
              {t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/40 rounded-xl overflow-hidden bg-card/40">
              <div className="bg-[#1b263b] px-4 py-3 border-b border-primary/20 flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-wider">{t.report.evaluation.strengths.title}</h2>
              </div>
              <CardContent className="p-6 space-y-4">
                {[1,2,3,4].map(i => <Input key={i} className="h-11 bg-secondary/10" placeholder={`Punto clave ${i}`} value={notes[`strength_${i}`] || ""} onChange={(e) => handleNoteChange(`strength_${i}`, e.target.value)} />)}
              </CardContent>
            </Card>
            <Card className="border-border/40 rounded-xl overflow-hidden bg-card/40">
              <div className="bg-[#1b263b] px-4 py-3 border-b border-primary/20 flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                <h2 className="text-[10px] font-black text-white uppercase tracking-wider">{t.report.evaluation.finalSummary.title}</h2>
              </div>
              <CardContent className="p-6">
                <Textarea value={notes['player_general_desc'] || ""} onChange={(e) => handleNoteChange('player_general_desc', e.target.value)} className="min-h-[150px] bg-secondary/10" placeholder="..." />
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-between gap-3 pt-6">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("actions")} className="px-4 py-6 font-bold text-[11px] uppercase text-muted-foreground flex-1 sm:flex-none">
              <ChevronLeft className="mr-2 h-4 w-4" /> {t.report.actions.previous}
            </Button>
            <Button type="button" onClick={() => setActiveTab("analytics")} className="px-10 py-6 bg-primary text-primary-foreground font-bold rounded-xl text-[13px] flex-1 sm:flex-none">
              {t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-primary/30 bg-[#1b263b]/60 shadow-xl p-8 rounded-3xl border-2 flex flex-col justify-between min-h-[320px]">
              <div className="text-center space-y-6">
                <Brain className="h-10 w-10 text-primary mx-auto" />
                <h3 className="text-xl font-black uppercase tracking-widest">{t.report.pim.title}</h3>
                <div className="text-6xl font-black text-primary animate-in zoom-in-50">{ratings['pim'] || "0"}</div>
              </div>
              <Button type="button" onClick={handleCalculatePIM} disabled={isCalculatingPIM} className="h-16 bg-primary text-primary-foreground font-black uppercase text-[15px] rounded-2xl shadow-2xl active:scale-95 transition-all">
                {isCalculatingPIM ? <Loader2 className="h-6 w-6 animate-spin" /> : t.report.pim.calculate}
              </Button>
            </Card>
            <Card className="border-accent/30 bg-[#1b263b]/60 shadow-xl p-8 rounded-3xl border-2 flex flex-col justify-between min-h-[320px]">
              <div className="text-center space-y-4">
                <Sparkles className="h-10 w-10 text-accent mx-auto" />
                <h3 className="text-xl font-black uppercase tracking-widest">{t.report.summary.title}</h3>
                {notes['summary'] && <p className="text-xs text-muted-foreground italic text-left p-4 bg-background/40 rounded-xl max-h-[140px] overflow-y-auto leading-relaxed">{notes['summary']}</p>}
              </div>
              <Button type="button" variant="secondary" onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="h-16 font-black uppercase text-[13px] rounded-2xl shadow-2xl active:scale-95 transition-all">
                {isGeneratingSummary ? <Loader2 className="h-6 w-6 animate-spin" /> : t.report.summary.generate}
              </Button>
            </Card>
          </div>
          <div className="flex justify-start pt-6">
            <Button type="button" variant="ghost" onClick={() => setActiveTab("evaluation")} className="px-6 py-6 font-bold text-[11px] uppercase text-muted-foreground flex-1 sm:flex-none">
              <ChevronLeft className="mr-2 h-4 w-4" /> {t.report.actions.previous}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
