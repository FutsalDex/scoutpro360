
'use client';

import React from 'react';
import { useTranslation } from '@/lib/i18n/context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const UKFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" className="h-4 w-6 rounded-sm shadow-sm">
    <clipPath id="s">
      <path d="M0,0 v30 h60 v-30 z"/>
    </clipPath>
    <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
  </svg>
);

const SpainFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 500" className="h-4 w-6 rounded-sm shadow-sm">
    <rect width="750" height="500" fill="#c60b1e"/>
    <rect width="750" height="250" y="125" fill="#ffc400"/>
  </svg>
);

export function LanguageSwitcher() {
  const { language, setLanguage } = useTranslation();

  const languages = [
    { code: 'en', label: 'English', flag: <UKFlag /> },
    { code: 'es', label: 'Español', flag: <SpainFlag /> },
  ];

  const currentLang = languages.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 px-3 gap-3 bg-secondary/50 border-border/50 hover:bg-secondary">
          <div className="flex items-center gap-2 font-black text-[12px] tracking-widest">
            <span className="flex items-center">{currentLang?.flag}</span>
            <span className="text-foreground">{currentLang?.code.toUpperCase()}</span>
          </div>
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 bg-[#1b263b] border-border/40 shadow-2xl p-1.5">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as 'en' | 'es')}
            className={`flex items-center gap-3 py-2.5 px-4 cursor-pointer transition-all rounded-lg mb-1 last:mb-0 ${
              language === lang.code 
                ? 'bg-primary/20 text-primary font-bold' 
                : 'hover:bg-white/5 text-foreground/80'
            }`}
          >
            <span className="flex items-center w-8">{lang.flag}</span>
            <span className="text-sm font-medium">{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
