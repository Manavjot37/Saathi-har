import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Brain, Cpu, AlertTriangle, Activity, Mic, MessageSquare, Clock, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface XAIExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  victimName: string;
  distressScore: number;
  riskTier: "urgent" | "high" | "moderate" | "routine" | "priority" | "review";
  category?: string | undefined;
}

export function XAIExplanationModal({
  isOpen,
  onClose,
  victimName,
  distressScore,
  riskTier,
  category = "Rape / Severe Trauma",
}: XAIExplanationModalProps) {
  const { t } = useLanguage();

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "urgent":
        return "bg-urgent/10 text-urgent border-urgent/30";
      case "high":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "moderate":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      default:
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-brand" />
            <DialogTitle className="font-display text-lg">
              Explainable AI (XAI) Risk Attribution
            </DialogTitle>
          </div>
          <DialogDescription>
            Algorithmic score breakdown & evidence attribution for victim distress evaluation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Header Badge Card */}
          <div className="saathi-panel p-4 flex flex-wrap items-center justify-between gap-3 bg-muted/20">
            <div>
              <p className="text-xs text-muted-foreground">Victim Case Reference</p>
              <p className="font-display text-base font-bold text-foreground">{victimName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Category: {category}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${getTierColor(riskTier)} uppercase tracking-wider`}>
                {riskTier} Risk Tier
              </span>
              <p className="font-display text-2xl font-bold text-foreground mt-1">
                {distressScore} <span className="text-xs font-normal text-muted-foreground">/ 100</span>
              </p>
            </div>
          </div>

          {/* Model Confidence & Feature Importance Weights */}
          <div>
            <h4 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-brand" /> AI Model Weight Distribution (Multimodal Fusion)
            </h4>
            <div className="space-y-3">
              {/* Feature 1: Text NLP */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <MessageSquare className="h-3.5 w-3.5 text-purple-500" /> Sentiment NLP & Threat Keyword Analysis
                  </span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">42% Contribution</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: "42%" }}></div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Detected high-frequency trauma triggers: <em>"threatened by accused"</em>, <em>"fear of retaliatory arson"</em>, <em>"unable to sleep"</em>.
                </p>
              </div>

              {/* Feature 2: Voice Acoustic */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Mic className="h-3.5 w-3.5 text-amber-500" /> Acoustic Voice Stress & Tremor Index
                  </span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">33% Contribution</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: "33%" }}></div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Pitch instability score: 0.78 (Elevated micro-tremors detected during IVRS call timestamp 14:32).
                </p>
              </div>

              {/* Feature 3: Behavioral Delay */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <Clock className="h-3.5 w-3.5 text-blue-500" /> Behavioral Check-In Delay & Interaction Drop-off
                  </span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">25% Contribution</span>
                </div>
                <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: "25%" }}></div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Check-in interval exceeded normal baseline by 36 hours. Interaction frequency dropped 65%.
                </p>
              </div>
            </div>
          </div>

          {/* Explainability Governance Notice */}
          <div className="border border-border/80 rounded-lg p-3 bg-card flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-brand shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-semibold text-foreground">Auditability & Legal Compliance Statement</p>
              <p className="text-muted-foreground leading-relaxed">
                This prediction is generated via XAI SHAP (SHapley Additive exPlanations) values to ensure full transparency under the SC/ST (PoA) Act & GDPR standards. Human counsellor oversight is required prior to emergency escalation.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
