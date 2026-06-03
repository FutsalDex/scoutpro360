"use client"

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Move, Square, Trash2, Undo } from 'lucide-react';

interface Point {
  x: number;
  y: number;
}

interface Path {
  points: Point[];
  type: 'arrow' | 'line' | 'area';
  color: string;
}

export function TacticalCanvas() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [paths, setPaths] = useState<Path[]>([]);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [tool, setTool] = useState<'pencil' | 'arrow'>('pencil');

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    
    // Calculate normalized coordinates based on the viewBox
    const x = ((clientX - rect.left) / rect.width) * 600;
    const y = ((clientY - rect.top) / rect.height) * 400;
    return { x, y };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const pos = getCoordinates(e);
    setCurrentPath([pos]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pos = getCoordinates(e);
    setCurrentPath(prev => [...prev, pos]);
  };

  const handleEnd = () => {
    if (currentPath.length > 1) {
      setPaths(prev => [...prev, { points: currentPath, type: tool === 'pencil' ? 'line' : 'arrow', color: '#48CAE4' }]);
    }
    setCurrentPath([]);
    setIsDrawing(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-secondary p-2 rounded-lg border">
        <div className="flex gap-2">
          <Button 
            variant={tool === 'pencil' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setTool('pencil')}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant={tool === 'arrow' ? 'default' : 'ghost'} 
            size="sm" 
            onClick={() => setTool('arrow')}
            className="h-8 w-8 p-0"
          >
            <Move className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setPaths(p => p.slice(0, -1))}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPaths([])} className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="relative aspect-[3/2] w-full bg-[#1B263B] rounded-xl overflow-hidden border-2 border-border/50 shadow-2xl touch-none">
        {/* Pitch Markings */}
        <svg viewBox="0 0 600 400" className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
          <rect x="0" y="0" width="600" height="400" fill="none" stroke="#E0B050" strokeWidth="2" />
          <line x1="300" y1="0" x2="300" y2="400" stroke="#E0B050" strokeWidth="2" />
          <circle cx="300" cy="200" r="40" fill="none" stroke="#E0B050" strokeWidth="2" />
          <rect x="0" y="100" width="60" height="200" fill="none" stroke="#E0B050" strokeWidth="2" />
          <rect x="540" y="100" width="60" height="200" fill="none" stroke="#E0B050" strokeWidth="2" />
          <circle cx="0" cy="200" r="4" fill="#E0B050" />
          <circle cx="600" cy="200" r="4" fill="#E0B050" />
          <circle cx="300" cy="200" r="4" fill="#E0B050" />
        </svg>

        {/* User Drawings */}
        <svg
          ref={svgRef}
          viewBox="0 0 600 400"
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        >
          {paths.map((path, i) => (
            <polyline
              key={i}
              points={path.points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke={path.color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          {currentPath.length > 0 && (
            <polyline
              points={currentPath.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="#48CAE4"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.7"
            />
          )}
        </svg>
      </div>
      <p className="text-xs text-muted-foreground text-center">Draw movement vectors and heatmaps directly on the pitch</p>
    </div>
  );
}
