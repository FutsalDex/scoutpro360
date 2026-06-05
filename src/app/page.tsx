
"use client"

import React, { useState, useEffect } from 'react';
import { ScoutDashboard } from '@/components/scout/dashboard';
import { ReportForm } from '@/components/scout/report-form';
import { GlobalDatabase } from '@/components/scout/global-database';
import { TalentMapping } from '@/components/scout/talent-mapping';
import { AnalyticsHub } from '@/components/scout/analytics-hub';
import { PIMBenchmarking } from '@/components/scout/pim-benchmarking';
import { ProfileView } from '@/components/scout/profile-view';
import { AdminPanel } from '@/components/scout/admin-panel';
import { LandingPage } from '@/components/landing/landing-page';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset, SidebarFooter, SidebarGroup, SidebarGroupLabel, useSidebar } from "@/components/ui/sidebar";
import { LayoutDashboard, FilePlus, Users, Settings, LogOut, ChevronRight, Map, LineChart, ShieldCheck, UserCircle, Briefcase, ShieldAlert } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { useTranslation } from '@/lib/i18n/context';
import { LanguageSwitcher } from '@/components/language-switcher';
import { Badge } from '@/components/ui/badge';
import { auth } from '@/lib/firebase/config';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { getOrCreateUserProfile } from '@/lib/services/user-service';
import { UserProfile, UserRole } from '@/lib/types';

type ViewState = 'dashboard' | 'report' | 'database' | 'mapping' | 'analytics' | 'benchmarking' | 'profile' | 'admin';

function AppShell({ 
  activeView, 
  setActiveView, 
  handleSignOut,
  userProfile
}: { 
  activeView: ViewState, 
  setActiveView: (view: ViewState) => void,
  handleSignOut: () => void,
  userProfile: UserProfile | null
}) {
  const { t } = useTranslation();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavClick = (view: ViewState) => {
    setActiveView(view);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard': return <ScoutDashboard />;
      case 'report': return <ReportForm />;
      case 'database': return <GlobalDatabase />;
      case 'mapping': return <TalentMapping />;
      case 'analytics': return <AnalyticsHub />;
      case 'benchmarking': return <PIMBenchmarking />;
      case 'profile': return <ProfileView profile={userProfile} />;
      case 'admin': return <AdminPanel />;
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
      case 'profile': return 'Perfil Personal';
      case 'admin': return t.sidebar.adminPanel;
      default: return '';
    }
  };

  const role = userProfile?.role || 'invitado';
  const isAdmin = role === 'admin';
  const isOpsRole = ['admin', 'analista', 'entrenador', 'director'].includes(role);
  const isClub = role === 'gestion' || isAdmin;

  return (
    <div className="flex min-h-screen w-full bg-background font-body animate-in fade-in duration-500">
      <Sidebar className="border-r border-border/50 shadow-2xl">
        <SidebarHeader className="p-6">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all active:scale-95 group focus:outline-none focus:ring-2 focus:ring-primary rounded-xl"
            onClick={() => handleNavClick('dashboard')}
            role="link"
            aria-label="Ir a Inicio"
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

        <SidebarContent className="px-3">
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
                    className="h-12 px-4 gap-4 bg-primary/5 border border-primary/20 hover:bg-primary/10"
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
                  className="h-12 px-4 gap-4"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  <span className="font-medium">{t.sidebar.commandCenter}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {isOpsRole && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeView === 'report'} 
                    onClick={() => handleNavClick('report')}
                    className="h-12 px-4 gap-4"
                  >
                    <FilePlus className="h-5 w-5" />
                    <span className="font-medium">{t.sidebar.liveReport}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {(isOpsRole || isClub) && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeView === 'database'}
                    onClick={() => handleNavClick('database')}
                    className="h-12 px-4 gap-4"
                  >
                    <Users className="h-5 w-5" />
                    <span className="font-medium">{t.sidebar.globalDatabase}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarMenuItem>
                <SidebarMenuButton 
                  isActive={activeView === 'mapping'}
                  onClick={() => handleNavClick('mapping')}
                  className="h-12 px-4 gap-4"
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
                    className="h-12 px-4 gap-4"
                  >
                    <LineChart className="h-5 w-5" />
                    <span className="font-medium">{t.sidebar.analytics}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeView === 'benchmarking'}
                    onClick={() => handleNavClick('benchmarking')}
                    className="h-12 px-4 gap-4 text-accent"
                  >
                    <ShieldCheck className="h-5 w-5" />
                    <span className="font-medium">{t.sidebar.pimBenchmarking}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          )}
        </SidebarContent>

        <SidebarFooter className="p-4 border-t border-border/20 space-y-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton 
                isActive={activeView === 'profile'}
                onClick={() => handleNavClick('profile')}
                className="h-12 px-4 gap-4 bg-secondary/30 border border-primary/20 hover:border-primary/50 transition-all rounded-xl shadow-lg"
              >
                <UserCircle className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm tracking-tight">Perfil Personal</span>
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
                <span className="text-xs font-bold text-foreground truncate max-w-[150px]">
                  {userProfile?.displayName || 'ScoutPro 360'}
                </span>
                <span className="text-[10px] text-primary font-bold uppercase tracking-tighter">
                  {userProfile?.role || 'Guest'}
                </span>
              </div>
              <div 
                onClick={() => setActiveView('profile')}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center font-bold text-primary text-xs cursor-pointer hover:scale-105 transition-transform overflow-hidden"
              >
                {userProfile?.displayName ? userProfile.displayName[0].toUpperCase() : 'S'}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-8 max-w-[1400px] mx-auto w-full">
          {renderActiveView()}
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getOrCreateUserProfile(user.uid, user.email || '', user.isAnonymous);
        setUserProfile(profile);
        setShowApp(true);
      } else {
        setUserProfile(null);
        setShowApp(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEnterApp = () => {
    if (!auth.currentUser) {
      setShowApp(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setShowApp(false);
    setActiveView('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary animate-pulse flex items-center justify-center">
          <ShieldCheck className="text-primary-foreground h-6 w-6" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground animate-pulse">Sincronizando ScoutPro 360...</p>
      </div>
    );
  }

  if (!showApp) {
    return (
      <>
        <LandingPage onEnter={handleEnterApp} />
        <Toaster />
      </>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppShell 
        activeView={activeView} 
        setActiveView={setActiveView} 
        handleSignOut={handleSignOut}
        userProfile={userProfile}
      />
      <Toaster />
    </SidebarProvider>
  );
}
