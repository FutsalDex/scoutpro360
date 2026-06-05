
'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AuthModal } from "@/components/auth/auth-modal";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { 
  ShieldCheck, 
  ChevronRight, 
  LayoutDashboard, 
  Brain, 
  Target, 
  Camera, 
  Bell, 
  Download, 
  CheckCircle2,
  Menu,
  X,
  Star,
  Globe,
  Users,
  LineChart,
  Activity,
  Github,
  Loader2,
  Video,
  ClipboardList
} from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase/config";
import { signInAnonymously } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const { toast } = useToast();

  const handleGuestEntry = async () => {
    if (auth.currentUser) {
      onEnter();
      return;
    }

    setIsGuestLoading(true);
    try {
      await signInAnonymously(auth);
      onEnter();
    } catch (error: any) {
      console.error("Guest login failed:", error);
      toast({
        variant: "destructive",
        title: "Error de acceso invitado",
        description: "No se pudo iniciar sesión como invitado. Verifica tu conexión.",
      });
      if (process.env.NODE_ENV === 'development') {
        onEnter();
      }
    } finally {
      setIsGuestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* 1. HEADER / NAVEGACIÓN */}
      <header className="fixed top-0 w-full z-[100] bg-background/80 backdrop-blur-xl border-b border-border/40 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="text-primary-foreground h-5 w-5" />
            </div>
            <span className="text-xl font-headline font-bold tracking-tight">ScoutPro<span className="text-primary">360</span></span>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {['Propuesta', 'Características', 'Precios', 'FAQ'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                {item}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" className="hidden sm:flex hover:bg-secondary/50 font-bold text-xs uppercase tracking-widest border border-border/40">
                  Acceso / Registro
                </Button>
              </DialogTrigger>
              <AuthModal onAuthSuccess={onEnter} />
            </Dialog>
            
            <Button 
              onClick={handleGuestEntry} 
              disabled={isGuestLoading}
              className="bg-primary text-primary-foreground hover:scale-105 transition-transform shadow-lg shadow-primary/20 font-bold text-xs uppercase tracking-widest px-6"
            >
              {isGuestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar (Invitado)'}
            </Button>
            <button className="lg:hidden p-2 text-muted-foreground" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[90] bg-background pt-20 px-6 lg:hidden animate-in fade-in slide-in-from-top-4">
          <nav className="flex flex-col gap-6">
            {['Propuesta', 'Características', 'Precios', 'FAQ'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-2xl font-bold" onClick={() => setIsMenuOpen(false)}>
                {item}
              </a>
            ))}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full h-14 text-lg font-bold bg-secondary text-secondary-foreground">
                  Acceder / Registrarse
                </Button>
              </DialogTrigger>
              <AuthModal onAuthSuccess={onEnter} />
            </Dialog>
            <Button onClick={handleGuestEntry} disabled={isGuestLoading} className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground">
              {isGuestLoading ? 'Cargando...' : 'Entrar como Invitado'}
            </Button>
          </nav>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section id="propuesta" className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] opacity-[0.05] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex justify-center">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-xs font-bold tracking-widest uppercase">
              Scouts • Entrenadores • Directores Deportivos
            </Badge>
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tight leading-[1.1]">
            Inteligencia Total para <br />
            <span className="text-primary italic">Análisis de Partidos</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            No es solo scouting. Es una herramienta integral para que <strong>Entrenadores y Directores Deportivos</strong> analicen el rendimiento táctico en vivo y tomen decisiones basadas en datos de élite.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-14 px-10 bg-primary text-primary-foreground text-base font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 transition-all">
                  Comenzar Análisis <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <AuthModal onAuthSuccess={onEnter} />
            </Dialog>
            <Button variant="outline" onClick={handleGuestEntry} className="h-14 px-10 border-border/50 text-base font-black uppercase tracking-widest hover:bg-secondary">
              Ver Demo de Análisis
            </Button>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN DE CARACTERÍSTICAS */}
      <section id="características" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-headline font-bold uppercase tracking-widest">Herramientas Profesionales</h2>
          <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<ClipboardList className="text-primary" />} 
            title="Análisis para Entrenadores" 
            desc="Métricas de rendimiento táctico específicas para evaluar el cumplimiento de roles en el sistema de juego."
            borderColor="border-primary/40"
          />
          <FeatureCard 
            icon={<Brain className="text-accent" />} 
            title="Soporte a la Dirección" 
            desc="Dashboards estratégicos para Directores Deportivos con comparativas de mercado y ROI de talento."
            borderColor="border-accent/40"
          />
          <FeatureCard 
            icon={<Video className="text-[#E91E63]" />} 
            title="Análisis de Partidos Live" 
            desc="Toma de datos en tiempo real desde la grada con sincronización inmediata a la nube del club."
            borderColor="border-[#E91E63]/40"
          />
          <FeatureCard 
            icon={<Target className="text-primary" />} 
            title="Pizarra Táctica" 
            desc="Visualiza el posicionamiento y mapa de calor del jugador en tiempo real sobre el campo."
            borderColor="border-primary/40"
          />
          <FeatureCard 
            icon={<LayoutDashboard className="text-accent" />} 
            title="Base de Datos Global" 
            desc="Acceso instantáneo a miles de perfiles con historial de rendimiento e impacto PIM."
            borderColor="border-accent/40"
          />
          <FeatureCard 
            icon={<Download className="text-[#4CAF50]" />} 
            title="Exportación Profesional" 
            desc="Descarga informes completos optimizados para presentaciones a la junta directiva."
            borderColor="border-[#4CAF50]/40"
          />
        </div>
      </section>

      {/* 4. VISTA PREVIA DE INFORME REAL */}
      <section className="py-24 px-6 bg-secondary/10">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-headline font-black uppercase tracking-widest">Análisis Táctico en Vivo</h2>
            <p className="text-muted-foreground font-medium">La herramienta definitiva para el cuerpo técnico y la dirección deportiva</p>
          </div>
          
          <Card className="border-border/40 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden bg-[#1b263b] animate-in zoom-in-95 duration-700">
            {/* Informe Header */}
            <div className="bg-[#1b263b] p-8 border-b border-primary/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-widest text-white font-headline">EVALUACIÓN DE RENDIMIENTO</h3>
                <p className="text-[11px] text-primary font-bold uppercase tracking-[0.3em]">MÓDULO DE ENTRENADOR • SCOUTPRO 360</p>
              </div>
              <div className="flex gap-1.5">
                {['TAC', 'POS', 'INT', 'DEC', 'FIS', 'MEN', 'ACC', 'PIM'].map((tab, i) => (
                  <div 
                    key={tab} 
                    className={cn(
                      "h-8 w-14 rounded-md border flex items-center justify-center transition-all", 
                      i === 7 
                        ? "bg-primary border-primary shadow-[0_0_15px_rgba(224,176,80,0.4)]" 
                        : "bg-white/5 border-white/10"
                    )}
                  >
                    <span className={cn("text-[8px] font-black", i === 7 ? "text-primary-foreground" : "text-white/20")}>
                      {tab}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <CardContent className="p-10 space-y-12 bg-[#0f172a]/40">
              <div className="grid md:grid-cols-12 gap-10 items-center">
                <div className="md:col-span-7 space-y-8">
                  <div className="h-7 px-5 bg-primary/20 border border-primary/30 rounded-full inline-flex items-center">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Insights para el Entrenador</span>
                  </div>
                  <div className="space-y-5">
                    {[
                      { title: "Ejecución del Rol Táctico", sub: "Cumplimiento del 92% de las instrucciones de zona" },
                      { title: "Toma de Decisiones bajo Presión", sub: "Mantiene un 88% de acierto en pase vertical" },
                      { title: "Impacto en Transición Defensiva", sub: "Recuperación tras pérdida en menos de 5 segundos" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-5 p-5 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0 shadow-lg shadow-primary/10">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-black text-white uppercase tracking-tight">{item.title}</p>
                          <p className="text-[11px] text-muted-foreground italic font-medium">{item.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-5">
                  <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-[3rem] border border-white/10 shadow-inner relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80 mb-6">IMPACTO TÁCTICO</span>
                    <span className="text-9xl font-black text-primary font-headline drop-shadow-[0_20px_50px_rgba(224,176,80,0.3)] leading-none">94</span>
                    <Badge className="mt-12 bg-[#2e7d32] text-white px-10 py-3 text-xs font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-[#2e7d32]/30 border-none">
                      RENDIMIENTO ÉLITE
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 5. PREGUNTAS FRECUENTES (FAQ) */}
      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-headline font-bold uppercase tracking-widest">Preguntas Frecuentes</h2>
          <p className="text-muted-foreground">Todo lo que necesitas saber sobre ScoutPro360</p>
        </div>
        <div className="grid md:grid-cols-1 gap-4">
          <Accordion type="single" collapsible className="w-full space-y-4">
            <FaqItem value="q1" question="¿Es solo para scouts?" answer="En absoluto. ScoutPro360 ha sido diseñada para ser la mano derecha de Entrenadores y Directores Deportivos, permitiendo analizar partidos propios o de rivales con la misma profundidad técnica." />
            <FaqItem value="q2" question="¿Cómo ayuda a un Director Deportivo?" answer="Ofrece una visión global del mercado y de la plantilla, permitiendo bencharmking instantáneo para validar si un fichaje realmente mejora el nivel medio del equipo en una posición específica." />
            <FaqItem value="q3" question="¿Puedo usarlo durante un partido?" answer="Sí, la interfaz está optimizada para tablets y smartphones, lo que permite a los asistentes técnicos o scouts capturar datos y eventos clave sin perderse ni un segundo de la acción." />
            <FaqItem value="q4" question="¿Qué es el PIM Score?" answer="El Player Impact Metric es un algoritmo de IA que procesa más de 45 variables tácticas y técnicas para dar una puntuación objetiva del impacto de un jugador en el modelo de juego del club." />
          </Accordion>
        </div>
      </section>

      {/* 6. TABLA DE PRECIOS */}
      <section id="precios" className="py-24 px-6 bg-secondary/10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-headline font-bold uppercase tracking-widest">Planes de Suscripción</h2>
            <p className="text-muted-foreground">Elige el nivel de inteligencia que tu organización necesita</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard 
              name="Básico" 
              price="$29" 
              desc="Para analistas independientes"
              features={['Hasta 50 informes/mes', 'Formulario Pro', 'Exportación JSON', 'Soporte Email']}
            />
            <PricingCard 
              name="Profesional" 
              price="$99" 
              desc="Para cuerpos técnicos y scouts"
              features={['Informes ilimitados', 'IA Generativa Completa', 'Pizarra Táctica Avanzada', 'Multimedia HD', 'Notificaciones Inteligentes']}
              featured
            />
            <PricingCard 
              name="Enterprise" 
              price="Consultar" 
              desc="Para clubes de élite y federaciones"
              features={['Usuarios ilimitados', 'API de Integración', 'Personalización de Marca', 'Soporte 24/7', 'Gestión de Roles Pro']}
            />
          </div>
        </div>
      </section>

      {/* 7. ESTADÍSTICAS */}
      <section className="py-20 px-6 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
          <StatItem value="10,000+" label="Jugadores Evaluados" />
          <StatItem value="500+" label="Clubes de Élite" />
          <StatItem value="98%" label="Tasa de Acierto" />
          <StatItem value="24/7" label="Inteligencia Activa" />
        </div>
      </section>

      {/* 8. CALL TO ACTION FINAL */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 animate-pulse pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-10 relative z-10">
          <h2 className="text-4xl md:text-6xl font-headline font-black uppercase tracking-tight">Potencia tu Toma <br />de Decisiones</h2>
          <p className="text-xl text-muted-foreground font-medium">Únete a la nueva era del análisis deportivo y eleva el nivel competitivo de tu equipo.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-16 px-12 bg-primary text-primary-foreground text-lg font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all">
                  Empezar Ahora
                </Button>
              </DialogTrigger>
              <AuthModal onAuthSuccess={onEnter} />
            </Dialog>
            <Button variant="outline" onClick={handleGuestEntry} disabled={isGuestLoading} className="h-16 px-12 text-lg font-black uppercase tracking-widest">
              Solicitar Demo Club
            </Button>
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="bg-[#0f172a] text-slate-400 py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-primary h-6 w-6" />
              <span className="text-xl font-headline font-bold text-white tracking-tight">ScoutPro<span className="text-primary">360</span></span>
            </div>
            <p className="text-sm leading-relaxed">
              La plataforma definitiva para el scouting y el análisis táctico profesional de fútbol.
            </p>
          </div>
          <FooterColumn title="Plataforma" links={['Características', 'Precios', 'Demo']} />
          <FooterColumn title="Soporte" links={['Contacto', 'FAQ', 'Documentación']} />
          <div className="space-y-6">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs">Conecta</h4>
            <div className="flex gap-4">
              <a 
                href="https://github.com/FutsalDex/scoutpro360" 
                target="_blank" 
                rel="noopener noreferrer"
                className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer"
              >
                <Github className="h-5 w-5" />
              </a>
              {[Globe, Users, Star, Activity].map((Icon, i) => (
                <div key={i} className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">
                  <Icon className="h-5 w-5" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 text-center text-xs uppercase tracking-widest">
          © 2026 ScoutPro360 by FutsalDex. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc, borderColor }: { icon: any, title: string, desc: string, borderColor: string }) {
  return (
    <Card className={cn("p-8 bg-card/40 border-2 transition-all hover:scale-105 hover:shadow-2xl cursor-default group", borderColor)}>
      <div className="h-14 w-14 rounded-2xl bg-secondary/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {React.cloneElement(icon, { className: cn(icon.props.className, "h-8 w-8") })}
      </div>
      <h3 className="text-lg font-black uppercase tracking-widest mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </Card>
  );
}

function PricingCard({ name, price, desc, features, featured }: { name: string, price: string, desc: string, features: string[], featured?: boolean }) {
  return (
    <Card className={cn(
      "p-10 border-2 transition-all hover:shadow-2xl relative overflow-hidden",
      featured ? "border-primary scale-105 bg-primary/5 z-10" : "border-border/40 bg-card/40"
    )}>
      {featured && (
        <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground font-bold text-[10px] tracking-widest">MÁS POPULAR</Badge>
      )}
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-black uppercase tracking-widest">{name}</h3>
          <p className="text-sm text-muted-foreground mt-1">{desc}</p>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black font-headline">{price}</span>
          {price !== 'Consultar' && <span className="text-muted-foreground">/mes</span>}
        </div>
        <div className="space-y-4 pt-4">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <CheckCircle2 className={cn("h-4 w-4", featured ? "text-primary" : "text-muted-foreground")} />
              <span>{f}</span>
            </div>
          ))}
        </div>
        <Button className={cn(
          "w-full h-12 font-black uppercase tracking-widest rounded-xl mt-8",
          featured ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary"
        )}>
          Comenzar
        </Button>
      </div>
    </Card>
  );
}

function FaqItem({ value, question, answer }: { value: string, question: string, answer: string }) {
  return (
    <AccordionItem value={value} className="border border-border/40 rounded-xl px-4 bg-card/40">
      <AccordionTrigger className="text-left font-bold hover:no-underline text-base py-6">{question}</AccordionTrigger>
      <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
        {answer}
      </AccordionContent>
    </AccordionItem>
  );
}

function StatItem({ value, label }: { value: string, label: string }) {
  return (
    <div className="space-y-2">
      <div className="text-4xl md:text-5xl font-black font-headline">{value}</div>
      <div className="text-xs font-bold uppercase tracking-widest opacity-80">{label}</div>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string, links: string[] }) {
  return (
    <div className="space-y-6">
      <h4 className="text-white font-bold uppercase tracking-widest text-xs">{title}</h4>
      <ul className="space-y-4">
        {links.map((link) => (
          <li key={link}>
            <a href="#" className="hover:text-primary transition-colors text-sm">{link}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
