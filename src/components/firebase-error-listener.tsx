'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { useToast } from '@/hooks/use-toast';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handlePermissionError = (error: any) => {
      // En desarrollo, dejamos que Next.js muestre el error en pantalla completa
      // para facilitar la depuración de reglas de seguridad.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      }

      // En producción, mostramos un toast amigable
      toast({
        variant: "destructive",
        title: "Error de Permisos",
        description: "No tienes autorización para realizar esta acción.",
      });
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.off('permission-error', handlePermissionError);
    };
  }, [toast]);

  return null;
}
