
"use client"

import React, { useState } from 'react';
import { ScoutDashboard } from '@/components/scout/dashboard';
import { ReportForm } from '@/components/scout/report-form';
import { GlobalDatabase } from '@/components/scout/global-database';
import { TalentMapping } from '@/components/scout/talent-mapping';
import { AnalyticsHub } from '@/components/scout/analytics-hub';
import { PIMBenchmarking } from '@/components/scout/pim-benchmarking';
import { LandingPage } from '@/components/landing/landing-page';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar";
import { LayoutDashboard, FilePlus, Users, Settings, LogOut, ChevronRight, Map, LineChart, ShieldCheck } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useTranslation } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/language-switcher';

type ViewState = 'dashboard' | 'report' | 'database' | 'mapping' | 'analytics' | 'benchmarking';

export default function Home() {
  const [showApp, setShowApp] = useState(false);
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const { t } = useTranslation();

  const handleEnterApp = () => {
    setShowApp(true);
    window.scrollTo(0, 0);
  };

  const handleSignOut = () => {
    setShowApp(false);
    setActiveView('dashboard');
  };

  if (!showApp) {
    return (
      <>
        <LandingPage onEnter={handleEnterApp} />
        <Toaster />
      </>
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard': return <ScoutDashboard />;
      case 'report': return <ReportForm />;
      case 'database': return <GlobalDatabase />;
      case 'mapping': return <TalentMapping />;
      case 'analytics': return <AnalyticsHub />;
      case 'benchmarking': return <PIMBenchmarking />;
      default: return <ScoutDashboard />;
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard': return t.sidebar.commandCenter;
      case 'report': return t.sidebar.liveReport;
      case 'database': return t.sidebar.globalDatabase;
      case 'mapping': return t.sidebar.talentMapping;
      case 'analytics': return t.sidebar.analytics;
      case 'benchmarking': return t.sidebar.pimBenchmarking;
      default: return '';
    }
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background font-body animate-in fade-in duration-500">
        <Sidebar className="border-r border-border/50 shadow-2xl">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transform rotate-3">
                <ShieldCheck className="text-primary-foreground h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-headline font-bold text-foreground leading-none">ScoutPro</span>
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold">360 Football</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="px-3">
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">
                {t.sidebar.operations}
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeView === 'dashboard'} 
                    onClick={() => setActiveView('dashboard')}
                    className="h-12 px-4 gap-4"
                  >
                    <LayoutDashboard className="h-5 w-5" />
                    <span className="font-medium">{t.sidebar.commandCenter}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeView === 'report'} 
                    onClick={() => setActiveView('report')}
                    className="h-12 px-4 gap-4"
                  >
                    <FilePlus className="h-5 w-5" />
                    <span className="font-medium">{t.sidebar.liveReport}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeView === 'database'}
                    onClick={() => setActiveView('database')}
                    className="h-12 px-4 gap-4"
                  >
                    <Users className="h-5 w-5" />
                    <span className="font-medium">{t.sidebar.globalDatabase}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeView === 'mapping'}
                    onClick={() => setActiveView('mapping')}
                    className="h-12 px-4 gap-4"
                  >
                    <Map className="h-5 w-5" />
                    <span className="font-medium">{t.sidebar.talentMapping}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">
                {t.sidebar.analytics}
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeView === 'analytics'}
                    onClick={() => setActiveView('analytics')}
                    className="h-12 px-4 gap-4"
                  >
                    <LineChart className="h-5 w-5" />
                    <span className="font-medium">{t.sidebar.analytics}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeView === 'benchmarking'}
                    onClick={() => setActiveView('benchmarking')}
                    className="h-12 px-4 gap-4 text-accent"
                  >
                    <ShieldCheck className="h-5 w-5" />
                    <span className="font-medium">{t.sidebar.pimBenchmarking}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border/20">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="h-10 px-4 gap-4 text-muted-foreground hover:text-foreground">
                  <Settings className="h-4 w-4" />
                  <span className="text-sm">{t.sidebar.settings}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={handleSignOut}
                  className="h-10 px-4 gap-4 text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">{t.sidebar.signOut}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-background relative">
          <header className="h-16 border-b border-border/30 flex items-center justify-between px-4 sm:px-8 sticky top-0 bg-background/80 backdrop-blur-xl z-50">
            <div className="flex items-center gap-2 sm:gap-4">
              <SidebarTrigger className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-secondary/50" />
              <div className="h-4 w-[1px] bg-border mx-1 sm:mx-2" />
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium overflow-hidden whitespace-nowrap">
                <span className="text-muted-foreground hidden xs:inline">Main</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground hidden xs:inline" />
                <span className="text-foreground capitalize truncate max-w-[120px] sm:max-w-none">
                  {getViewTitle()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <LanguageSwitcher />
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden md:flex flex-col text-right">
                  <span className="text-xs font-bold text-foreground">ScoutPro 360</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">360 Scouting Division</span>
                </div>
                <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center font-bold text-primary text-xs cursor-pointer hover:scale-105 transition-transform">
                  S
                </div>
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-8 max-w-[1400px] mx-auto w-full">
            {renderActiveView()}
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
