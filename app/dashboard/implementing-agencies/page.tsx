
import { Building2, TrendingUp, FileText, Users } from "lucide-react"
import { formatCurrency, implementingAgencies } from "./mock-data"
import { ThemeToggle } from "../components/ThemeToggle"
import { AgencyCard } from "./components/AgencyCard"

export default function ImplementingAgenciesPage() {
  const totalAgencies = implementingAgencies.length
  const totalProjects = implementingAgencies.reduce((sum, agency) => sum + agency.totalProjects, 0)
  const totalBudget = implementingAgencies.reduce((sum, agency) => sum + agency.totalBudget, 0)
  const totalUtilized = implementingAgencies.reduce((sum, agency) => sum + agency.utilizedBudget, 0)
  const avgUtilization = totalBudget > 0 ? ((totalUtilized / totalBudget) * 100).toFixed(1) : "0.0"

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-4xl font-cinzel font-bold tracking-tight" style={{ color: "#15803D" }}>
                PPDO
              </h1>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Provincial Planning and Development Office
              </p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-10 space-y-8">
        {/* Page Title */}
        <div className="space-y-2">
          <h2 className="text-3xl md:text-4xl font-cinzel font-bold tracking-tight">Implementing Agencies</h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-3xl">
            Comprehensive overview of government agencies responsible for executing development projects across the
            province.
          </p>
        </div>

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-card border rounded-xl p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#15803D20" }}>
                <Building2 className="h-5 w-5" style={{ color: "#15803D" }} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Agencies</p>
              <p className="text-3xl font-bold font-cinzel">{totalAgencies}</p>
              <p className="text-xs text-muted-foreground">Active implementing bodies</p>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#15803D20" }}>
                <FileText className="h-5 w-5" style={{ color: "#15803D" }} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Projects</p>
              <p className="text-3xl font-bold font-cinzel">{totalProjects}</p>
              <p className="text-xs text-muted-foreground">Across all agencies</p>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#15803D20" }}>
                <TrendingUp className="h-5 w-5" style={{ color: "#15803D" }} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Budget</p>
              <p className="text-2xl md:text-3xl font-bold font-cinzel">{formatCurrency(totalBudget)}</p>
              <p className="text-xs text-muted-foreground">Allocated funding</p>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6 space-y-2 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg" style={{ backgroundColor: "#15803D20" }}>
                <Users className="h-5 w-5" style={{ color: "#15803D" }} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Utilization Rate</p>
              <p className="text-3xl font-bold font-cinzel">{avgUtilization}%</p>
              <p className="text-xs text-muted-foreground">Budget efficiency</p>
            </div>
          </div>
        </div>

        {/* Agency Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl md:text-2xl font-cinzel font-semibold">All Agencies</h3>
            <p className="text-sm text-muted-foreground">{totalAgencies} agencies found</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {implementingAgencies.map((agency) => (
              <AgencyCard key={agency.id} agency={agency} />
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16 py-8 bg-card/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Provincial Planning and Development Office. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
