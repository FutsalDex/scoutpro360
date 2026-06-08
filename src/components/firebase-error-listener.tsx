'use client';
import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      // Nunca hacer throw — crashea React en desarrollo
      // Solo loggear en consola para depuración
      console.warn('[FirestorePermissionError]', error?.message || error);

      if (process.env.NODE_ENV !== 'development') {
        toast({
          variant: "destructive",
          title: "Error de Permisos",
          description: "No tienes autorización para realizar esta acción.",
        });
      }
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}