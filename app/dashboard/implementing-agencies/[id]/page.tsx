import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowLeft,
  Building2,
  FileText,
  CheckCircle2,
  Clock,
  TrendingUp,
  Mail,
  Phone,
  MapPin,
  Globe,
  User,
  Pause,
  ClipboardList,
} from "lucide-react"
import { ThemeToggle } from "../../components/ThemeToggle"
import { formatCurrency, getAgencyById, getAgencyStats } from "../mock-data"
import { ProjectCard } from "../components/ProjectCard"

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AgencyDetailPage({ params }: PageProps) {
  const { id } = await params
  const agency = getAgencyById(id)

  if (!agency) {
    notFound()
  }

  const stats = getAgencyStats(agency)

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

  const ongoingProjects = agency.projects.filter((p) => p.status === "ongoing")
  const completedProjects = agency.projects.filter((p) => p.status === "completed")
  const plannedProjects = agency.projects.filter((p) => p.status === "planned")
  const onHoldProjects = agency.projects.filter((p) => p.status === "on-hold")

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/implementing-agencies">
                <Button variant="ghost" size="icon" className="hover:bg-[#15803D]/10">
                  <ArrowLeft className="h-5 w-5" style={{ color: "#15803D" }} />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl md:text-4xl font-cinzel font-bold tracking-tight" style={{ color: "#15803D" }}>
                  PPDO
                </h1>
                <p className="text-sm md:text-base text-muted-foreground mt-1">
                  Provincial Planning and Development Office
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-10 space-y-8">
        {/* Agency Header */}
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-4 md:p-6 rounded-2xl" style={{ backgroundColor: "#15803D20" }}>
              <Building2 className="h-10 w-10 md:h-12 md:w-12" style={{ color: "#15803D" }} />
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className={`${getTypeColor(agency.type)} font-medium`}>
                  {agency.type.toUpperCase()}
                </Badge>
              </div>
              <div>
                <h2 className="text-3xl md:text-5xl font-cinzel font-bold tracking-tight mb-2">{agency.acronym}</h2>
                <p className="text-lg md:text-xl text-muted-foreground">{agency.name}</p>
              </div>
              <p className="text-base md:text-lg text-muted-foreground max-w-4xl leading-relaxed">
                {agency.description}
              </p>
            </div>
          </div>
        </div>

        {/* Status Information Card */}
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-cinzel font-semibold">Agency Overview</h3>
              <Badge variant="outline" style={{ borderColor: "#15803D", color: "#15803D" }}>
                Active
              </Badge>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Total Projects</p>
                <p className="text-3xl font-bold font-cinzel">{agency.totalProjects}</p>
                <p className="text-xs text-muted-foreground mt-1">All projects</p>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Active Projects</p>
                <p className="text-3xl font-bold font-cinzel text-[#15803D]">{agency.activeProjects}</p>
                <p className="text-xs text-muted-foreground mt-1">Currently ongoing</p>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-3xl font-bold font-cinzel text-blue-600 dark:text-blue-400">
                  {agency.completedProjects}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Successfully finished</p>
              </div>

              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Utilization Rate</p>
                <p className="text-3xl font-bold font-cinzel">{stats.utilizationRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">Budget efficiency</p>
              </div>
            </div>

            {/* Budget Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>Total Allocated Budget</span>
                  </div>
                  <p className="text-2xl font-bold font-cinzel">{formatCurrency(agency.totalBudget)}</p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Total Utilized Budget</span>
                  </div>
                  <p className="text-2xl font-bold font-cinzel text-[#15803D]">
                    {formatCurrency(agency.utilizedBudget)}
                  </p>
                </CardContent>
              </Card>

              <Card className="border">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4" />
                    <span>Average per Project</span>
                  </div>
                  <p className="text-2xl font-bold font-cinzel">{formatCurrency(stats.avgProjectBudget)}</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-2">
          <CardContent className="p-6">
            <h3 className="text-xl font-cinzel font-semibold mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-[#15803D] mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Head Officer</p>
                    <p className="font-semibold">{agency.headOfficer}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-[#15803D] mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email Address</p>
                    <p className="font-semibold">{agency.contactEmail}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-[#15803D] mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Contact Number</p>
                    <p className="font-semibold">{agency.contactPhone}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#15803D] mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Office Address</p>
                    <p className="font-semibold">{agency.address}</p>
                  </div>
                </div>
                {agency.website && (
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-[#15803D] mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      <a
                        href={agency.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#15803D] hover:underline"
                      >
                        {agency.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl md:text-3xl font-cinzel font-bold">Projects Portfolio</h3>
            <p className="text-sm text-muted-foreground">{agency.projects.length} total projects</p>
          </div>

          {/* Ongoing Projects */}
          {ongoingProjects.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#15803D]" />
                <h4 className="text-xl font-cinzel font-semibold">Ongoing Projects</h4>
                <Badge variant="outline" style={{ borderColor: "#15803D", color: "#15803D" }}>
                  {ongoingProjects.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ongoingProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}

          {/* Completed Projects */}
          {completedProjects.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xl font-cinzel font-semibold">Completed Projects</h4>
                <Badge variant="outline" className="border-blue-500/20 text-blue-600 dark:text-blue-400">
                  {completedProjects.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}

          {/* Planned Projects */}
          {plannedProjects.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h4 className="text-xl font-cinzel font-semibold">Planned Projects</h4>
                <Badge variant="outline" className="border-amber-500/20 text-amber-600 dark:text-amber-400">
                  {plannedProjects.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plannedProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}

          {/* On-Hold Projects */}
          {onHoldProjects.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Pause className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h4 className="text-xl font-cinzel font-semibold">On-Hold Projects</h4>
                <Badge variant="outline" className="border-gray-500/20 text-gray-600 dark:text-gray-400">
                  {onHoldProjects.length}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {onHoldProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>
          )}
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
