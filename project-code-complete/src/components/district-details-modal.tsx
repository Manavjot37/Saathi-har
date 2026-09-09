import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Shield, Users, AlertCircle, CheckCircle, Activity, FileText } from "lucide-react";
import { toast } from "sonner";

interface DistrictDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  districtName: string;
  totalCases?: number | undefined;
  urgentCases?: number | undefined;
  lastUpdated?: string | undefined;
}

export const DistrictDetailsModal: React.FC<DistrictDetailsModalProps> = ({
  isOpen,
  onClose,
  districtName,
  totalCases = 142,
  urgentCases = 18,
  lastUpdated = "Today, 14:30",
}) => {
  if (!districtName) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand" />
            <DialogTitle className="font-display text-lg">
              District Analytics: {districtName}
            </DialogTitle>
          </div>
          <DialogDescription>
            Live SC/ST (PoA) Act monitoring data & emergency dispatch portal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Summary Stat Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="saathi-panel p-3 bg-muted/20">
              <p className="text-xs text-muted-foreground">Total Cases</p>
              <p className="font-display text-xl font-bold text-foreground mt-0.5">
                {totalCases}
              </p>
              <p className="text-[10px] text-muted-foreground">Active in portal</p>
            </div>
            <div className="saathi-panel p-3 bg-urgent/10 border-urgent/30">
              <p className="text-xs text-urgent font-medium">Urgent Triage Cases</p>
              <p className="font-display text-xl font-bold text-urgent mt-0.5">
                {urgentCases}
              </p>
              <p className="text-[10px] text-urgent/80">Requires 181 follow-up</p>
            </div>
          </div>

          {/* Operational Status */}
          <div className="border border-border/80 rounded-xl p-3 bg-card space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Shield className="h-3.5 w-3.5 text-brand" /> 181 Women Helpline Squads:
              </span>
              <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Active &amp; Operational
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Users className="h-3.5 w-3.5 text-blue-500" /> Active Counsellors:
              </span>
              <span className="font-bold text-foreground">12 Assigned</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Activity className="h-3.5 w-3.5 text-amber-500" /> Resolution Rate:
              </span>
              <span className="font-bold text-foreground">89.4%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1.5 font-medium">
                <Phone className="h-3.5 w-3.5 text-purple-500" /> Nodal Helpline:
              </span>
              <span className="font-mono text-foreground font-semibold">011-23371810</span>
            </div>
          </div>

          {/* Interactive Actions */}
          <div className="space-y-2 pt-1">
            <Button
              className="w-full text-xs font-semibold"
              onClick={() => {
                toast.success(`Emergency squad dispatch signal sent to ${districtName} nodal cell.`);
                onClose();
              }}
            >
              <AlertCircle className="mr-1.5 h-4 w-4" /> Dispatch Rapid Squad to {districtName}
            </Button>
            <Button
              variant="outline"
              className="w-full text-xs font-semibold"
              onClick={() => {
                toast.info(`Downloading official SC/ST crime dossier for ${districtName}`);
                onClose();
              }}
            >
              <FileText className="mr-1.5 h-4 w-4" /> Export District Crime Dossier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
