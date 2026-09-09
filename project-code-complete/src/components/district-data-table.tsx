import React, { useEffect, useState } from "react";
import { fetchDistrictData, DistrictData } from "@/lib/api";
import { districtList } from "@/lib/districtList";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { DistrictDetailsModal } from "@/components/district-details-modal";
import { ExternalLink } from "lucide-react";

interface DistrictDataTableProps {
  district: string;
}

export const DistrictDataTable: React.FC<DistrictDataTableProps> = ({ district }) => {
  const { t } = useLanguage();
  const [data, setData] = useState<DistrictData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedDistrictModal, setSelectedDistrictModal] = useState<{
    name: string;
    totalCases?: number;
    urgentCases?: number;
    lastUpdated?: string;
  } | null>(null);

  // Binary search helper
  const binarySearch = (arr: string[], target: string): number => {
    let low = 0;
    let high = arr.length - 1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const cmp = (arr[mid] ?? "").localeCompare(target);
      if (cmp === 0) return mid;
      if (cmp < 0) low = mid + 1;
      else high = mid - 1;
    }
    return -1;
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    // Ensure district list is sorted for binary search
    const sortedDistricts = [...districtList].sort((a, b) => a.localeCompare(b));
    const idx = binarySearch(sortedDistricts, district);
    if (idx === -1) {
      if (isMounted) {
        setError(`District "${district}" not found in trusted source`);
        setLoading(false);
      }
      return () => {
        isMounted = false;
      };
    }
    fetchDistrictData(district)
      .then((result) => {
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Failed to fetch data");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [district]);

  if (loading) {
    return <p className="text-muted-foreground text-sm">{t("loading")}</p>;
  }

  if (error) {
    return (
      <p className="text-red-500 text-sm">
        {t("errorFetchingData")}: {error}
      </p>
    );
  }

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">{t("noDataAvailable")}</p>;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{t("trustedSource")}</Badge>
          <span className="text-sm text-muted-foreground">
            {t("districtDataFor")}: <strong className="text-foreground">{district}</strong>
          </span>
        </div>
        <span className="text-xs text-muted-foreground italic">Click any district row for live nodal details &amp; emergency dispatch</span>
      </div>
      
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>{t("district")}</TableHead>
              <TableHead>{t("totalCases")}</TableHead>
              <TableHead>{t("urgentCases")}</TableHead>
              <TableHead>{t("lastUpdated")}</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.district}
                onClick={() =>
                  setSelectedDistrictModal({
                    name: row.district,
                    totalCases: row.totalCases,
                    urgentCases: row.urgentCases,
                    lastUpdated: row.lastUpdated,
                  })
                }
                className="cursor-pointer transition-colors hover:bg-brand/10 group"
              >
                <TableCell className="font-semibold text-foreground group-hover:text-brand flex items-center gap-1.5">
                  {row.district}
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-brand" />
                </TableCell>
                <TableCell>{row.totalCases}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-urgent/10 text-urgent">
                    {row.urgentCases} urgent
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{row.lastUpdated}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs font-semibold text-brand hover:bg-brand/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDistrictModal({
                        name: row.district,
                        totalCases: row.totalCases,
                        urgentCases: row.urgentCases,
                        lastUpdated: row.lastUpdated,
                      });
                    }}
                  >
                    Inspect
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableCaption>{t("districtStatistics")}</TableCaption>
        </Table>
      </div>

      {selectedDistrictModal && (
        <DistrictDetailsModal
          isOpen={Boolean(selectedDistrictModal)}
          onClose={() => setSelectedDistrictModal(null)}
          districtName={selectedDistrictModal.name}
          totalCases={selectedDistrictModal.totalCases}
          urgentCases={selectedDistrictModal.urgentCases}
          lastUpdated={selectedDistrictModal.lastUpdated}
        />
      )}
    </div>
  );
};
