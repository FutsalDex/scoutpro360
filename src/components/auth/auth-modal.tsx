'use client';

import React, { useState } from 'react';
import { auth } from '@/lib/firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  OAuthProvider
} from 'firebase/auth';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Mail, Lock, Loader2, Briefcase, Eye, EyeOff } from 'lucide-react';
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
    switch (code) {
      case 'auth/invalid-email':
        return "El formato del correo electrónico no es válido.";
      case 'auth/user-disabled':
        return "Esta cuenta ha sido desactivada por el administrador.";
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return "Correo electrónico o contraseña incorrectos.";
      case 'auth/email-already-in-use':
        return "Este correo electrónico ya está registrado en otra cuenta.";
      case 'auth/weak-password':
        return "La contraseña es demasiado débil (mínimo 6 caracteres).";
      case 'auth/popup-closed-by-user':
        return "Se cerró la ventana de acceso antes de completar el proceso.";
      case 'auth/operation-not-allowed':
        return "Este método de acceso no está habilitado actualmente.";
      case 'auth/network-request-failed':
        return "Error de red. Por favor, verifica tu conexión a internet.";
      case 'auth/too-many-requests':
        return "Demasiados intentos fallidos. El acceso se ha bloqueado temporalmente por seguridad.";
      case 'auth/internal-error':
        return "Error interno del servidor. Inténtalo de nuevo en unos minutos.";
      case 'auth/invalid-api-key':
        return "Error de configuración (API Key). Por favor, contacta con el administrador del club.";
      default:
        return "No se pudo completar la operación. Por favor, verifica tus datos o inténtalo más tarde.";
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await getOrCreateUserProfile(userCredential.user.uid, email, false, selectedRole);
      }
      toast({ title: isLogin ? "Acceso concedido" : "Cuenta creada", description: "Bienvenido a ScoutPro 360." });
      onAuthSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
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
      await signInWithPopup(auth, provider);
      toast({ title: "Acceso con Google", description: "Sincronización exitosa." });
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

  const handleAppleAuth = async () => {
    setLoading(true);
    try {
      const provider = new OAuthProvider('apple.com');
      await signInWithPopup(auth, provider);
      toast({ title: "Acceso con Apple", description: "Sincronización exitosa." });
      onAuthSuccess();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error con Apple",
        description: getAuthErrorMessage(error.code),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[420px] bg-card border-border/40 shadow-2xl p-0 overflow-hidden">
      <DialogHeader className="p-0 space-y-0">
        <DialogTitle className="sr-only">
          {isLogin ? 'Acceso a ScoutPro360' : 'Registro de Scout'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Inicia sesión o regístrate para acceder a la plataforma profesional de scouting.
        </DialogDescription>
        <div className="bg-primary p-8 flex flex-col items-center gap-2 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center border border-white/20">
            <ShieldCheck className="text-primary-foreground h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-primary-foreground uppercase tracking-widest leading-tight">
            {isLogin ? 'Acceso a ScoutPro360' : 'Registro de Scout'}
          </h2>
        </div>
      </DialogHeader>

      <div className="p-8 space-y-6">
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Correo Electrónico</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                type="email" 
                placeholder="scout@club.com" 
                className="pl-10 h-12 bg-secondary/10"
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
                className="pl-10 pr-10 h-12 bg-secondary/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center"
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tu Rol Profesional</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
                  <SelectTrigger className="pl-10 h-12 bg-secondary/10 border-input">
                    <SelectValue placeholder="Selecciona tu rol" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1b263b] border-border/40">
                    <SelectItem value="analista">Analista</SelectItem>
                    <SelectItem value="entrenador">Entrenador</SelectItem>
                    <SelectItem value="director">Director deportivo</SelectItem>
                    <SelectItem value="gestion">Gestión Club</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Button type="submit" className="w-full h-12 bg-primary text-primary-foreground font-bold uppercase tracking-widest" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isLogin ? 'Entrar' : 'Crear Cuenta')}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/40" /></div>
          <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
            <span className="bg-card px-2 text-muted-foreground">O accede con</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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
            Google
          </Button>

          <Button 
            variant="outline" 
            className="w-full h-12 border-border/40 hover:bg-secondary/50 font-bold uppercase tracking-widest gap-2 text-[10px]"
            onClick={handleAppleAuth}
            disabled={loading}
          >
            <svg className="h-4 w-4" viewBox="0 0 384 512">
              <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 21.8-88.5 21.8-11.4 0-51.1-20.8-82.3-20.8-45.6 0-101.3 33.4-124.7 94.6-24.9 65.1-6.1 161.8 21.1 228.4 20.6 48.6 51 93.3 93.1 93.1 24.5 0 34.6-13.4 72-13.4 37.6 0 46.8 13.4 72.8 13.4 44.5 0 71.4-41.1 92.4-76.3 26-44.4 36.4-86.8 36.8-89.2-.8-.4-71.1-27.4-71.1-107.1zm-40.8-186.1c16.2-19.1 27.2-45.5 24.2-72-21.7 1.1-48.4 14.5-64.3 32.7-14 15.9-26.6 43.1-23.4 68.7 24.3 1.8 47.1-10.4 63.5-29.4z" />
            </svg>
            Apple
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {isLogin ? '¿No tienes cuenta?' : '¿Ya eres scout?'} 
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)} 
            className="ml-2 text-primary font-bold hover:underline"
          >
            {isLogin ? 'Regístrate' : 'Accede aquí'}
          </button>
        </p>
      </div>
    </DialogContent>
  );
}
