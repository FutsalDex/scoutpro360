"use client"

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TacticalCanvas } from "./tactical-canvas";
import { FileText, ChevronRight, ChevronLeft, Activity, User, Target, Shield, Zap as ZapIcon, Heart, Save, Star, Plus, Loader2 } from "lucide-react";
import { TACTICAL_ROLES, type TacticalRoleConfig, type KPISection } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n/context';
import { cn } from "@/lib/utils";
import { savePlayer, saveReport } from "@/lib/services/db-service";
import { auth } from "@/lib/firebase/config";
import { ALL_COUNTRIES } from "@/lib/data/countries";

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
  <div className="flex flex-col gap-3 py-4 border-b border-border/10 last:border-0 group">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <Label className="text-[10px] font-bold uppercase sm:w-44 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">{kpi}</Label>
      <div className="flex gap-1.5 shrink-0 justify-between sm:justify-start w-full sm:w-auto">
        {[1, 2, 3, 4, 5].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onRatingChange(num)}
            className={cn(
              "h-9 w-9 sm:h-8 sm:w-8 rounded-full border border-border/40 text-[11px] font-bold flex items-center justify-center transition-all shrink-0",
              rating === num ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg" : "bg-secondary/20 hover:border-primary/50 text-muted-foreground"
            )}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
    <Input 
      className="h-9 text-[11px] bg-secondary/5 border-none shadow-none focus-visible:ring-1 border-b border-border/20 rounded-none italic placeholder:opacity-40" 
      placeholder="Nota..." 
      value={note || ""}
      onChange={(e) => onNoteChange(e.target.value)}
    />
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
          <CardContent className="pt-4 sm:pt-6 space-y-1.5 px-4 sm:px-6">
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
            <CardContent className="pt-4 sm:pt-6 space-y-1.5 px-4 sm:px-6">
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

      <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 sm:pt-10 max-w-5xl mx-auto">
        <Button variant="ghost" onClick={() => setActiveTab(prevTab)} className="px-6 py-5 sm:px-10 sm:py-6 font-bold text-[11px] uppercase text-muted-foreground hover:text-foreground">
          <ChevronLeft className="mr-3 h-4 w-4" /> {t.report.actions.previous}
        </Button>
        <Button onClick={() => setActiveTab(nextTab)} className="px-10 py-5 sm:px-16 sm:py-6 bg-primary text-primary-foreground hover:bg-primary/90 font-bold shadow-2xl rounded-xl text-[12px] sm:text-[13px] transition-all transform hover:scale-105">
          {t.report.actions.next} <ChevronRight className="ml-3 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export function ReportForm() {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const [activeTab, setActiveTab] = useState("player");
  const [activeRole, setActiveRole] = useState<TacticalRoleConfig>(TACTICAL_ROLES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

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
  const [scoutName, setScoutName] = useState(auth.currentUser?.displayName || "");

  const handleRatingChange = (kpi: string, value: number) => {
    setRatings(prev => ({ ...prev, [kpi]: value }));
  };

  const handleNoteChange = (kpi: string, value: string) => {
    setNotes(prev => ({ ...prev, [kpi]: value }));
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
        currentPIM: 0,
        tacticalRole: activeRole.name,
        grade: 'C'
      });

      await saveReport({
        playerId,
        playerName,
        scoutId: auth.currentUser?.uid || "guest",
        scoutName: scoutName || "Invitado",
        pimScore: 0,
        summary: "",
        ratings: ratings,
        notes: notes,
        createdAt: null
      });

      toast({ title: "¡Éxito!", description: "El informe ha sido guardado correctamente." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error al guardar" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-32 max-w-[1400px] mx-auto w-full px-1">
      <div className="flex flex-col gap-4 bg-card/80 backdrop-blur-xl p-4 sm:p-8 rounded-2xl border border-border/50 shadow-2xl sticky top-0 sm:top-20 z-40">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shrink-0">
              <FileText className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
            </div>
            <div className="space-y-0.5 sm:space-y-1">
              <h1 className="text-xl sm:text-3xl font-black font-headline uppercase tracking-tight text-foreground leading-tight">{t.report.title}</h1>
              <p className="text-[9px] sm:text-[11px] text-primary font-bold uppercase tracking-[0.15em] sm:tracking-[0.25em]">{t.report.subtitle}</p>
            </div>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none h-10 px-3 bg-background/50 text-[9px] sm:text-[10px] font-bold border-border/50 uppercase tracking-widest"
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
        <TabsList className="w-full flex bg-secondary/15 h-auto p-1.5 border border-border/20 rounded-2xl mb-6 shadow-inner flex-wrap justify-center">
          {Object.entries(t.report.tabs).map(([key, label], idx) => (
            <TabsTrigger 
              key={key} 
              value={key} 
              className="flex-none sm:flex-1 text-[9px] sm:text-[11px] font-black tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all rounded-lg h-9 sm:h-11 border border-transparent m-1 px-3"
            >
              <span className="mr-1 opacity-40 font-code">{idx + 1}</span>
              {label as string}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="player" className="animate-in fade-in slide-in-from-bottom-2 space-y-8">
          <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#007b83] px-4 py-3 flex items-center gap-3 border-b border-white/10">
              <User className="h-4 w-4 text-white" />
              <h2 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.playerInfo.title}</h2>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3 space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.name}</Label>
                  <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium" placeholder="Nombre del jugador" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.dorsal}</Label>
                  <Input value={dorsal} onChange={(e) => setDorsal(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium text-center" placeholder="-" />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.club}</Label>
                  <Input value={clubName} onChange={(e) => setClubName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium" placeholder="Club" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.rival}</Label>
                  <Input value={rivalName} onChange={(e) => setRivalName(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium" placeholder="vs" />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.competition}</Label>
                  <Input value={competition} onChange={(e) => setCompetition(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium" placeholder="Liga / Copa" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.matchDate}</Label>
                  <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium" />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.birthDate}</Label>
                  <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.nationality}</Label>
                  <Select value={nationality} onValueChange={setNationality}>
                    <SelectTrigger className="h-10 bg-secondary/10 border-border/20 font-medium">
                      <SelectValue placeholder="-" />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.marketValue}</Label>
                  <Input value={marketValue} onChange={(e) => setMarketValue(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium" placeholder="€0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.height}</Label>
                  <Input value={height} onChange={(e) => setHeight(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium text-center" placeholder="-" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.weight}</Label>
                  <Input value={weight} onChange={(e) => setWeight(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium text-center" placeholder="-" />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.minPlayed}</Label>
                  <Input value={minPlayed} onChange={(e) => setMinPlayed(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium text-center" placeholder="90" />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.primaryPos}</Label>
                  <Select onValueChange={(v) => setActiveRole(TACTICAL_ROLES.find(r => r.id === v) || TACTICAL_ROLES[0])}>
                    <SelectTrigger className="h-10 bg-secondary/10 border-border/20 text-[10px] font-black uppercase">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TACTICAL_ROLES.map(role => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.secondaryPos}</Label>
                  <Input value={secondaryPositions} onChange={(e) => setSecondaryPositions(e.target.value)} className="h-10 bg-secondary/10 border-border/20 font-medium" placeholder="Ej: ED, MCO" />
                </div>

                <div className="md:col-span-4 space-y-3">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.dominantFoot}</Label>
                  <div className="flex gap-2">
                    {['Derecho', 'Izquierdo', 'Ambos'].map(foot => (
                      <Button
                        key={foot}
                        variant={dominantFoot === foot ? 'default' : 'outline'}
                        onClick={() => setDominantFoot(foot)}
                        className="h-8 rounded-full px-4 text-[10px] font-medium"
                      >
                        {foot}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-4 space-y-3">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.physicalCondition}</Label>
                  <div className="flex flex-wrap gap-2">
                    {['Excelente', 'Buena', 'Normal', 'Bajo su nivel', 'Lesionado'].map(cond => (
                      <Button
                        key={cond}
                        variant={physicalCondition === cond ? 'default' : 'outline'}
                        onClick={() => setPhysicalCondition(cond)}
                        className="h-8 rounded-full px-4 text-[10px] font-medium"
                      >
                        {cond}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-4 py-3 flex items-center gap-3 border-b border-white/10">
              <Star className="h-4 w-4 text-white fill-white" />
              <h2 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.generalProfile.title}</h2>
            </div>
            <CardContent className="p-0">
              <div className="divide-y divide-border/10">
                <RatingRow kpi={t.report.generalProfile.techLevel} rating={ratings['gen_tech']} onRatingChange={(v) => handleRatingChange('gen_tech', v)} note={notes['gen_tech']} onNoteChange={(v) => handleNoteChange('gen_tech', v)} />
                <RatingRow kpi={t.report.generalProfile.tacticalIntel} rating={ratings['gen_tact']} onRatingChange={(v) => handleRatingChange('gen_tact', v)} note={notes['gen_tact']} onNoteChange={(v) => handleNoteChange('gen_tact', v)} />
                <RatingRow kpi={t.report.generalProfile.physQuality} rating={ratings['gen_phys']} onRatingChange={(v) => handleRatingChange('gen_phys', v)} note={notes['gen_phys']} onNoteChange={(v) => handleNoteChange('gen_phys', v)} />
                <RatingRow kpi={t.report.generalProfile.mentalStrength} rating={ratings['gen_ment']} onRatingChange={(v) => handleRatingChange('gen_ment', v)} note={notes['gen_ment']} onNoteChange={(v) => handleNoteChange('gen_ment', v)} />
                <RatingRow kpi={t.report.generalProfile.potential} rating={ratings['gen_pote']} onRatingChange={(v) => handleRatingChange('gen_pote', v)} note={notes['gen_pote']} onNoteChange={(v) => handleNoteChange('gen_pote', v)} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mt-10">
            <Button onClick={() => setActiveTab("context")} className="w-full sm:w-auto px-12 py-7 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-2xl text-[14px] transition-all transform hover:scale-105 group">
              {t.report.actions.next}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="context" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#007b83] px-4 py-3 flex items-center gap-3 border-b border-white/10">
                <Target className="h-4 w-4 text-white" />
                <h2 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.matchContext.title}</h2>
              </div>
              <CardContent className="pt-6 space-y-8 px-4 sm:px-8">
                <div className="space-y-4">
                  <Label className="text-[9px] font-black text-primary uppercase tracking-widest">{t.report.matchContext.playStyle}</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(t.report.matchContext.styles).map(([key, label]) => (
                      <Button
                        key={key}
                        variant="outline"
                        size="sm"
                        className="h-10 px-4 text-[9px] font-black uppercase rounded-full border-border/30"
                      >
                        {label as string}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl flex flex-col bg-card/40 backdrop-blur-md">
              <div className="bg-[#007b83] px-4 py-3 flex items-center gap-3 border-b border-white/10">
                <Target className="h-4 w-4 text-white" />
                <h2 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.pitch.title}</h2>
              </div>
              <CardContent className="pt-4 flex flex-col items-center justify-center p-4">
                <TacticalCanvas />
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-10 pt-6 border-t border-border/20">
            <Button variant="ghost" onClick={() => setActiveTab("player")} className="order-2 sm:order-1 px-8 py-5 font-black text-xs uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-3 h-4" /> {t.report.actions.previous}
            </Button>
            <Button onClick={() => setActiveTab("technical")} className="order-1 sm:order-2 px-12 py-7 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-2xl text-[14px] transition-all transform hover:scale-105">
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
              <h2 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.sections.actions_title}</h2>
            </div>
            <CardContent className="p-4 space-y-4">
              <Button variant="ghost" className="w-full h-12 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-2 border-dashed border-border/20">
                <Plus className="h-4 w-4 mr-2" /> {t.report.actions.addEvent}
              </Button>
            </CardContent>
          </Card>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-10 pt-6 border-t border-border/20">
            <Button variant="ghost" onClick={() => setActiveTab("mental")} className="order-2 sm:order-1 px-8 py-5 font-black text-xs uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-3 h-4" /> {t.report.actions.previous}
            </Button>
            <Button onClick={() => setActiveTab("evaluation")} className="order-1 sm:order-2 px-12 py-7 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-2xl text-[14px] transition-all transform hover:scale-105">
              {t.report.actions.next}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="mt-6 animate-in fade-in slide-in-from-bottom-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#2e7d32] px-4 py-3 flex items-center gap-3 border-b border-white/10">
                <Star className="h-4 w-4 text-white" />
                <h2 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-[0.15em]">{t.report.final_evaluation.strengths.title}</h2>
              </div>
              <CardContent className="pt-6 space-y-6 px-4 sm:px-8">
                <div className="space-y-3">
                  <Label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.strengths.strengths_title}</Label>
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[9px] font-bold text-muted-foreground w-4">{i}.</span>
                      <Input className="h-10 bg-secondary/10 border-border/20 text-[11px]" placeholder="Fortaleza..." />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-10 pt-6 border-t border-border/20">
            <Button variant="ghost" onClick={() => setActiveTab("actions")} className="order-2 sm:order-1 px-8 py-5 font-black text-xs uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-3 h-4" /> {t.report.actions.previous}
            </Button>
            <Button onClick={() => setActiveTab("analytics")} className="order-1 sm:order-2 px-12 py-7 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-2xl text-[14px] transition-all transform hover:scale-105">
              {t.report.actions.next}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6 animate-in zoom-in-95 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-primary/20 bg-primary/5 shadow-inner p-6 sm:p-10 rounded-3xl border-2">
              <div className="text-center space-y-8">
                <h3 className="text-xl sm:text-2xl font-black font-headline uppercase tracking-[0.15em] text-foreground">{t.report.pim.title}</h3>
                <Button className="w-full h-14 bg-primary text-primary-foreground font-black tracking-[0.2em] text-[14px] rounded-2xl shadow-2xl">
                  {t.report.pim.calculate}
                </Button>
              </div>
            </Card>
            <Card className="border-accent/20 bg-accent/5 shadow-inner p-6 sm:p-10 rounded-3xl border-2">
              <div className="text-center space-y-8">
                <h3 className="text-xl sm:text-2xl font-black font-headline uppercase tracking-[0.15em] text-foreground">{t.report.summary.title}</h3>
                <Button variant="secondary" className="w-full h-14 font-black tracking-[0.2em] text-[12px] rounded-2xl shadow-2xl border-accent/30 uppercase">
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