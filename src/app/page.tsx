"use client"

import React, { useState, useEffect } from 'react';
import { ScoutDashboard } from '@/components/scout/dashboard';
import { TalentIdentification } from '@/components/scout/talent-identification';
import { ReportForm } from '@/components/scout/report-form';
import { MatchAnalysis } from '@/components/scout/match-analysis';
import { GlobalDatabase } from '@/components/scout/global-database';
import { AgendaView } from '@/components/scout/agenda-view';
import { TalentMapping } from '@/components/scout/talent-mapping';
import { AnalyticsHub } from '@/components/scout/analytics-hub';
import { PIMBenchmarking } from '@/components/scout/pim-benchmarking';
import { ProfileView } from '@/components/scout/profile-view';
import { AdminPanel } from '@/components/scout/admin-panel';
import { LandingPage } from '@/components/landing/landing-page';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset, SidebarFooter, SidebarGroup, SidebarGroupLabel, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, Binoculars, FilePlus, Users, LogOut, ChevronRight, Map, LineChart, ShieldCheck, UserCircle, ShieldAlert, Video, AlertTriangle, Calendar } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useTranslation } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/language-switcher';
import { auth } from '@/lib/firebase/config';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { getOrCreateUserProfile, subscribeToUserProfile } from '@/lib/services/user-service';
import { UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type ViewState = 'dashboard' | 'talent-id' | 'report' | 'match-analysis' | 'database' | 'agenda' | 'mapping' | 'analytics' | 'benchmarking' | 'profile' | 'admin';

function AppShell({ 
  activeView, 
  setActiveView, 
  handleSignOut,
  userProfile,
  editingPlayerId,
  setEditingPlayerId
}: { 
  activeView: ViewState, 
  setActiveView: (view: ViewState) => void,
  handleSignOut: () => void,
  userProfile: UserProfile | null,
  editingPlayerId: string | null,
  setEditingPlayerId: (id: string | null) => void
}) {
  const { t } = useTranslation();
  const { isMobile, setOpenMobile } = useSidebar();

  const isProfileComplete = userProfile?.displayName && userProfile?.phoneNumber && userProfile?.nationality;
  const isAnonymous = auth.currentUser?.isAnonymous;
  const needsProfileCompletion = !isAnonymous && !isProfileComplete;

  useEffect(() => {
    if (needsProfileCompletion && activeView !== 'profile') {
      setActiveView('profile');
    }
  }, [needsProfileCompletion, activeView, setActiveView]);

  const handleNavClick = (view: ViewState) => {
    if (needsProfileCompletion && view !== 'profile') return;
    if (view !== 'report' && view !== 'talent-id' && view !== 'agenda') setEditingPlayerId(null);
    setActiveView(view);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const handleEditPlayer = (playerId: string) => {
    setEditingPlayerId(playerId);
    setActiveView('report');
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard': return <ScoutDashboard userProfile={userProfile} onEditPlayer={handleEditPlayer} />;
      case 'talent-id': return <TalentIdentification onComplete={() => setActiveView('dashboard')} />;
      case 'report': return <ReportForm userProfile={userProfile} editingPlayerId={editingPlayerId} />;
      case 'match-analysis': return <MatchAnalysis />;
      case 'database': return <GlobalDatabase onEditPlayer={handleEditPlayer} />;
      case 'agenda': return <AgendaView onStartScouting={handleEditPlayer} />;
      case 'mapping': return <TalentMapping />;
      case 'analytics': return <AnalyticsHub />;
      case 'benchmarking': return <PIMBenchmarking />;
      case 'profile': return <ProfileView profile={userProfile} />;
      case 'admin': return <AdminPanel />;
      default: return <ScoutDashboard userProfile={userProfile} onEditPlayer={handleEditPlayer} />;
    }
  };

  const getViewTitle = () => {
    switch (activeView) {
      case 'dashboard': return t.sidebar.commandCenter;
      case 'talent-id': return t.sidebar.talentId;
      case 'report': return editingPlayerId ? `${t.sidebar.liveReport} (Edit)` : t.sidebar.liveReport;
      case 'match-analysis': return t.sidebar.matchAnalysis;
      case 'database': return t.sidebar.playersDatabase;
      case 'agenda': return t.sidebar.agenda;
      case 'mapping': return t.sidebar.talentMapping;
      case 'analytics': return t.sidebar.analytics;
      case 'benchmarking': return t.sidebar.pimBenchmarking;
      case 'profile': return t.sidebar.personalProfile;
      case 'admin': return t.sidebar.adminPanel;
      default: return '';
    }
  };

  const role = userProfile?.role || 'invitado';
  const isAdmin = role === 'admin';
  const isOpsRole = ['admin', 'analista', 'entrenador', 'director'].includes(role);
  const isClub = role === 'gestion' || isAdmin;

  return (
    <div className="flex min-h-screen w-full bg-background font-body animate-in fade-in duration-500 overflow-x-hidden relative">
      <Sidebar className="border-r border-border/50 shadow-2xl overflow-x-hidden">
        <SidebarHeader className="p-6">
          <div 
            className={cn(
              "flex items-center gap-3 transition-all rounded-xl",
              needsProfileCompletion ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:opacity-80 active:scale-95 group"
            )}
            onClick={() => handleNavClick('dashboard')}
          >
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 transform rotate-3 group-hover:rotate-0 transition-transform">
              <ShieldCheck className="text-primary-foreground h-6 w-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-headline font-bold text-foreground leading-none">ScoutPro</span>
              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">360 Football</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 overflow-x-hidden">
          {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-[0.2em] font-bold text-primary/80 mb-4 flex items-center gap-2">
                <ShieldAlert className="h-3 w-3" /> {t.sidebar.administration}
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeView === 'admin'} 
                    onClick={() => handleNavClick('admin')}
                    disabled={needsProfileCompletion}
                    className={cn("h-12 px-4 gap-4 bg-primary/5 border border-primary/20 hover:bg-primary/10", needsProfileCompletion && "opacity-30")}
                  >
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <span className="font-black text-primary uppercase tracking-widest text-[11px]">{t.sidebar.adminPanel}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}

          <SidebarGroup>
            <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">
              {t.sidebar.operations}
            </SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeView === 'dashboard'} 
                  onClick={() => handleNavClick('dashboard')}
                  disabled={needsProfileCompletion}
                  className={cn("h-12 px-4 gap-4", needsProfileCompletion && "opacity-30")}
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span className="font-medium">{t.sidebar.commandCenter}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {isOpsRole && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeView === 'talent-id'} 
                    onClick={() => handleNavClick('talent-id')}
                    disabled={needsProfileCompletion}
                    className={cn("h-12 px-4 gap-4 text-accent", needsProfileCompletion && "opacity-30")}
                  >
                    <Binoculars className="h-5 w-5" />
                    <span className="font-medium">{t.sidebar.talentId}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              {isOpsRole && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeView === 'report'} 
                      onClick={() => handleNavClick('report')}
                      disabled={needsProfileCompletion}
                      className={cn("h-12 px-4 gap-4", needsProfileCompletion && "opacity-30")}
                    >
                      <FilePlus className="h-5 w-5" />
                      <span className="font-medium">{t.sidebar.liveReport}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeView === 'match-analysis'} 
                      onClick={() => handleNavClick('match-analysis')}
                      disabled={needsProfileCompletion}
                      className={cn("h-12 px-4 gap-4", needsProfileCompletion && "opacity-30")}
                    >
                      <Video className="h-5 w-5" />
                      <span className="font-medium">{t.sidebar.matchAnalysis}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              {(isOpsRole || isClub) && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeView === 'database'}
                      onClick={() => handleNavClick('database')}
                      disabled={needsProfileCompletion}
                      className={cn("h-12 px-4 gap-4", needsProfileCompletion && "opacity-30")}
                    >
                      <Users className="h-5 w-5" />
                      <span className="font-medium">{t.sidebar.playersDatabase}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeView === 'agenda'}
                      onClick={() => handleNavClick('agenda')}
                      disabled={needsProfileCompletion}
                      className={cn("h-12 px-4 gap-4 text-accent", needsProfileCompletion && "opacity-30")}
                    >
                      <Calendar className="h-5 w-5" />
                      <span className="font-medium">{t.sidebar.agenda}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeView === 'mapping'}
                  onClick={() => handleNavClick('mapping')}
                  disabled={needsProfileCompletion}
                  className={cn("h-12 px-4 gap-4", needsProfileCompletion && "opacity-30")}
                >
                  <Map className="h-5 w-5" />
                  <span className="font-medium">{t.sidebar.talentMapping}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>

          {isClub && (
            <SidebarGroup className="mt-6">
              <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4">
                {t.sidebar.analytics}
              </SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeView === 'analytics'}
                    onClick={() => handleNavClick('analytics')}
                    disabled={needsProfileCompletion}
                    className={cn("h-12 px-4 gap-4", needsProfileCompletion && "opacity-30")}
                  >
                    <LineChart className="h-5 w-5" />
                    <span className="font-medium">{t.sidebar.analytics}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeView === 'benchmarking'}
                    onClick={() => handleNavClick('benchmarking')}
                    disabled={needsProfileCompletion}
                    className={cn("h-12 px-4 gap-4 text-accent", needsProfileCompletion && "opacity-30")}
                  >
                    <ShieldCheck className="h-5 w-5" />
                    <span className="font-medium">{t.sidebar.pimBenchmarking}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-border/20 space-y-2 overflow-x-hidden">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeView === 'profile'}
                onClick={() => handleNavClick('profile')}
                className="h-12 px-4 gap-4 bg-secondary/30 border border-primary/20 hover:border-primary/50 transition-all rounded-xl shadow-lg"
              >
                <UserCircle className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm tracking-tight">{t.sidebar.personalProfile}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton 
                onClick={handleSignOut}
                className="h-10 px-4 gap-4 text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm font-medium">{t.sidebar.signOut}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background relative overflow-x-hidden w-full flex-1">
        <header className="h-16 border-b border-border/30 flex items-center justify-between px-4 sm:px-8 sticky top-0 bg-background/80 backdrop-blur-xl z-50 w-full overflow-hidden">
          <div className="flex items-center gap-2 overflow-hidden">
            <SidebarTrigger className="h-10 w-10 text-muted-foreground hover:text-foreground shrink-0" />
            <div className="h-4 w-[1px] bg-border mx-1 shrink-0" />
            <span className="text-foreground text-xs sm:text-sm font-bold uppercase tracking-tight truncate max-w-[120px] sm:max-w-[200px]">
              {getViewTitle()}
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-6 shrink-0">
            <LanguageSwitcher />
            <div className="flex items-center gap-2">
              <div 
                onClick={() => handleNavClick('profile')}
                className="h-8 w-8 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center font-bold text-primary text-xs cursor-pointer hover:scale-105 transition-transform"
              >
                {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : 'S'}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-8 max-w-full mx-auto w-full overflow-x-hidden">
          {needsProfileCompletion && (
            <div className="mb-8 animate-in slide-in-from-top-4 duration-500 max-w-full">
              <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 border-2">
                <AlertTriangle className="h-5 w-5" />
                <AlertTitle className="font-black uppercase tracking-widest text-destructive">
                  {t.profile.pendingTitle}
                </AlertTitle>
                <AlertDescription className="font-medium italic">
                  {t.profile.pendingDesc}
                </AlertDescription>
              </Alert>
            </div>
          )}
          <div className="w-full overflow-x-hidden">
            {renderActiveView()}
          </div>
        </main>
      </SidebarInset>
    </div>
  );
}

export default function Home() {
  const [showApp, setShowApp] = useState(false);
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await getOrCreateUserProfile(user.uid, user.email || '', user.isAnonymous);
        unsubscribeProfile = subscribeToUserProfile(user.uid, (profile) => {
          setUserProfile(profile);
          setShowApp(true);
          setLoading(false);
        });
      } else {
        if (unsubscribeProfile) unsubscribeProfile();
        setUserProfile(null);
        setShowApp(false);
        setLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const handleEnterApp = () => {
    if (!auth.currentUser) setShowApp(false);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setShowApp(false);
    setActiveView('dashboard');
    setEditingPlayerId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary animate-pulse flex items-center justify-center">
          <ShieldCheck className="text-primary-foreground h-6 w-6" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sincronizando ScoutPro 360...</p>
      </div>
    );
  }

  if (!showApp) return <><LandingPage onEnter={handleEnterApp} /><Toaster /></>;

  return (
    <SidebarProvider defaultOpen={true}>
      <AppShell 
        activeView={activeView} 
        setActiveView={setActiveView} 
        handleSignOut={handleSignOut}
        userProfile={userProfile}
        editingPlayerId={editingPlayerId}
        setEditingPlayerId={setEditingPlayerId}
      />
      <Toaster />
    </SidebarProvider>
  );
}