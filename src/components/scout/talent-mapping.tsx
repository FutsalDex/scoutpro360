"use client"

import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import placeholderData from '@/app/lib/placeholder-images.json';

interface TalentMappingProps {
  global?: boolean;
}

export function TalentMapping({ global = false }: TalentMappingProps) {
  const mapImage = placeholderData.placeholderImages.find(img => img.id === 'map-background')?.imageUrl || "";

  return (
    <div className="w-full animate-in fade-in duration-1000">
      <Card className="border-none bg-transparent overflow-hidden relative min-h-[600px] w-full shadow-2xl">
        <CardContent className="p-0 h-full relative flex items-center justify-center">
          {/* Imagen del Mapamundi Oficial */}
          {mapImage && (
            <div className="relative w-full h-full">
               <img 
                 src={mapImage} 
                 alt="Tactical World Map" 
                 className="w-full h-auto object-contain block opacity-100"
                 loading="eager"
               />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
