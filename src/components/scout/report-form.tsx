
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
import { FileText, ChevronRight, Activity, User, Target, Brain, Zap, Sword, Award, Clipboard } from "lucide-react";
import { TACTICAL_ROLES, type TacticalRoleConfig } from "@/lib/types";
import { calculatePlayerImpactMetric } from "@/ai/flows/calculate-player-impact-metric-flow";
import { generateExecutiveSummary } from "@/ai/flows/generate-executive-summary";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from '@/lib/i18n/context';

export function ReportForm() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("player");
  const [activeRole, setActiveRole] = useState<TacticalRoleConfig>(TACTICAL_ROLES[0]);
  const [isCalculatingPIM, setIsCalculatingPIM] = useState(false);
  const [pimScore, setPimScore] = useState<number | null>(null);
  const [summary, setSummary] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const handleRatingChange = (kpi: string, value: number) => {
    setRatings(prev => ({ ...prev, [kpi]: value }));
  };

  const toggleRole = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const handleCalculatePIM = async () => {
    setIsCalculatingPIM(true);
    try {
      const result = await calculatePlayerImpactMetric({
        playerId: "p1",
        currentEvaluation: {
          tacticalRole: activeRole.name,
          metrics: { technical: {}, tactical: {}, physical: {}, mental: {} }
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

  return (
    <div className="space-y-6 pb-20 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold font-headline uppercase tracking-tight">{t.report.title}</h1>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">{t.report.subtitle}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="bg-background">
            <Clipboard className="h-4 w-4 mr-2" /> {t.report.actions.export}
          </Button>
          <Button size="sm" className="bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
            {t.report.actions.submit}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex justify-between bg-secondary/30 h-12 p-1 border border-border/20 rounded-xl overflow-x-auto no-scrollbar">
          {Object.entries(t.report.tabs).map(([key, label]) => (
            <TabsTrigger 
              key={key} 
              value={key} 
              className="flex-1 text-[10px] font-bold tracking-widest data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <span className="mr-2 opacity-50">{Object.keys(t.report.tabs).indexOf(key) + 1}</span>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="player" className="mt-6 animate-in fade-in slide-in-from-bottom-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-6">
              <Card className="border-border/40 shadow-xl">
                <CardHeader className="bg-primary/5 pb-4 border-b border-border/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    {t.report.playerInfo.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.name}</Label>
                    <Input className="h-9 bg-secondary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.club}</Label>
                    <Input className="h-9 bg-secondary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.number}</Label>
                    <Input className="h-9 bg-secondary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.competition}</Label>
                    <Input className="h-9 bg-secondary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.rival}</Label>
                    <Input className="h-9 bg-secondary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.birthDate}</Label>
                    <Input type="date" className="h-9 bg-secondary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.date}</Label>
                    <Input type="date" className="h-9 bg-secondary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.height}</Label>
                    <Input className="h-9 bg-secondary/20" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.weight}</Label>
                    <Input className="h-9 bg-secondary/20" />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.primaryPos}</Label>
                    <Select onValueChange={(v) => setActiveRole(TACTICAL_ROLES.find(r => r.id === v) || TACTICAL_ROLES[0])}>
                      <SelectTrigger className="h-9 bg-secondary/20">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {TACTICAL_ROLES.map(role => (
                          <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.dominantFoot}</Label>
                    <RadioGroup defaultValue="right" className="flex gap-4">
                      {Object.entries(t.report.playerInfo.footOptions).map(([key, label]) => (
                        <div key={key} className="flex items-center space-x-2">
                          <RadioGroupItem value={key} id={`foot-${key}`} />
                          <Label htmlFor={`foot-${key}`} className="text-xs">{label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t.report.playerInfo.physicalCondition}</Label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(t.report.playerInfo.conditionOptions).map(([key, label]) => (
                        <Badge key={key} variant="outline" className="cursor-pointer hover:bg-primary/20 text-[10px] py-1 px-3">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/40 shadow-xl overflow-hidden">
                <CardHeader className="bg-accent/5 pb-4 border-b border-border/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                    <Brain className="h-4 w-4 text-accent" />
                    {t.report.globalProfile.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {Object.entries(t.report.globalProfile).filter(([k]) => k !== 'title').map(([key, label]) => (
                    <div key={key} className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <Label className="text-[10px] font-bold uppercase">{label}</Label>
                        <span className="text-xs font-bold text-primary">{ratings[key] || 3}/5</span>
                      </div>
                      <Slider defaultValue={[3]} max={5} step={1} onValueChange={(v) => handleRatingChange(key, v[0])} />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <Card className="border-border/40 shadow-xl bg-background/50 backdrop-blur-sm">
                <CardHeader className="bg-secondary/20 pb-4 border-b border-border/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    {t.report.pitch.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <TacticalCanvas />
                  <p className="text-[10px] text-center text-muted-foreground mt-4 font-bold uppercase tracking-widest">{t.report.pitch.hint}</p>
                </CardContent>
              </Card>

              <Card className="border-border/40 shadow-xl">
                <CardHeader className="bg-primary/5 pb-4 border-b border-border/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    {t.report.roles.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 flex flex-wrap gap-2">
                  {Object.entries(t.report.roles).filter(([k]) => k !== 'title').map(([key, label]) => (
                    <Badge 
                      key={key} 
                      variant={selectedRoles.includes(key) ? "default" : "outline"}
                      className="cursor-pointer py-2 px-4 text-[10px] font-bold uppercase tracking-tighter transition-all"
                      onClick={() => toggleRole(key)}
                    >
                      {label}
                    </Badge>
                  ))}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={() => setActiveTab("technical")} className="px-12 py-6 bg-primary font-bold shadow-xl">
                  {t.report.actions.next} <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="mt-6">
           {/* Technical, Tactical, Physical, Mental tabs would have similar slider structures */}
           <Card className="border-border/40 shadow-xl p-12 text-center space-y-4">
              <Sword className="h-16 w-16 text-primary mx-auto opacity-20" />
              <h2 className="text-2xl font-bold font-headline">{t.report.tabs.technical}</h2>
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
                {activeRole.kpis.technical.map(kpi => (
                  <div key={kpi} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                      <span>{kpi}</span>
                      <span className="text-primary">{ratings[kpi] || 3} / 5</span>
                    </div>
                    <Slider defaultValue={[3]} max={5} step={0.5} onValueChange={(v) => handleRatingChange(kpi, v[0])} />
                  </div>
                ))}
              </div>
              <Button onClick={() => setActiveTab("tactical")} className="mt-8">{t.report.actions.next}</Button>
           </Card>
        </TabsContent>

        {/* ... Other tabs ... */}

        <TabsContent value="evaluation" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-primary/20 bg-primary/5 shadow-inner p-8">
              <div className="text-center space-y-6">
                <Activity className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-xl font-bold font-headline">{t.report.pim.title}</h3>
                {pimScore !== null && (
                  <div className="text-6xl font-black text-primary font-headline animate-in zoom-in-50">{pimScore}</div>
                )}
                <Button 
                  className="w-full h-12" 
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
                <div className="h-32 flex items-center justify-center border border-dashed border-accent/30 rounded-lg bg-background/50">
                  <p className="text-sm text-muted-foreground italic px-6">{summary || t.report.summary.placeholder}</p>
                </div>
                <Button variant="secondary" className="w-full h-12">
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
