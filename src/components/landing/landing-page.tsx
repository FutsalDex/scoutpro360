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
  Brain, 
  CheckCircle2,
  Menu,
  X,
  Star,
  Globe,
  Users,
  Activity,
  Github,
  ClipboardList,
  Calendar,
  Sparkles,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LandingPageProps {
  onEnter: () => void;
}

export function LandingPage({ onEnter }: LandingPageProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* 1. HEADER / NAVEGACIÓN */}
      <header className="fixed top-0 w-full z-[100] bg-background/80 backdrop-blur-xl border-b border-border/40 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity" aria-label="Volver a Inicio">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="text-primary-foreground h-5 w-5" />
            </div>
            <span className="text-xl font-headline font-bold tracking-tight">ScoutPro<span className="text-primary">360</span></span>
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            <a href="#propuesta" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Propuesta</a>
            <a href="#características" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Módulos</a>
            <a href="#precios" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Planes</a>
            <a href="#faq" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:scale-105 transition-transform shadow-lg shadow-primary/20 font-bold text-xs uppercase tracking-widest px-6 h-10">
                  Acceso / Registro
                </Button>
              </DialogTrigger>
              <AuthModal onAuthSuccess={onEnter} />
            </Dialog>
            
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
            <a href="#propuesta" className="text-2xl font-bold" onClick={() => setIsMenuOpen(false)}>Propuesta</a>
            <a href="#características" className="text-2xl font-bold" onClick={() => setIsMenuOpen(false)}>Módulos</a>
            <a href="#precios" className="text-2xl font-bold" onClick={() => setIsMenuOpen(false)}>Precios</a>
            <a href="#faq" className="text-2xl font-bold" onClick={() => setIsMenuOpen(false)}>FAQ</a>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground">
                  Acceso / Registro
                </Button>
              </DialogTrigger>
              <AuthModal onAuthSuccess={onEnter} />
            </Dialog>
          </nav>
        </div>
      )}

      {/* 2. HERO SECTION */}
      <section id="propuesta" className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)] opacity-[0.05] pointer-events-none" />
        <div className="max-w-5xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="flex justify-center">
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-xs font-bold tracking-widest uppercase">
              Scouting Inteligente • Métrica PIM • Red de Talentos
            </Badge>
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-black tracking-tight leading-[1.1]">
            Análisis de <span className="text-primary italic">Talento Basado</span> <br />
            en Inteligencia Técnica
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed font-medium">
            Transforma la observación subjetiva en datos objetivos. La plataforma definitiva para que <strong>Scouts y Clubes</strong> identifiquen el talento élite mediante el algoritmo PIM y resúmenes de IA.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-14 px-10 bg-primary text-primary-foreground text-base font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 transition-all">
                  Comenzar Evaluación <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </DialogTrigger>
              <AuthModal onAuthSuccess={onEnter} />
            </Dialog>
          </div>
        </div>
      </section>

      {/* 3. SECCIÓN DE CARACTERÍSTICAS */}
      <section id="características" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-headline font-bold uppercase tracking-widest text-primary">Arquitectura de Scouting 360</h2>
          <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
          <p className="text-muted-foreground max-w-2xl mx-auto font-medium">Herramientas profesionales diseñadas para el rigor del fútbol de élite.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard 
            icon={<ClipboardList className="text-primary" />} 
            title="Identificación Pro" 
            desc="Crea fichas de talento detalladas con datos personales, profesionales y de contacto directo para tu base de datos."
            borderColor="border-primary/40"
          />
          <FeatureCard 
            icon={<Activity className="text-accent" />} 
            title="Informes 360" 
            desc="Formularios de 9 etapas cubriendo técnica, táctica, físico y mental, con registro cronológico de acciones clave."
            borderColor="border-accent/40"
          />
          <FeatureCard 
            icon={<Brain className="text-primary" />} 
            title="Motor de IA (PIM)" 
            desc="Cálculo del Player Impact Metric (1-100) ponderado por posición y generación de resúmenes técnicos automáticos."
            borderColor="border-primary/40"
          />
          <FeatureCard 
            icon={<Calendar className="text-accent" />} 
            title="Agenda Scouting" 
            desc="Planifica y gestiona tus citas de observación de partidos con integración directa al flujo de informes."
            borderColor="border-accent/40"
          />
          <FeatureCard 
            icon={<Globe className="text-[#E91E63]" />} 
            title="Inteligencia de Red" 
            desc="PRÓXIMAMENTE: Espacio exclusivo para que clubes centralicen y consulten el talento detectado por toda su red de scouts."
            borderColor="border-[#E91E63]/40"
          />
          <FeatureCard 
            icon={<Search className="text-primary" />} 
            title="Comparativas" 
            desc="PRÓXIMAMENTE: Herramienta de benchmarking para comparar prospectos externos contra el rendimiento medio de tu plantilla."
            borderColor="border-primary/40"
            isUpcoming
          />
        </div>
      </section>

      {/* 4. VISTA PREVIA DE INFORME REAL */}
      <section className="py-24 px-6 bg-secondary/10">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-headline font-black uppercase tracking-widest">Inteligencia Técnica</h2>
            <p className="text-muted-foreground font-medium">Validación objetiva de prospectos mediante IA y análisis situacional</p>
          </div>
          
          <Card className="border-border/40 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden bg-[#1b263b] animate-in zoom-in-95 duration-700">
            <div className="bg-[#1b263b] p-8 border-b border-primary/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase tracking-widest text-white font-headline">ANÁLISIS DE IMPACTO</h3>
                <p className="text-[11px] text-primary font-bold uppercase tracking-[0.3em]">IA ANALYTICS • MOTOR GENKIT</p>
              </div>
              <div className="flex gap-1.5">
                {['JUG', 'CON', 'TÉC', 'TÁC', 'FÍS', 'MEN', 'ACC', 'EVA', 'PIM'].map((tab, i) => (
                  <div 
                    key={tab} 
                    className={cn(
                      "h-8 w-14 rounded-md border flex items-center justify-center transition-all", 
                      i === 8 
                        ? "bg-primary border-primary shadow-[0_0_15px_rgba(224,176,80,0.4)]" 
                        : "bg-white/5 border-white/10"
                    )}
                  >
                    <span className={cn("text-[8px] font-black", i === 8 ? "text-primary-foreground" : "text-white/20")}>
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
                    <Sparkles className="h-3 w-3 text-primary mr-2" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">Resumen Ejecutivo de IA</span>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-foreground/90 font-medium italic leading-relaxed border-l-2 border-primary/40 pl-6">
                      "El jugador demuestra una inteligencia táctica superior en fase de construcción, con un 92% de acierto en pases de progresión. Su capacidad para detectar intervalos defensivos lo posiciona como un prospecto de élite para sistemas de posesión. Se recomienda seguimiento prioritario debido a su alto techo competitivo."
                    </p>
                    <div className="flex gap-4">
                       <Badge variant="outline" className="text-[9px] uppercase border-accent/40 text-accent font-black">Visión de Juego: 5/5</Badge>
                       <Badge variant="outline" className="text-[9px] uppercase border-accent/40 text-accent font-black">Toma Decisiones: 5/5</Badge>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-5">
                  <div className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-[3rem] border border-white/10 shadow-inner relative overflow-hidden group">
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/80 mb-6">PIM SCORE</span>
                    <span className="text-9xl font-black text-primary font-headline drop-shadow-[0_20px_50px_rgba(224,176,80,0.3)] leading-none">94</span>
                    <Badge className="mt-12 bg-primary text-primary-foreground px-10 py-3 text-xs font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-primary/30 border-none">
                      POTENCIAL ÉLITE
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 5. SECCIÓN DE PRECIOS */}
      <section id="precios" className="py-24 px-6 bg-secondary/10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-headline font-bold uppercase tracking-widest text-primary">Ecosistema ScoutPro</h2>
            <p className="text-muted-foreground">Selecciona el nivel de inteligencia que tu red profesional necesita</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard 
              name="Analista" 
              price="9,99€" 
              desc="Para scouts independientes"
              features={[
                'Dashboard Operativo', 
                'Gestión de Fichas de Talento', 
                'BD de talentos', 
                'BD SCOUT', 
                'Agenda Scouting', 
                'Soporte Estándar'
              ]}
            />
            <PricingCard 
              name="Profesional" 
              price="29,99€" 
              desc="Para cuerpos técnicos y scouts Pro"
              features={[
                'Dashboard Operativo', 
                'Gestión de Fichas de Talento', 
                'BD de talentos', 
                'BD SCOUT', 
                'Informes 360 Pro',
                'Métricas PIM ilimitadas', 
                'Resúmenes de IA Generativa', 
                'Exportación PDF Pro', 
                'Agenda Scouting', 
                'Soporte técnico Pro'
              ]}
              featured
            />
            <PricingCard 
              name="Club / Red" 
              price="Consultar" 
              desc="Para entidades y agencias"
              features={[
                'Buscador Global de Talentos', 
                'Gestión de Red de Scouts', 
                'Comparativas de Talentos', 
                'Soporte 24/7 Premium'
              ]}
            />
          </div>
        </div>
      </section>

      {/* 6. FAQ */}
      <section id="faq" className="py-24 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl font-headline font-bold uppercase tracking-widest text-primary">Preguntas Frecuentes</h2>
          <p className="text-muted-foreground">Respuestas para profesionales del scouting</p>
        </div>
        <Accordion type="single" collapsible className="w-full space-y-4">
          <FaqItem value="q1" question="¿Qué es la métrica PIM?" answer="El Player Impact Metric (PIM) es nuestro algoritmo de IA que procesa más de 50 variables técnicas, tácticas y contextuales para generar una puntuación objetiva del rendimiento de un jugador en un partido específico." />
          <FaqItem value="q2" question="¿Cómo funciona el espacio para Clubes?" answer="Es un módulo estratégico que permite a los clubes centralizar la inteligencia de sus scouts. Las entidades podrán filtrar talentos de forma global según las evaluaciones enviadas por su red privada de captación." />
          <FaqItem value="q3" question="¿Puedo exportar mis informes?" answer="Sí. El plan Profesional permite generar informes PDF corporativos exhaustivos que incluyen todas las valoraciones, acciones clave y el análisis de IA para ser presentados a la dirección deportiva." />
          <FaqItem value="q4" question="¿Es útil para scouts independientes?" answer="Totalmente. Ofrece una herramienta de digitalización profesional que eleva el valor de tu trabajo, permitiéndote gestionar tu propia base de datos de talentos con un rigor de élite." />
        </Accordion>
      </section>

      {/* 7. FOOTER */}
      <footer className="bg-[#0f172a] text-slate-400 py-16 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-primary h-6 w-6" />
              <span className="text-xl font-headline font-bold text-white tracking-tight">ScoutPro<span className="text-primary">360</span></span>
            </div>
            <p className="text-sm leading-relaxed">
              La plataforma definitiva para el scouting, el análisis de talento y la inteligencia de mercado profesional para clubes de élite.
            </p>
          </div>
          <FooterColumn title="Plataforma" links={['Ficha Talentos', 'Informes 360', 'Métrica PIM', 'Agenda']} />
          <FooterColumn title="Soporte" links={['Contacto', 'FAQ', 'Privacidad']} />
          <div className="space-y-6">
            <h4 className="text-white font-bold uppercase tracking-widest text-xs">Conecta</h4>
            <div className="flex gap-4">
              <a href="https://github.com/FutsalDex/scoutpro360" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-primary/20 hover:text-primary transition-colors cursor-pointer">
                <Github className="h-5 w-5" />
              </a>
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

function FeatureCard({ icon, title, desc, borderColor, isUpcoming }: { icon: any, title: string, desc: string, borderColor: string, isUpcoming?: boolean }) {
  return (
    <Card className={cn(
      "p-8 bg-card/40 border-2 transition-all hover:scale-105 hover:shadow-2xl cursor-default group relative", 
      borderColor,
      isUpcoming && "opacity-80 grayscale-[0.5]"
    )}>
      {isUpcoming && (
        <Badge className="absolute top-4 right-4 bg-accent/20 text-accent border-accent/30 text-[8px] font-black uppercase tracking-widest">SOON</Badge>
      )}
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
        <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground font-bold text-[10px] tracking-widest">RECOMENDADO</Badge>
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
            <div key={i} className="flex items-start gap-3 text-sm">
              <CheckCircle2 className={cn("h-4 w-4 shrink-0 mt-0.5", featured ? "text-primary" : "text-muted-foreground")} />
              <span className="font-medium text-foreground/90">{f}</span>
            </div>
          ))}
        </div>
        <Button className={cn(
          "w-full h-12 font-black uppercase tracking-widest rounded-xl mt-8",
          featured ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "bg-secondary"
        )}>
          Seleccionar
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
