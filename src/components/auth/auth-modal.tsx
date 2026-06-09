'use client';

import React, { useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider
} from 'firebase/auth';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { getOrCreateUserProfile } from '@/lib/services/user-service';
import { UserRole } from '@/lib/types';

export function AuthModal({ onAuthSuccess }: { onAuthSuccess: () => void }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('analista');
  const { toast } = useToast();

  const getAuthErrorMessage = (code: string) => {
    // Manejo específico del error de dominio bloqueado
    if (code.includes('requests-from-referer-blocked') || code.includes('requests-from-referer')) {
      return "Acceso Bloqueado: Este dominio no está autorizado en Google Cloud Console. Si acabas de quitar las restricciones, espera 5-10 minutos a que Google actualice sus servidores.";
    }

    switch (code) {
      case 'auth/invalid-api-key':
        return "Error crítico: La clave de API de Firebase no es válida o está mal configurada.";
      case 'auth/unauthorized-domain':
        return "Dominio no autorizado: Debes añadir esta URL a la lista de dominios permitidos en Firebase Authentication.";
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return "Credenciales incorrectas. Si eres nuevo, regístrate primero pulsando el botón de abajo.";
      case 'auth/email-already-in-use':
        return "Este correo ya está registrado. Intenta iniciar sesión.";
      case 'auth/weak-password':
        return "La contraseña es demasiado corta (mínimo 6 caracteres).";
      case 'auth/operation-not-allowed':
        return "Este método de acceso no está habilitado en tu consola de Firebase.";
      default:
        return `Fallo en el sistema: ${code}. Revisa la configuración de tu proyecto Firebase.`;
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await getOrCreateUserProfile(userCredential.user.uid, email.trim(), false, selectedRole);
      }
      toast({ 
        title: isLogin ? "Acceso Concedido" : "Cuenta Creada", 
        description: "Sincronización con ScoutPro 360 establecida." 
      });
      onAuthSuccess();
    } catch (error: any) {
      console.error("Auth Error Code:", error.code);
      toast({
        variant: "destructive",
        title: "Error de Seguridad",
        description: getAuthErrorMessage(error.code),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await getOrCreateUserProfile(result.user.uid, result.user.email || '', false);
      toast({ title: "Acceso con Google", description: "Identidad verificada." });
      onAuthSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error con Google",
        description: getAuthErrorMessage(error.code),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[400px] bg-card border-border/40 shadow-2xl p-0 overflow-hidden">
      <DialogHeader className="p-0">
        <DialogTitle className="sr-only">{isLogin ? 'Acceso' : 'Registro'}</DialogTitle>
        <DialogDescription className="sr-only">Formulario de acceso profesional</DialogDescription>
        <div className="bg-primary p-8 flex flex-col items-center gap-2 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center border border-white/20">
            <ShieldCheck className="text-primary-foreground h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-primary-foreground uppercase tracking-widest leading-tight">
            {isLogin ? 'Acceso Profesional' : 'Registro de Scout'}
          </h2>
        </div>
      </DialogHeader>

      <div className="p-8 space-y-6">
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email Corporativo</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="email" 
                placeholder="scout@club.com" 
                className="pl-10 h-12 bg-secondary/10 border-border/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Contraseña</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="pl-10 pr-10 h-12 bg-secondary/10 border-border/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Rol en el Club</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                <SelectTrigger className="h-12 bg-secondary/10 border-border/20">
                  <SelectValue placeholder="Selecciona tu rol" />
                </SelectTrigger>
                <SelectContent className="bg-[#1b263b] border-border/40">
                  <SelectItem value="analista">Analista / Scout</SelectItem>
                  <SelectItem value="entrenador">Entrenador</SelectItem>
                  <SelectItem value="director">Director Deportivo</SelectItem>
                  <SelectItem value="gestion">Gestión Club</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isLogin ? 'Entrar al Sistema' : 'Crear Perfil')}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/40" /></div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
            <span className="bg-card px-2 text-muted-foreground">O accede con</span>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full h-12 border-border/40 hover:bg-secondary/50 font-bold uppercase tracking-widest gap-2 text-[10px]"
          onClick={handleGoogleAuth}
          disabled={loading}
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google Workspace
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          {isLogin ? '¿No tienes credenciales?' : '¿Ya eres miembro?'} 
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)} 
            className="ml-2 text-primary font-black hover:underline"
          >
            {isLogin ? 'Regístrate' : 'Accede Aquí'}
          </button>
        </p>
      </div>
    </DialogContent>
  );
}
