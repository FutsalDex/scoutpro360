
"use client"

import React, { useState } from 'react';
import { ScoutDashboard } from '@/components/scout/dashboard';
import { ReportForm } from '@/components/scout/report-form';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from "@/components/ui/sidebar";
import { LayoutDashboard, FilePlus, Users, Settings, LogOut, ChevronRight, Map, LineChart, ShieldCheck } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useTranslation } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function Home() {
  const [activeView, setActiveView] = useState<'dashboard' | 'report'>('dashboard');
  const { t } = useTranslation();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background font-body">
        <Sidebar className="border-r border-border/50 shadow-2xl">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transform rotate-3">
                <ShieldCheck className="text-primary-foreground h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-headline font-bold text-foreground leading-none">ScoutPro</span>
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Football Elite</span>
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
                  <SidebarMenuButton className="h-12 px-4 gap-4">
                    <Users className="h-5 w-5" />
                    <span className="font-medium">{t.sidebar.globalDatabase}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton className="h-12 px-4 gap-4">
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
                  <SidebarMenuButton className="h-12 px-4 gap-4 text-accent">
                    <LineChart className="h-5 w-5" />
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
                <SidebarMenuButton className="h-10 px-4 gap-4 text-destructive hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">{t.sidebar.signOut}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="bg-background relative">
          <header className="h-16 border-b border-border/30 flex items-center justify-between px-8 sticky top-0 bg-background/80 backdrop-blur-xl z-50">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-10 w-10 text-muted-foreground hover:text-foreground hover:bg-secondary/50" />
              <div className="h-4 w-[1px] bg-border mx-2" />
              <div className="flex items-center gap-2 text-sm font-medium">
                <span className="text-muted-foreground">Main</span>
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
                <span className="text-foreground capitalize">
                  {activeView === 'dashboard' ? t.sidebar.commandCenter : t.sidebar.liveReport}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <LanguageSwitcher />
              <div className="flex items-center gap-4">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-foreground">ScoutPro Elite</span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">Elite Scouting Division</span>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center font-bold text-primary text-xs cursor-pointer hover:scale-105 transition-transform">
                  S
                </div>
              </div>
            </div>
          </header>

          <main className="p-8 max-w-[1400px] mx-auto w-full">
            {activeView === 'dashboard' ? <ScoutDashboard /> : <ReportForm />}
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  );
}
