"use client"

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TacticalCanvas } from "./tactical-canvas";
import { FileText, ChevronRight, ChevronLeft, Activity, User, Target, Brain, Shield, Zap as ZapIcon, Heart, Save, Layers, Sun, Cloud, CloudRain, Wind, Clipboard, Star, Award, Search, CheckCircle2 } from "lucide-react";
import { TACTICAL_ROLES, type TacticalRoleConfig, type KPISection } from "@/lib/types";
import { calculatePlayerImpactMetric } from "@/ai/flows/calculate-player-impact-metric-flow";
import { generateExecutiveSummary } from "@/ai/flows/generate-executive-summary";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n/context';
import { cn } from "@/lib/utils";

interface ActionRow {
  id: string;
  min: string;
  action: string;
  result: string;
  notes: string;
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
  <div className="flex items-center justify-between gap-4 py-1.5 border-b border-border/10 last:border-0 group">
    <Label className="text-[10px] font-bold uppercase w-44 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">{kpi}</Label>
    <div className="flex gap-1.5 shrink-0">
      {[1, 2, 3, 4, 5].map(num => (
        <button
          key={num}
          type="button"
          onClick={() => onRatingChange(num)}
          className={cn(
            "h-8 w-8 rounded-full border border-border/40 text-[11px] font-bold flex items-center justify-center transition-all",
            rating === num ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg" : "bg-secondary/20 hover:border-primary/50 text-muted-foreground"
          )}
        >
          {num}
        </button>
      ))}
    </div>
    <Input 
      className="h-8 text-[11px] bg-secondary/5 border-none shadow-none focus-visible:ring-1 flex-grow ml-6 border-b border-border/20 rounded-none italic placeholder:opacity-40" 
      placeholder="Observación / contexto..." 
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
      <div className={cn("grid grid-cols-1 gap-6", hasImpactColumn ? "lg:grid-cols-2" : "lg:max-w-5xl mx-auto")}>
        <Card className="border-border/40 shadow-xl overflow-hidden rounded-xl bg-card/40 backdrop-blur-md">
          <div className="bg-[#1b263b] px-5 py-3 flex items-center gap-2 border-b border-primary/20">
            <Icon className="h-4 w-4 text-primary" />
            <h2 className="text-[11px] font-bold text-white uppercase tracking-wider">{t.report.sections[`${tabType}_obs`]}</h2>
          </div>
          <CardContent className="pt-8 space-y-1.5">
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
            <div className="bg-[#1b263b] px-5 py-3 flex items-center gap-2 border-b border-accent/20">
              <Activity className="h-4 w-4 text-accent" />
              <h2 className="text-[11px] font-bold text-white uppercase tracking-wider">{t.report.sections[`${tabType}_impact`]}</h2>
            </div>
            <CardContent className="pt-8 space-y-1.5">
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

      <div className="flex justify-between pt-10 max-w-5xl mx-auto">
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

export function ReportForm() {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState("player");
  const [activeRole, setActiveRole] = useState<TacticalRoleConfig>(TACTICAL_ROLES[0]);
  const [isCalculatingPIM, setIsCalculatingPIM] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [pimScore, setPimScore] = useState<number | null>(null);
  const [summary, setSummary] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [playerName, setPlayerName] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [contextData, setContextData] = useState<Record<string, string | string[]>>({});
  const [actionRows, setActionRows] = useState<ActionRow[]>([
    { id: '1', min: '', action: '', result: '', notes: '' },
    { id: '2', min: '', action: '', result: '', notes: '' },
    { id: '3', min: '', action: '', result: '', notes: '' },
    { id: '4', min: '', action: '', result: '', notes: '' },
    { id: '5', min: '', action: '', result: '', notes: '' },
  ]);

  const handleRatingChange = (kpi: string, value: number) => {
    setRatings(prev => ({ ...prev, [kpi]: value }));
  };

  const handleNoteChange = (kpi: string, value: string) => {
    setNotes(prev => ({ ...prev, [kpi]: value }));
  };

  const toggleRole = (roleKey: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleKey) ? prev.filter(r => r !== roleKey) : [...prev, roleKey]
    );
  };

  const handleContextChange = (key: string, value: any) => {
    setContextData(prev => ({ ...prev, [key]: value }));
  };

  const toggleContextMulti = (key: string, value: string) => {
    const current = (contextData[key] as string[]) || [];
    const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
    handleContextChange(key, updated);
  };

  const handleActionChange = (id: string, field: keyof ActionRow, value: string) => {
    setActionRows(prev => prev.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleAddActionRow = () => {
    setActionRows(prev => [...prev, { id: Date.now().toString(), min: '', action: '', result: '', notes: '' }]);
  };

  const handleSaveReport = () => {
    toast({
      title: t.report.actions.save,
      description: "Report draft saved successfully.",
    });
  };

  const handleCalculatePIM = async () => {
    setIsCalculatingPIM(true);
    try {
      const result = await calculatePlayerImpactMetric({
        playerId: "p1",
        currentEvaluation: {
          tacticalRole: activeRole.name,
          metrics: { technical: ratings, tactical: {}, physical: {}, mental: {} }
        },
        historicalClubData: JSON.stringify([{ tacticalRole: activeRole.name, avgPIM: 72 }])
      });
      setPimScore(result.playerImpactMetric);
    } catch (e) {
      toast({ variant: "destructive", title: "Error calculating PIM" });
    } finally {
      setIsCalculatingPIM(false);
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const result = await generateExecutiveSummary({
        playerName: playerName || "Subject",
        tacticalRole: activeRole.name,
        metrics: { Technical: ratings },
        scoutNotes: `Evaluated in roles: ${activeRole.name}. Global technical level: ${ratings.technicalLevel || 3}/5. Global tactical intelligence: ${ratings.tacticalIntel || 3}/5.`,
        language: language as 'en' | 'es'
      });
      setSummary(result.summary);
    } catch (e) {
      toast({ variant: "destructive", title: "Error generating summary" });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="space-y-8 pb-32 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/80 backdrop-blur-xl p-8 rounded-2xl border border-border/50 shadow-2xl sticky top-20 z-40">
        <div className="flex items-center gap-6">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-inner">
            <FileText className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-foreground">{t.report.title}</h1>
            <p className="text-[11px] text-primary font-bold uppercase tracking-[0.25em]">{t.report.subtitle}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 px-6 bg-background/50 text-[10px] font-bold border-border/50 hover:bg-secondary transition-all uppercase tracking-widest" onClick={handleSaveReport}>
              <Save className="h-4 w-4 mr-2.5" /> {t.report.actions.save}
            </Button>
            <Button variant="outline" className="h-11 px-6 bg-background/50 text-[10px] font-bold border-border/50 hover:bg-secondary transition-all uppercase tracking-widest">
              <Clipboard className="h-4 w-4 mr-2.5" /> {t.report.actions.export}
            </Button>
          </div>
          <Button className="h-12 w-full bg-primary text-primary-foreground font-black text-[12px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 rounded-xl hover:scale-[1.02] transition-transform">
            {t.report.actions.submit}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex justify-between bg-secondary/15 h-14 p-1.5 border border-border/20 rounded-2xl overflow-x-auto no-scrollbar mb-10 shadow-inner">
          {Object.entries(t.report.tabs).map(([key, label]) => (
            <TabsTrigger 
              key={key} 
              value={key} 
              className="flex-1 text-[11px] font-black tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl transition-all rounded-xl h-full border border-transparent data-[state=active]:border-primary/20"
            >
              <span className="mr-2.5 opacity-40 font-code">{Object.keys(t.report.tabs).indexOf(key) + 1}</span>
              {label as string}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="player" className="animate-in fade-in slide-in-from-bottom-2 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <div className="space-y-10">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#007b83] px-6 py-4 flex items-center gap-4 border-b border-white/10">
                  <User className="h-5 w-5 text-white" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">1 {t.report.playerInfo.title}</h2>
                </div>
                <CardContent className="pt-10 grid grid-cols-2 gap-6 px-8">
                  <div className="col-span-1 space-y-2.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.name}</Label>
                    <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="h-11 bg-secondary/10 border-border/20 focus:border-primary/50 transition-all font-medium" placeholder="Nombre completo" />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.number}</Label>
                    <Input className="h-11 bg-secondary/10 border-border/20 font-medium" placeholder="-" />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.club}</Label>
                    <Input className="h-11 bg-secondary/10 border-border/20 font-medium" placeholder="Club" />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.rival}</Label>
                    <Input className="h-11 bg-secondary/10 border-border/20 font-medium" placeholder="vs" />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.competition}</Label>
                    <Input className="h-11 bg-secondary/10 border-border/20 font-medium" placeholder="Liga / Copa" />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.date}</Label>
                    <Input type="date" className="h-11 bg-secondary/10 border-border/20" />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.birthDate}</Label>
                    <Input type="date" className="h-11 bg-secondary/10 border-border/20" />
                  </div>
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.nationality}</Label>
                    <Input className="h-11 bg-secondary/10 border-border/20 font-medium" placeholder="-" />
                  </div>
                  <div className="grid grid-cols-3 col-span-2 gap-6">
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.height}</Label>
                      <Input className="h-11 bg-secondary/10 border-border/20 text-center font-bold" placeholder="-" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.weight}</Label>
                      <Input className="h-11 bg-secondary/10 border-border/20 text-center font-bold" placeholder="-" />
                    </div>
                    <div className="space-y-2.5">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.minutes}</Label>
                      <Input className="h-11 bg-secondary/10 border-border/20 text-center font-bold" placeholder="90" />
                    </div>
                  </div>
                  <div className="col-span-1 space-y-2.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.primaryPos}</Label>
                    <Select onValueChange={(v) => setActiveRole(TACTICAL_ROLES.find(r => r.id === v) || TACTICAL_ROLES[0])}>
                      <SelectTrigger className="h-11 bg-secondary/10 border-border/20 text-[11px] font-black uppercase">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {TACTICAL_ROLES.map(role => (
                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 space-y-2.5">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.playerInfo.secondaryPos}</Label>
                    <Input className="h-11 bg-secondary/10 border-border/20 font-medium" placeholder="Ej: ED, MCO" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-10">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl flex flex-col bg-card/40 backdrop-blur-md">
                <div className="bg-[#007b83] px-6 py-4 flex items-center gap-4 border-b border-white/10">
                  <Target className="h-5 w-5 text-white" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">2 {t.report.pitch.title}</h2>
                </div>
                <CardContent className="pt-6 flex flex-col items-center justify-center flex-grow bg-transparent p-10">
                  <TacticalCanvas />
                </CardContent>
              </Card>

              <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-4 border-b border-white/10">
                  <Layers className="h-5 w-5 text-primary" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">{t.report.roles.title}</h2>
                </div>
                <CardContent className="pt-10 p-8">
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(t.report.roles).filter(([k]) => k !== 'title').map(([key, label]) => (
                      <Button 
                        key={key} 
                        variant="outline" 
                        size="sm" 
                        type="button"
                        onClick={() => toggleRole(key)}
                        className={cn(
                          "h-11 px-6 text-[11px] font-black uppercase rounded-full border-border/30 transition-all",
                          selectedRoles.includes(key) 
                            ? "bg-primary text-primary-foreground border-primary shadow-2xl scale-105" 
                            : "bg-secondary/15 hover:bg-secondary/30 text-muted-foreground"
                        )}
                      >
                        {label as string}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="border-border/40 shadow-2xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md mt-10">
            <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-4 border-b border-white/10">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">3 {t.report.globalProfile.title}</h2>
            </div>
            <CardContent className="pt-10 space-y-1.5 px-10">
              {Object.entries(t.report.globalProfile).filter(([k]) => k !== 'title').map(([key, label]) => (
                <RatingRow 
                  key={key} 
                  kpi={label as string} 
                  rating={ratings[key]}
                  onRatingChange={(val) => handleRatingChange(key, val)}
                  note={notes[key]}
                  onNoteChange={(val) => handleNoteChange(key, val)}
                />
              ))}
            </CardContent>
          </Card>
          
          <div className="flex justify-end mt-16">
            <Button onClick={() => setActiveTab("context")} className="px-20 py-8 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-2xl text-[16px] transition-all transform hover:scale-105 group">
              {t.report.actions.next} <ChevronRight className="ml-4 h-6 w-6 group-hover:translate-x-3 transition-transform" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="context" className="animate-in fade-in slide-in-from-bottom-2 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#007b83] px-6 py-4 flex items-center gap-4 border-b border-white/10">
                <Target className="h-5 w-5 text-white" />
                <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">{t.report.matchContext.title}</h2>
              </div>
              <CardContent className="pt-10 space-y-10 px-8">
                <div className="space-y-6">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t.report.matchContext.playStyle}</Label>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(t.report.matchContext.styles).map(([key, label]) => (
                      <Button
                        key={key}
                        variant="outline"
                        type="button"
                        onClick={() => handleContextChange('playStyle', key)}
                        className={cn(
                          "h-11 px-6 text-[10px] font-black uppercase rounded-full border-border/30 transition-all",
                          contextData.playStyle === key ? "bg-primary text-primary-foreground border-primary shadow-xl" : "bg-secondary/15"
                        )}
                      >
                        {label as string}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t.report.matchContext.formation}</Label>
                    <Input className="h-11 bg-secondary/10 border-border/20 font-bold" placeholder="Ej: 4-3-3" onChange={(e) => handleContextChange('formation', e.target.value)} />
                  </div>
                  <div className="space-y-6">
                    <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t.report.matchContext.tempo}</Label>
                    <div className="flex gap-3">
                      {Object.entries(t.report.matchContext.tempos).map(([key, label]) => (
                        <Button key={key} type="button" onClick={() => handleContextChange('tempo', key)} className={cn("flex-1 h-11 text-[10px] font-black uppercase", contextData.tempo === key ? "bg-primary text-primary-foreground" : "bg-secondary/15 text-muted-foreground")}>{label as string}</Button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t.report.matchContext.weather}</Label>
                  <div className="flex flex-wrap gap-8 bg-secondary/10 p-6 rounded-2xl border border-border/10 shadow-inner">
                    <button type="button" onClick={() => handleContextChange('weather', 'sun')} className={cn("flex items-center gap-3 text-[11px] font-black uppercase transition-all", contextData.weather === 'sun' ? "text-primary scale-110" : "text-muted-foreground")}>
                      <Sun className="h-5 w-5" /> {t.report.matchContext.weathers.sun}
                    </button>
                    <button type="button" onClick={() => handleContextChange('weather', 'cloudy')} className={cn("flex items-center gap-3 text-[11px] font-black uppercase transition-all", contextData.weather === 'cloudy' ? "text-primary scale-110" : "text-muted-foreground")}>
                      <Cloud className="h-5 w-5" /> {t.report.matchContext.weathers.cloudy}
                    </button>
                    <button type="button" onClick={() => handleContextChange('weather', 'rain')} className={cn("flex items-center gap-3 text-[11px] font-black uppercase transition-all", contextData.weather === 'rain' ? "text-primary scale-110" : "text-muted-foreground")}>
                      <CloudRain className="h-5 w-5" /> {t.report.matchContext.weathers.rain}
                    </button>
                    <button type="button" onClick={() => handleContextChange('weather', 'wind')} className={cn("flex items-center gap-3 text-[11px] font-black uppercase transition-all", contextData.weather === 'wind' ? "text-primary scale-110" : "text-muted-foreground")}>
                      <Wind className="h-5 w-5" /> {t.report.matchContext.weathers.wind}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
              <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-4 border-b border-white/10">
                <Layers className="h-5 w-5 text-primary" />
                <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">{t.report.offBall.title}</h2>
              </div>
              <CardContent className="pt-10 space-y-10 px-8">
                <div className="space-y-6">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t.report.offBall.noPossession}</Label>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(t.report.offBall.actions).map(([key, label]) => (
                      <Button key={key} type="button" onClick={() => toggleContextMulti('offBallActions', key)} className={cn("h-10 px-5 text-[10px] font-black uppercase rounded-xl transition-all", ((contextData.offBallActions as string[]) || []).includes(key) ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary/15 text-muted-foreground")}>{label as string}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t.report.offBall.bodyLanguage}</Label>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(t.report.offBall.bodyLanguages).map(([key, label]) => (
                      <Button key={key} type="button" onClick={() => handleContextChange('bodyLanguage', key)} className={cn("h-10 px-5 text-[10px] font-black uppercase rounded-xl transition-all", contextData.bodyLanguage === key ? "bg-primary text-primary-foreground shadow-lg" : "bg-secondary/15 text-muted-foreground")}>{label as string}</Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-6">
                  <Label className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t.report.offBall.tacticalRole}</Label>
                  <Textarea className="min-h-[140px] bg-secondary/10 border-border/20 text-[11px] leading-relaxed italic placeholder:opacity-40 rounded-xl" placeholder="Describe el rol táctico asignado..." onChange={(e) => handleContextChange('tacticalRoleDesc', e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between mt-16 pt-10 border-t border-border/20">
            <Button variant="ghost" onClick={() => setActiveTab("player")} className="px-12 py-7 font-black text-sm uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-4 h-5 w-5" /> {t.report.actions.previous}
            </Button>
            <Button onClick={() => setActiveTab("technical")} className="px-20 py-8 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-2xl text-[16px] transition-all transform hover:scale-105">
              {t.report.actions.next} <ChevronRight className="ml-4 h-6 w-6" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="mt-10">
           <EvaluationModule 
             t={t}
             icon={Shield} 
             kpiSection={activeRole.kpis.technical} 
             nextTab="tactical" 
             prevTab="context"
             tabType="technical"
             ratings={ratings}
             onRatingChange={handleRatingChange}
             notes={notes}
             onNoteChange={handleNoteChange}
             setActiveTab={setActiveTab}
           />
        </TabsContent>

        <TabsContent value="tactical" className="mt-10">
           <EvaluationModule 
             t={t}
             icon={Shield} 
             kpiSection={activeRole.kpis.tactical} 
             nextTab="physical" 
             prevTab="technical"
             tabType="tactical"
             ratings={ratings}
             onRatingChange={handleRatingChange}
             notes={notes}
             onNoteChange={handleNoteChange}
             setActiveTab={setActiveTab}
           />
        </TabsContent>

        <TabsContent value="physical" className="mt-10">
           <EvaluationModule 
             t={t}
             icon={ZapIcon} 
             kpiSection={activeRole.kpis.physical} 
             nextTab="mental" 
             prevTab="tactical"
             tabType="physical"
             ratings={ratings}
             onRatingChange={handleRatingChange}
             notes={notes}
             onNoteChange={handleNoteChange}
             setActiveTab={setActiveTab}
           />
        </TabsContent>

        <TabsContent value="mental" className="mt-10">
           <EvaluationModule 
             t={t}
             icon={Heart} 
             kpiSection={activeRole.kpis.mental} 
             nextTab="actions" 
             prevTab="physical"
             tabType="mental"
             ratings={ratings}
             onRatingChange={handleRatingChange}
             notes={notes}
             onNoteChange={handleNoteChange}
             setActiveTab={setActiveTab}
           />
        </TabsContent>

        <TabsContent value="actions" className="mt-10 animate-in fade-in slide-in-from-bottom-2 space-y-10">
          <Card className="border-border/40 shadow-2xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
            <div className="bg-[#1b263b] px-6 py-4 flex items-center gap-4 border-b border-primary/20">
              <Star className="h-5 w-5 text-primary fill-primary" />
              <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">{t.report.sections.actions_title}</h2>
            </div>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-[#1b263b]/90 border-b border-white/5">
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/70 w-20">{t.report.actions.min}</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/70 w-52">{t.report.actions.action}</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/70 w-52">{t.report.actions.result}</th>
                    <th className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white/70">{t.report.actions.notes}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {actionRows.map((row) => (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                      <td className="px-4 py-1.5">
                        <Input 
                          value={row.min} 
                          onChange={(e) => handleActionChange(row.id, 'min', e.target.value)} 
                          className="h-9 bg-transparent border-none text-[11px] font-bold text-center placeholder:opacity-20"
                          placeholder="-' "
                        />
                      </td>
                      <td className="px-4 py-1.5">
                        <Input 
                          value={row.action} 
                          onChange={(e) => handleActionChange(row.id, 'action', e.target.value)} 
                          className="h-9 bg-transparent border-none text-[11px] font-medium placeholder:opacity-20"
                          placeholder="Tipo de acción..."
                        />
                      </td>
                      <td className="px-4 py-1.5">
                        <Input 
                          value={row.result} 
                          onChange={(e) => handleActionChange(row.id, 'result', e.target.value)} 
                          className="h-9 bg-transparent border-none text-[11px] font-medium placeholder:opacity-20"
                          placeholder="Resultado..."
                        />
                      </td>
                      <td className="px-4 py-1.5">
                        <Input 
                          value={row.notes} 
                          onChange={(e) => handleActionChange(row.id, 'notes', e.target.value)} 
                          className="h-9 bg-transparent border-none text-[11px] font-medium italic placeholder:opacity-20"
                          placeholder="Observación / contexto..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 border-t border-white/5 flex justify-center bg-secondary/5">
                <Button 
                  onClick={handleAddActionRow} 
                  variant="ghost" 
                  className="w-full h-11 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-all border-2 border-dashed border-border/20 hover:border-primary/50"
                >
                  {t.report.actions.addEvent}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between mt-16 pt-10 border-t border-border/20">
            <Button variant="ghost" onClick={() => setActiveTab("mental")} className="px-12 py-7 font-black text-sm uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-4 h-5 w-5" /> {t.report.actions.previous}
            </Button>
            <Button onClick={() => setActiveTab("evaluation")} className="px-20 py-8 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-2xl text-[16px] transition-all transform hover:scale-105">
              {t.report.actions.next}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="mt-10 animate-in fade-in slide-in-from-bottom-2 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-10">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#2e7d32] px-6 py-4 flex items-center gap-4 border-b border-white/10">
                  <Star className="h-5 w-5 text-white" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">{t.report.final_evaluation.strengths.title}</h2>
                </div>
                <CardContent className="pt-8 space-y-8 px-8">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.strengths.strengths_title}</Label>
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground w-4">{i}.</span>
                        <Input className="h-10 bg-secondary/10 border-border/20" placeholder="Fortaleza..." />
                      </div>
                    ))}
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.strengths.areas_title}</Label>
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-muted-foreground w-4">{i}.</span>
                        <Input className="h-10 bg-secondary/10 border-border/20" placeholder="Área a mejorar..." />
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.strengths.short_term}</Label>
                      <Input className="h-10 bg-secondary/10 border-border/20" placeholder="Desarrollo..." />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.strengths.long_term}</Label>
                      <Input className="h-10 bg-secondary/10 border-border/20" placeholder="Desarrollo..." />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#007b83] px-6 py-4 flex items-center gap-4 border-b border-white/10">
                  <Shield className="h-5 w-5 text-white" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">{t.report.final_evaluation.sign_in.title}</h2>
                </div>
                <CardContent className="pt-8 space-y-8 px-8 pb-10">
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.sign_in.fits_model}</Label>
                    <div className="flex flex-wrap gap-2">
                      {[t.report.final_evaluation.sign_in.options.yes, t.report.final_evaluation.sign_in.options.no, t.report.final_evaluation.sign_in.options.following].map(opt => (
                        <Button key={opt} variant="outline" size="sm" className="px-6 h-10 rounded-full text-[10px] font-bold uppercase tracking-widest border-border/40 bg-secondary/5 hover:bg-secondary/20">
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.sign_in.impact}</Label>
                    <div className="flex flex-wrap gap-2">
                      {[t.report.final_evaluation.sign_in.options.high, t.report.final_evaluation.sign_in.options.medium, t.report.final_evaluation.sign_in.options.low].map(opt => (
                        <Button key={opt} variant="outline" size="sm" className="px-6 h-10 rounded-full text-[10px] font-bold uppercase tracking-widest border-border/40 bg-secondary/5 hover:bg-secondary/20">
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.sign_in.potential}</Label>
                    <div className="flex flex-wrap gap-2">
                      {[t.report.final_evaluation.sign_in.options.elite, t.report.final_evaluation.sign_in.options.high, t.report.final_evaluation.sign_in.options.medium, t.report.final_evaluation.sign_in.options.low].map(opt => (
                        <Button key={opt} variant="outline" size="sm" className="px-6 h-10 rounded-full text-[10px] font-bold uppercase tracking-widest border-border/40 bg-secondary/5 hover:bg-secondary/20">
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.sign_in.risk}</Label>
                    <div className="flex flex-wrap gap-2">
                      {[t.report.final_evaluation.sign_in.options.high, t.report.final_evaluation.sign_in.options.medium, t.report.final_evaluation.sign_in.options.low].map(opt => (
                        <Button key={opt} variant="outline" size="sm" className="px-6 h-10 rounded-full text-[10px] font-bold uppercase tracking-widest border-border/40 bg-secondary/5 hover:bg-secondary/20">
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.sign_in.philosophy}</Label>
                    <div className="flex flex-wrap gap-2">
                      {[t.report.final_evaluation.sign_in.options.yes, t.report.final_evaluation.sign_in.options.no].map(opt => (
                        <Button key={opt} variant="outline" size="sm" className="px-8 h-10 rounded-full text-[10px] font-bold uppercase tracking-widest border-border/40 bg-secondary/5 hover:bg-secondary/20">
                          {opt}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-10">
              <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md">
                <div className="bg-[#007b83] px-6 py-4 flex items-center gap-4 border-b border-white/10">
                  <Star className="h-5 w-5 text-white" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">{t.report.final_evaluation.summary_final.title}</h2>
                </div>
                <CardContent className="pt-8 space-y-6 px-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.summary_final.desc}</Label>
                    <Textarea className="min-h-[100px] bg-secondary/10 border-border/20 text-[11px]" placeholder="Impresión general..." />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.summary_final.comparative}</Label>
                    <Input className="h-10 bg-secondary/10 border-border/20 text-[11px]" placeholder="Similar a..." />
                  </div>
                  <div className="space-y-4">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t.report.final_evaluation.summary_final.rec}</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button className="h-14 bg-[#1b5e20] hover:bg-[#2e7d32] text-white flex flex-col items-center justify-center gap-0.5 rounded-xl shadow-lg">
                        <span className="text-[9px] font-black uppercase leading-tight">FICHAJE INMEDIATO</span>
                        <span className="text-[8px] opacity-70">6 - ÉLITE</span>
                      </Button>
                      <Button className="h-14 bg-[#2e7d32] hover:bg-[#388e3c] text-white flex flex-col items-center justify-center gap-0.5 rounded-xl shadow-lg">
                        <span className="text-[9px] font-black uppercase leading-tight">SEGUIMIENTO</span>
                        <span className="text-[8px] opacity-70">4 - ALTO</span>
                      </Button>
                      <Button className="h-14 bg-[#e65100] hover:bg-[#ef6c00] text-white flex flex-col items-center justify-center gap-0.5 rounded-xl shadow-lg">
                        <span className="text-[9px] font-black uppercase leading-tight">MONITOR PRIORITARIO</span>
                        <span className="text-[8px] opacity-70">3 - BUENO</span>
                      </Button>
                      <Button className="h-14 col-span-3 bg-[#c62828] hover:bg-[#d32f2f] text-white flex flex-col items-center justify-center gap-0.5 rounded-xl shadow-lg">
                        <span className="text-[11px] font-black uppercase leading-tight">REEVALUAR</span>
                        <span className="text-[9px] opacity-70">2 - LIMITADO</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-card/40 backdrop-blur-md border-primary/20">
                <div className="bg-[#E0B050] px-6 py-4 flex items-center gap-4 border-b border-black/10">
                  <Award className="h-5 w-5 text-[#1b263b]" />
                  <h2 className="text-[12px] font-black text-[#1b263b] uppercase tracking-[0.2em]">{t.report.final_evaluation.scout_rating.title}</h2>
                </div>
                <CardContent className="pt-8 px-8 pb-10">
                   <div className="grid grid-cols-5 gap-3">
                     {[
                       { v: 1, l: 'MUY BAJO', c: 'bg-[#c62828]' },
                       { v: 2, l: 'LIMITADO', c: 'bg-[#e65100]' },
                       { v: 3, l: 'BUENO', c: 'bg-[#f9a825]' },
                       { v: 4, l: 'ALTO', c: 'bg-[#2e7d32]' },
                       { v: 5, l: 'ÉLITE', c: 'bg-[#1b5e20]' },
                     ].map(r => (
                       <button key={r.v} className={cn("flex flex-col items-center justify-center gap-2 h-24 rounded-2xl transition-all hover:scale-105 border-2 border-transparent shadow-xl", r.c)}>
                         <span className="text-3xl font-black text-white">{r.v}</span>
                         <span className="text-[8px] font-black text-white/90 uppercase tracking-tighter">{r.l}</span>
                       </button>
                     ))}
                   </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 shadow-xl overflow-hidden rounded-2xl bg-[#1b263b] backdrop-blur-md">
                <div className="bg-primary/20 px-6 py-4 flex items-center gap-4 border-b border-white/5">
                  <Target className="h-5 w-5 text-primary" />
                  <h2 className="text-[12px] font-black text-white uppercase tracking-[0.2em]">{t.report.final_evaluation.decision.title}</h2>
                </div>
                <CardContent className="pt-8 space-y-6 px-8">
                   <div className="space-y-4">
                     <Label className="text-[10px] font-black text-primary/80 uppercase tracking-widest">{t.report.final_evaluation.decision.steps}</Label>
                     <div className="flex flex-wrap gap-2">
                       {['Informe completo', 'Análisis de vídeo', '2ª observación', 'Contactar referencias', 'Validación estadística', 'Revisión médica'].map(step => (
                         <Button key={step} variant="outline" size="sm" className="h-8 rounded-full text-[9px] font-bold border-white/10 hover:bg-white/5">{step}</Button>
                       ))}
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black text-primary/80 uppercase tracking-widest">{t.report.final_evaluation.decision.committee}</Label>
                       <Input className="h-10 bg-white/5 border-white/10 text-[11px]" placeholder="Nombres..." />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-[10px] font-black text-primary/80 uppercase tracking-widest">{t.report.final_evaluation.decision.date}</Label>
                       <Input type="date" className="h-10 bg-white/5 border-white/10 text-[11px]" />
                     </div>
                   </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex justify-between mt-16 pt-10 border-t border-border/20">
            <Button variant="ghost" onClick={() => setActiveTab("actions")} className="px-12 py-7 font-black text-sm uppercase text-muted-foreground hover:text-foreground">
              <ChevronLeft className="mr-4 h-5 w-5" /> {t.report.actions.previous}
            </Button>
            <Button onClick={() => setActiveTab("analytics")} className="px-20 py-8 bg-primary text-primary-foreground hover:bg-primary/90 font-black shadow-2xl rounded-2xl text-[16px] transition-all transform hover:scale-105">
              {t.report.actions.next}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-10 animate-in zoom-in-95 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <Card className="border-primary/20 bg-primary/5 shadow-inner p-12 rounded-3xl group hover:border-primary/40 transition-all border-2">
              <div className="text-center space-y-10">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto border border-primary/20 shadow-xl group-hover:scale-110 transition-transform">
                  <Activity className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-black font-headline uppercase tracking-[0.2em] text-foreground">{t.report.pim.title}</h3>
                <div className="h-44 flex items-center justify-center">
                  {pimScore !== null ? (
                    <div className="text-[110px] font-black text-primary font-headline animate-in zoom-in-50 drop-shadow-[0_15px_40px_rgba(224,176,80,0.5)] leading-none">{pimScore}</div>
                  ) : (
                    <div className="text-muted-foreground/60 italic text-[15px] font-medium uppercase tracking-widest border border-dashed border-border/40 px-10 py-12 rounded-2xl">PIM no calculado</div>
                  )}
                </div>
                <Button 
                  className="w-full h-16 bg-primary text-primary-foreground font-black tracking-[0.25em] text-[16px] rounded-2xl shadow-2xl shadow-primary/30 uppercase transition-all hover:scale-[1.02]" 
                  onClick={handleCalculatePIM}
                  disabled={isCalculatingPIM}
                >
                  {isCalculatingPIM ? t.report.pim.calculating : t.report.pim.calculate}
                </Button>
              </div>
            </Card>

            <Card className="border-accent/20 bg-accent/5 shadow-inner p-12 rounded-3xl group hover:border-accent/40 transition-all border-2">
              <div className="text-center space-y-10">
                <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto border border-accent/20 shadow-xl group-hover:scale-110 transition-transform">
                  <Award className="h-10 w-10 text-accent" />
                </div>
                <h3 className="text-2xl font-black font-headline uppercase tracking-[0.2em] text-foreground">{t.report.summary.title}</h3>
                <div className="min-h-44 flex items-center justify-center border-2 border-dashed border-accent/30 rounded-2xl bg-background/50 p-8 text-left shadow-inner">
                  <p className="text-[14px] text-foreground/90 italic leading-relaxed font-medium">
                    {summary || t.report.summary.placeholder}
                  </p>
                </div>
                <Button 
                    variant="secondary" 
                    className="w-full h-16 font-black tracking-[0.25em] text-[14px] rounded-2xl shadow-2xl border-accent/30 uppercase transition-all hover:scale-[1.02]"
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                >
                  {isGeneratingSummary ? t.report.summary.generating : t.report.summary.generate}
                </Button>
              </div>
            </Card>
          </div>
          <div className="flex justify-start mt-16 pt-10 border-t border-border/20">
            <Button variant="ghost" onClick={() => setActiveTab("evaluation")} className="px-12 py-7 font-black text-sm uppercase text-muted-foreground hover:text-foreground group">
              <ChevronLeft className="mr-4 h-5 w-5 group-hover:-translate-x-2 transition-transform" /> {t.report.actions.previous}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
