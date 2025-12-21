"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, FileText, CheckCircle2, Clock, Mail, Phone } from "lucide-react"
import { formatCurrency, getAgencyStats, ImplementingAgency } from "../mock-data"
import { useAccentColor } from "@/app/dashboard/contexts/AccentColorContext"

interface AgencyCardProps {
  agency: ImplementingAgency
}

export function AgencyCard({ agency }: AgencyCardProps) {
  const stats = getAgencyStats(agency)
  const { accentColorValue } = useAccentColor()

  const getTypeColor = (type: string) => {
    switch (type) {
      case "national":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"
      case "provincial":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
      case "local":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
      case "municipal":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20"
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20"
    }
  }

  return (
    <Link href={`/dashboard/implementing-agencies/${agency.id}`}>
      <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-[#15803D]/30">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-xl group-hover:scale-110 transition-transform"
                style={{ backgroundColor: `${accentColorValue}20` }}
              >
                <Building2 className="h-6 w-6" style={{ color: accentColorValue }} />
              </div>
              <div className="flex-1 min-w-0">
                <Badge variant="outline" className={`${getTypeColor(agency.type)} font-medium mb-2`}>
                  {agency.type.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <CardTitle className="text-xl font-cinzel leading-tight mb-2 group-hover:text-[#15803D] transition-colors">
              {agency.acronym}
            </CardTitle>
            <CardDescription className="text-xs font-medium text-muted-foreground line-clamp-1">
              {agency.name}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{agency.description}</p>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>Total</span>
              </div>
              <p className="text-lg font-bold font-cinzel">{agency.totalProjects}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Active</span>
              </div>
              <p className="text-lg font-bold font-cinzel text-[#15803D]">{agency.activeProjects}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3" />
                <span>Done</span>
              </div>
              <p className="text-lg font-bold font-cinzel text-blue-600 dark:text-blue-400">
                {agency.completedProjects}
              </p>
            </div>
          </div>

          {/* Budget Information */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total Budget</span>
              <span className="font-semibold">{formatCurrency(agency.totalBudget)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Utilized</span>
              <span className="font-semibold text-[#15803D]">{formatCurrency(agency.utilizedBudget)}</span>
            </div>

            {/* Utilization Progress Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Utilization Rate</span>
                <span className="font-semibold">{stats.utilizationRate}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.utilizationRate}%`,
                    backgroundColor: accentColorValue,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{agency.contactEmail}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{agency.contactPhone}</span>
            </div>
          </div>

          {/* View Details Indicator */}
          <div className="pt-2">
            <div className="text-xs font-medium text-[#15803D] group-hover:underline flex items-center gap-1">
              View Details
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
