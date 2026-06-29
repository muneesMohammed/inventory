import React from "react";
import { Sparkles, ArrowRight, ShieldCheck, HelpCircle, Flame, Snowflake, AlertCircle } from "lucide-react";
import { AICallResult } from "../types";

interface AISuggestionBoxProps {
  suggestion: AICallResult;
  onApply: () => void;
  isLoading: boolean;
}

export default function AISuggestionBox({ suggestion, onApply, isLoading }: AISuggestionBoxProps) {
  if (isLoading) {
    return (
      <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 relative overflow-hidden animate-pulse">
        <div className="absolute top-0 right-0 h-40 w-40 bg-amber-500/10 blur-3xl rounded-full" />
        <div className="flex items-center gap-3 mb-4">
          <div className="h-6 w-6 bg-slate-800 rounded-full flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-amber-400 animate-spin" />
          </div>
          <div className="h-4 w-48 bg-slate-800 rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-slate-800 rounded w-full" />
          <div className="h-3 bg-slate-800 rounded w-5/6" />
          <div className="h-3 bg-slate-800 rounded w-4/6" />
        </div>
      </div>
    );
  }

  // Determine regulatory agency badges
  const getRegBadge = (body: string) => {
    switch (body) {
      case "TDRA":
        return {
          bg: "bg-blue-950 border-blue-800 text-blue-300",
          desc: "Telecommunications & Digital Gov Regulatory Authority"
        };
      case "Dubai Municipality":
        return {
          bg: "bg-emerald-950 border-emerald-800 text-emerald-300",
          desc: "Dubai Food Safety & Consumer Products Department"
        };
      case "MOHAP":
        return {
          bg: "bg-rose-950 border-rose-800 text-rose-300",
          desc: "Ministry of Health & Prevention UAE"
        };
      default:
        return {
          bg: "bg-slate-800 border-slate-700 text-slate-300",
          desc: "No specialized UAE ministry permit required"
        };
    }
  };

  const regInfo = getRegBadge(suggestion.regulatoryRequirement);

  return (
    <div className="bg-slate-950 text-slate-100 rounded-xl p-6 border border-slate-800 relative overflow-hidden shadow-xl">
      {/* Decorative gold backdrop glow */}
      <div className="absolute -top-12 -right-12 h-32 w-32 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-500/20 p-1.5 rounded-lg border border-amber-500/30">
            <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
          </div>
          <div>
            <h4 className="font-display font-bold tracking-wide text-white text-sm sm:text-base">
              Gemini Customs Intelligence Report
            </h4>
            <p className="text-xs text-slate-400">Harmonized Tariff Classification suggested successfully</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onApply}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md active:scale-95 group shrink-0"
        >
          Apply HS Code & Details
          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
        
        {/* HS classification and Duty Rate */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono uppercase block tracking-wider">Suggested HS Code</span>
              <span className="text-base font-bold font-mono text-amber-400 mt-1 block">
                {suggestion.hsCode}
              </span>
            </div>
            
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-400 font-mono uppercase block tracking-wider">UAE Duty Tariff</span>
              <span className="text-base font-bold font-mono text-emerald-400 mt-1 block">
                {(suggestion.dutyRate * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono uppercase block tracking-wider">HS Chapter Nomenclature</span>
            <p className="text-slate-200 mt-1 text-[11px] font-medium leading-relaxed">
              {suggestion.hsDescription}
            </p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono uppercase block tracking-wider">UAE Regulatory Control</span>
            <div className="flex flex-col gap-1.5 mt-1.5">
              <span className={`inline-self-start px-2 py-0.5 rounded text-[10px] font-bold border ${regInfo.bg}`}>
                {suggestion.regulatoryRequirement}
              </span>
              <p className="text-slate-300 text-[11px] leading-normal">{suggestion.regulatoryNotes}</p>
            </div>
          </div>
        </div>

        {/* Customs Compliant Description & Warehouse Handling */}
        <div className="space-y-4">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono uppercase block tracking-wider">Optimized Bill of Entry Description</span>
            <p className="text-slate-200 mt-1 font-mono text-[11px] leading-relaxed border-l-2 border-amber-500/50 pl-2.5">
              "{suggestion.customsDescription}"
            </p>
            <span className="text-[9px] text-slate-500 mt-1.5 block">✓ Compliance optimized for Dubai Trade declaration filing.</span>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 font-mono uppercase block tracking-wider">Free Zone Warehousing Directives</span>
            <div className="flex items-start gap-2.5 mt-1.5">
              {suggestion.freeZoneHandlingNotes.toLowerCase().includes("cold") || suggestion.freeZoneHandlingNotes.toLowerCase().includes("temp") ? (
                <Snowflake className="h-4.5 w-4.5 text-cyan-400 shrink-0 mt-0.5" />
              ) : suggestion.freeZoneHandlingNotes.toLowerCase().includes("flammable") || suggestion.freeZoneHandlingNotes.toLowerCase().includes("hazard") ? (
                <Flame className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
              )}
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {suggestion.freeZoneHandlingNotes}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
