
"use client"

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TacticalCanvas } from "./tactical-canvas";
import { FileText, ChevronRight, Activity, User, Target, Brain, Zap, Sword, Award, Clipboard, Shield, Zap as ZapIcon, Heart } from "lucide-react";
import { TACTICAL_ROLES, type TacticalRoleConfig } from "@/lib/types";
import { calculatePlayerImpactMetric } from "@/ai/flows/calculate-player-impact-metric-flow";
import { generateExecutiveSummary } from "@/ai/flows/generate-executive-summary";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n/context';
import { cn } from "@/lib/utils";

export function ReportForm() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("player");
  const [activeRole, setActiveRole] = useState<TacticalRoleConfig>(TACTICAL_ROLES[0]);
  const [isCalculatingPIM, setIsCalculatingPIM] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [pimScore, setPimScore] = useState<number | null>(null);
  const [summary, setSummary] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [playerName, setPlayerName] = useState("");

  const handleRatingChange = (kpi: string, value: number) => {
    setRatings(prev => ({ ...prev, [kpi]: value }));
  };

  const handleNoteChange = (kpi: string, value: string) => {
    setNotes(prev => ({ ...prev, [kpi]: value }));
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
        scoutNotes: `Evaluated in roles: ${activeRole.name}. Global technical level: ${ratings.technicalLevel || 3}/5. Global tactical intelligence: ${ratings.tacticalIntel || 3}/5.`
      });
      setSummary(result.summary);
    } catch (e) {
      toast({ variant: "destructive", title: "Error generating summary" });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const RatingModule = ({ title, icon: Icon, kpis, nextTab }: { title: string, icon: any, kpis: string[], nextTab: string }) => (
    <Card className="border-border/40 shadow-xl p-8 md:p-12 text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 bg-card/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Icon className="h-12 w-12 text-primary opacity-50" />
        <h2 className="text-2xl font-bold font-headline uppercase tracking-tight">{title}</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-x-12 gap-y-8 max-w-4xl mx-auto text-left">
        {kpis.map(kpi => (
          <div key={kpi} className="space-y-3">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>{kpi}</span>
              <span className="text-primary bg-primary/10 px-2 py-0.5 rounded">{ratings[kpi] || 3} / 5</span>
            </div>
            <Slider defaultValue={[3]} max={5} step={0.5} onValueChange={(v) => handleRatingChange(kpi, v[0])} />
          </div>
        ))}
      </div>
      <div className="flex justify-center pt-8 border-t border-border/20">
        <Button onClick={() => setActiveTab(nextTab)} className="px-8 bg-primary hover:bg-primary/90 font-bold">
          {t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-lg font-bold font-headline uppercase tracking-tight">{t.report.title}</h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{t.report.subtitle}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="bg-background text-xs font-bold">
            <Clipboard className="h-3 w-3 mr-2" /> {t.report.actions.export}
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground font-bold text-xs shadow-lg shadow-primary/20">
            {t.report.actions.submit}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex justify-between bg-secondary/30 h-10 p-1 border border-border/20 rounded-lg overflow-x-auto no-scrollbar">
          {Object.entries(t.report.tabs).map(([key, label]) => (
            <TabsTrigger 
              key={key} 
              value={key} 
              className="flex-1 text-[9px] font-bold tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
            >
              <span className="mr-2 opacity-50">{Object.keys(t.report.tabs).indexOf(key) + 1}</span>
              {label as string}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="player" className="mt-6 animate-in fade-in slide-in-from-bottom-2 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            {/* 1 INFORMACIÓN DEL JUGADOR */}
            <Card className="border-border/40 shadow-lg overflow-hidden rounded-lg bg-card/40">
              <div className="bg-[#007b83] px-4 py-2 flex items-center gap-2">
                <User className="h-4 w-4 text-white" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">1 {t.report.playerInfo.title}</h2>
              </div>
              <CardContent className="pt-6 grid grid-cols-2 gap-4">
                <div className="col-span-1 space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.name}</Label>
                  <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} className="h-8 bg-secondary/20 border-border/30" placeholder="Nombre del jugador" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.number}</Label>
                  <Input className="h-8 bg-secondary/20 border-border/30" placeholder="-" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.club}</Label>
                  <Input className="h-8 bg-secondary/20 border-border/30" placeholder="Club" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.rival}</Label>
                  <Input className="h-8 bg-secondary/20 border-border/30" placeholder="vs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.competition}</Label>
                  <Input className="h-8 bg-secondary/20 border-border/30" placeholder="Liga / Copa" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.date}</Label>
                  <Input type="date" className="h-8 bg-secondary/20 border-border/30" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.birthDate}</Label>
                  <Input type="date" className="h-8 bg-secondary/20 border-border/30" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.nationality}</Label>
                  <Input className="h-8 bg-secondary/20 border-border/30" placeholder="-" />
                </div>
                <div className="grid grid-cols-3 col-span-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.height}</Label>
                    <Input className="h-8 bg-secondary/20 border-border/30" placeholder="-" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.weight}</Label>
                    <Input className="h-8 bg-secondary/20 border-border/30" placeholder="-" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.minutes}</Label>
                    <Input className="h-8 bg-secondary/20 border-border/30" placeholder="90" />
                  </div>
                </div>
                <div className="col-span-1 space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.primaryPos}</Label>
                  <Select onValueChange={(v) => setActiveRole(TACTICAL_ROLES.find(r => r.id === v) || TACTICAL_ROLES[0])}>
                    <SelectTrigger className="h-8 bg-secondary/20 border-border/30 text-xs">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {TACTICAL_ROLES.map(role => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.secondaryPos}</Label>
                  <Input className="h-8 bg-secondary/20 border-border/30" placeholder="Ej: ED, MCO" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.dominantFoot}</Label>
                  <div className="flex gap-2">
                      {Object.entries(t.report.playerInfo.footOptions).map(([key, label]) => (
                          <Button key={key} variant="outline" size="sm" className="h-7 px-4 text-[10px] rounded-full border-border/60 hover:bg-primary/10 hover:text-primary transition-all">
                              {label as string}
                          </Button>
                      ))}
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.physicalCondition}</Label>
                  <div className="flex flex-wrap gap-2">
                      {Object.entries(t.report.playerInfo.conditionOptions).map(([key, label]) => (
                          <Button key={key} variant="outline" size="sm" className="h-7 px-3 text-[10px] rounded-full border-border/60">
                              {label as string}
                          </Button>
                      ))}
                  </div>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.scout}</Label>
                  <Input className="h-8 bg-secondary/20 border-border/30" placeholder="Nombre del observador" />
                </div>
              </CardContent>
            </Card>

            {/* 2 POSICIÓN EN EL CAMPO */}
            <Card className="border-border/40 shadow-lg overflow-hidden rounded-lg flex flex-col bg-card/40">
              <div className="bg-[#007b83] px-4 py-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-white" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">2 {t.report.pitch.title}</h2>
              </div>
              <CardContent className="pt-2 flex flex-col items-center justify-center flex-grow bg-transparent p-4">
                <TacticalCanvas />
                <div className="mt-4 text-center space-y-1">
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{t.report.pitch.hint}</p>
                  <p className="text-[10px] text-muted-foreground">Haz clic para marcar la posición del jugador</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 3 PERFIL GENERAL (IMPRESIÓN GLOBAL) - Full width bottom */}
          <Card className="border-border/40 shadow-lg overflow-hidden rounded-lg bg-card/40">
            <div className="bg-[#1b263b] px-4 py-2 flex items-center gap-2">
              <Brain className="h-4 w-4 text-white" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">3 {t.report.globalProfile.title}</h2>
            </div>
            <CardContent className="pt-6 space-y-3">
              {Object.entries(t.report.globalProfile).filter(([k]) => k !== 'title').map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-4 py-1 border-b border-border/10 last:border-0">
                  <Label className="text-[10px] font-bold uppercase w-48 shrink-0 text-muted-foreground">{label as string}</Label>
                  <div className="flex gap-2 shrink-0">
                    {[1, 2, 3, 4, 5].map(num => (
                      <button
                        key={num}
                        onClick={() => handleRatingChange(key, num)}
                        className={cn(
                          "h-7 w-7 rounded-full border border-border/40 text-[10px] font-bold flex items-center justify-center transition-all",
                          ratings[key] === num ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/20 hover:border-primary/50 text-muted-foreground"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <Input 
                    className="h-7 text-[10px] bg-secondary/10 border-none shadow-none focus-visible:ring-1 flex-grow ml-4" 
                    placeholder="Nota..." 
                    value={notes[key] || ""}
                    onChange={(e) => handleNoteChange(key, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          
          <div className="flex justify-end mt-8">
            <Button onClick={() => setActiveTab("technical")} className="px-12 py-5 bg-[#007b83] hover:bg-[#006a72] font-bold shadow-xl rounded-lg text-sm transition-all transform hover:scale-105">
              {t.report.actions.next} <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="mt-6">
           <RatingModule 
             title={t.report.tabs.technical} 
             icon={Sword} 
             kpis={activeRole.kpis.technical} 
             nextTab="tactical" 
           />
        </TabsContent>

        <TabsContent value="tactical" className="mt-6">
           <RatingModule 
             title={t.report.tabs.tactical} 
             icon={Shield} 
             kpis={activeRole.kpis.tactical} 
             nextTab="physical" 
           />
        </TabsContent>

        <TabsContent value="physical" className="mt-6">
           <RatingModule 
             title={t.report.tabs.physical} 
             icon={ZapIcon} 
             kpis={activeRole.kpis.physical} 
             nextTab="mental" 
           />
        </TabsContent>

        <TabsContent value="mental" className="mt-6">
           <RatingModule 
             title={t.report.tabs.mental} 
             icon={Heart} 
             kpis={activeRole.kpis.mental} 
             nextTab="evaluation" 
           />
        </TabsContent>

        <TabsContent value="evaluation" className="mt-6 animate-in zoom-in-95">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/20 bg-primary/5 shadow-inner p-8">
              <div className="text-center space-y-6">
                <Activity className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-xl font-bold font-headline">{t.report.pim.title}</h3>
                {pimScore !== null && (
                  <div className="text-6xl font-black text-primary font-headline animate-in zoom-in-50">{pimScore}</div>
                )}
                <Button 
                  className="w-full h-12 font-bold tracking-widest" 
                  onClick={handleCalculatePIM}
                  disabled={isCalculatingPIM}
                >
                  {isCalculatingPIM ? t.report.pim.calculating : t.report.pim.calculate}
                </Button>
              </div>
            </Card>

            <Card className="border-accent/20 bg-accent/5 p-8">
              <div className="text-center space-y-6">
                <Award className="h-12 w-12 text-accent mx-auto" />
                <h3 className="text-xl font-bold font-headline">{t.report.summary.title}</h3>
                <div className="min-h-32 flex items-center justify-center border border-dashed border-accent/30 rounded-lg bg-background/50 p-4">
                  <p className="text-sm text-muted-foreground italic leading-relaxed">
                    {summary || t.report.summary.placeholder}
                  </p>
                </div>
                <Button 
                    variant="secondary" 
                    className="w-full h-12 font-bold tracking-widest"
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                >
                  {isGeneratingSummary ? t.report.summary.generating : t.report.summary.generate}
                </Button>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
