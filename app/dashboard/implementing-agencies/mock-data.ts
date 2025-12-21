export interface Project {
  id: string
  name: string
  description: string
  status: "ongoing" | "completed" | "planned" | "on-hold"
  budget: number
  utilized: number
  startDate: string
  endDate: string
  location: string
  beneficiaries?: number
}

export interface ImplementingAgency {
  id: string
  name: string
  acronym: string
  description: string
  type: "national" | "local" | "provincial" | "municipal"
  headOfficer: string
  contactEmail: string
  contactPhone: string
  address: string
  website?: string
  totalProjects: number
  activeProjects: number
  completedProjects: number
  totalBudget: number
  utilizedBudget: number
  projects: Project[]
}

export const implementingAgencies: ImplementingAgency[] = [
  {
    id: "1",
    name: "Department of Public Works and Highways",
    acronym: "DPWH",
    description:
      "Responsible for planning, design, construction and maintenance of infrastructure facilities, especially national highways, flood control and water resource development systems.",
    type: "national",
    headOfficer: "Engr. Maria Santos",
    contactEmail: "dpwh.provincial@gov.ph",
    contactPhone: "+63 912 345 6789",
    address: "Provincial Capitol Complex, Main Highway, Province",
    website: "https://dpwh.gov.ph",
    totalProjects: 12,
    activeProjects: 8,
    completedProjects: 4,
    totalBudget: 450000000,
    utilizedBudget: 285000000,
    projects: [
      {
        id: "p1",
        name: "Provincial Road Rehabilitation Project",
        description:
          "Comprehensive rehabilitation and improvement of 45km provincial roads connecting municipalities to improve accessibility and economic development.",
        status: "ongoing",
        budget: 125000000,
        utilized: 78000000,
        startDate: "2024-01-15",
        endDate: "2025-06-30",
        location: "Various Municipalities",
        beneficiaries: 45000,
      },
      {
        id: "p2",
        name: "Bridge Construction - San Miguel River",
        description:
          "Construction of new 180-meter concrete bridge to replace old wooden structure and facilitate year-round transportation.",
        status: "ongoing",
        budget: 85000000,
        utilized: 52000000,
        startDate: "2024-03-01",
        endDate: "2025-08-15",
        location: "Barangay San Miguel",
        beneficiaries: 12000,
      },
      {
        id: "p3",
        name: "Flood Control System Phase 2",
        description:
          "Installation of concrete flood walls and drainage systems in flood-prone areas to protect communities during typhoon season.",
        status: "ongoing",
        budget: 95000000,
        utilized: 68000000,
        startDate: "2023-11-01",
        endDate: "2025-04-30",
        location: "Riverside Communities",
        beneficiaries: 28000,
      },
      {
        id: "p4",
        name: "Farm-to-Market Road Development",
        description:
          "Construction of 25km farm-to-market roads with concrete pavement to improve agricultural product transportation.",
        status: "completed",
        budget: 65000000,
        utilized: 64500000,
        startDate: "2023-02-01",
        endDate: "2024-10-30",
        location: "Agricultural Districts",
        beneficiaries: 8500,
      },
      {
        id: "p5",
        name: "Municipal Road Network Expansion",
        description: "Expansion and paving of municipal road networks to connect remote barangays to town centers.",
        status: "ongoing",
        budget: 48000000,
        utilized: 15000000,
        startDate: "2024-09-01",
        endDate: "2026-03-31",
        location: "Remote Barangays",
        beneficiaries: 15000,
      },
      {
        id: "p6",
        name: "School Access Road Improvement",
        description:
          "Improvement of access roads to public schools ensuring safe passage for students during all weather conditions.",
        status: "completed",
        budget: 32000000,
        utilized: 31800000,
        startDate: "2023-06-01",
        endDate: "2024-08-15",
        location: "School Zones",
        beneficiaries: 5200,
      },
    ],
  },
  {
    id: "2",
    name: "Department of Agriculture",
    acronym: "DA",
    description:
      "Promotes agricultural development by providing policy framework, public investments, and support services for food security and farm income.",
    type: "national",
    headOfficer: "Dr. Roberto Cruz",
    contactEmail: "da.provincial@gov.ph",
    contactPhone: "+63 917 234 5678",
    address: "Agricultural Center Building, Provincial Complex",
    website: "https://da.gov.ph",
    totalProjects: 15,
    activeProjects: 11,
    completedProjects: 4,
    totalBudget: 280000000,
    utilizedBudget: 195000000,
    projects: [
      {
        id: "p7",
        name: "Rice Productivity Enhancement Program",
        description:
          "Distribution of certified seeds, fertilizers, and modern farming equipment to increase rice yield and farmer income.",
        status: "ongoing",
        budget: 45000000,
        utilized: 32000000,
        startDate: "2024-02-01",
        endDate: "2025-12-31",
        location: "Rice-Growing Municipalities",
        beneficiaries: 3500,
      },
      {
        id: "p8",
        name: "Irrigation System Modernization",
        description:
          "Rehabilitation and expansion of irrigation systems to ensure year-round water supply for agricultural lands.",
        status: "ongoing",
        budget: 78000000,
        utilized: 58000000,
        startDate: "2023-08-01",
        endDate: "2025-06-30",
        location: "Agricultural Zones 1-3",
        beneficiaries: 2800,
      },
      {
        id: "p9",
        name: "Organic Farming Training and Support",
        description: "Comprehensive training program and subsidy for farmers transitioning to organic farming methods.",
        status: "ongoing",
        budget: 22000000,
        utilized: 16000000,
        startDate: "2024-04-01",
        endDate: "2025-09-30",
        location: "Various Barangays",
        beneficiaries: 1200,
      },
      {
        id: "p10",
        name: "Post-Harvest Facilities Construction",
        description: "Construction of modern drying facilities and warehouses to reduce post-harvest losses.",
        status: "completed",
        budget: 55000000,
        utilized: 54200000,
        startDate: "2023-01-15",
        endDate: "2024-09-30",
        location: "Agricultural Trading Centers",
        beneficiaries: 4200,
      },
      {
        id: "p11",
        name: "Livestock Development Program",
        description:
          "Distribution of livestock and veterinary support to improve protein production and farmer livelihood.",
        status: "ongoing",
        budget: 38000000,
        utilized: 28000000,
        startDate: "2024-01-01",
        endDate: "2025-12-31",
        location: "Upland Communities",
        beneficiaries: 950,
      },
    ],
  },
  {
    id: "3",
    name: "Department of Health",
    acronym: "DOH",
    description:
      "Guarantees equitable, sustainable and quality health for all Filipinos through health system development.",
    type: "national",
    headOfficer: "Dr. Carmen Reyes",
    contactEmail: "doh.provincial@gov.ph",
    contactPhone: "+63 918 345 6789",
    address: "Provincial Health Office, Capitol Compound",
    website: "https://doh.gov.ph",
    totalProjects: 9,
    activeProjects: 6,
    completedProjects: 3,
    totalBudget: 185000000,
    utilizedBudget: 128000000,
    projects: [
      {
        id: "p12",
        name: "Rural Health Unit Modernization",
        description: "Upgrade and equipment of 15 rural health units with modern medical equipment and facilities.",
        status: "ongoing",
        budget: 52000000,
        utilized: 38000000,
        startDate: "2024-01-15",
        endDate: "2025-07-31",
        location: "Rural Municipalities",
        beneficiaries: 85000,
      },
      {
        id: "p13",
        name: "Mobile Health Clinic Program",
        description: "Deployment of fully-equipped mobile health clinics to serve remote and underserved communities.",
        status: "ongoing",
        budget: 28000000,
        utilized: 22000000,
        startDate: "2023-10-01",
        endDate: "2025-09-30",
        location: "Remote Barangays",
        beneficiaries: 42000,
      },
      {
        id: "p14",
        name: "COVID-19 Vaccination Drive",
        description:
          "Province-wide vaccination campaign with cold storage facilities and community vaccination centers.",
        status: "completed",
        budget: 35000000,
        utilized: 34800000,
        startDate: "2023-01-01",
        endDate: "2024-06-30",
        location: "All Municipalities",
        beneficiaries: 245000,
      },
      {
        id: "p15",
        name: "Maternal and Child Health Program",
        description: "Comprehensive health services for pregnant women and children under 5 years old.",
        status: "ongoing",
        budget: 42000000,
        utilized: 28000000,
        startDate: "2024-03-01",
        endDate: "2026-02-28",
        location: "All Health Centers",
        beneficiaries: 18500,
      },
    ],
  },
  {
    id: "4",
    name: "Department of Education",
    acronym: "DepEd",
    description: "Formulates, implements and coordinates policies, plans, programs and projects in education.",
    type: "national",
    headOfficer: "Dr. Teresa Martinez",
    contactEmail: "deped.provincial@gov.ph",
    contactPhone: "+63 919 234 5678",
    address: "Schools Division Office, Education Complex",
    website: "https://deped.gov.ph",
    totalProjects: 11,
    activeProjects: 8,
    completedProjects: 3,
    totalBudget: 325000000,
    utilizedBudget: 242000000,
    projects: [
      {
        id: "p16",
        name: "School Building Construction Program",
        description: "Construction of 25 new classrooms across 8 schools to address classroom shortage.",
        status: "ongoing",
        budget: 95000000,
        utilized: 68000000,
        startDate: "2024-02-01",
        endDate: "2025-10-31",
        location: "Various Elementary Schools",
        beneficiaries: 3200,
      },
      {
        id: "p17",
        name: "ICT Laboratory Establishment",
        description: "Setup of computer laboratories with internet connectivity in 12 secondary schools.",
        status: "ongoing",
        budget: 48000000,
        utilized: 38000000,
        startDate: "2024-04-01",
        endDate: "2025-08-31",
        location: "Secondary Schools",
        beneficiaries: 8500,
      },
      {
        id: "p18",
        name: "Teacher Training and Development",
        description: "Continuous professional development program for 500 teachers in modern teaching methodologies.",
        status: "ongoing",
        budget: 18000000,
        utilized: 12000000,
        startDate: "2024-06-01",
        endDate: "2025-12-31",
        location: "Training Centers",
        beneficiaries: 500,
      },
      {
        id: "p19",
        name: "School Feeding Program Expansion",
        description: "Expansion of school feeding program to cover all elementary schools in the province.",
        status: "completed",
        budget: 62000000,
        utilized: 61500000,
        startDate: "2023-06-01",
        endDate: "2024-11-30",
        location: "All Elementary Schools",
        beneficiaries: 15800,
      },
    ],
  },
  {
    id: "5",
    name: "Provincial Social Welfare and Development Office",
    acronym: "PSWDO",
    description:
      "Provides social protection and promotes rights and welfare of vulnerable and disadvantaged individuals, families and communities.",
    type: "provincial",
    headOfficer: "Ms. Linda Fernandez",
    contactEmail: "pswdo@province.gov.ph",
    contactPhone: "+63 920 345 6789",
    address: "PSWDO Building, Provincial Capitol",
    totalProjects: 8,
    activeProjects: 6,
    completedProjects: 2,
    totalBudget: 145000000,
    utilizedBudget: 98000000,
    projects: [
      {
        id: "p20",
        name: "Pantawid Pamilyang Pilipino Program",
        description:
          "Conditional cash transfer program for poor households to improve health, nutrition and education.",
        status: "ongoing",
        budget: 52000000,
        utilized: 38000000,
        startDate: "2024-01-01",
        endDate: "2025-12-31",
        location: "All Municipalities",
        beneficiaries: 12500,
      },
      {
        id: "p21",
        name: "Senior Citizens Assistance Program",
        description: "Social pension and healthcare assistance for indigent senior citizens.",
        status: "ongoing",
        budget: 28000000,
        utilized: 21000000,
        startDate: "2024-01-01",
        endDate: "2025-12-31",
        location: "Province-wide",
        beneficiaries: 8500,
      },
      {
        id: "p22",
        name: "Women and Children Protection Center",
        description: "Establishment of crisis intervention center for women and children victims of abuse.",
        status: "ongoing",
        budget: 35000000,
        utilized: 22000000,
        startDate: "2024-05-01",
        endDate: "2025-11-30",
        location: "Provincial Capital",
        beneficiaries: 2500,
      },
      {
        id: "p23",
        name: "Livelihood Skills Training Program",
        description: "Skills training and starter kits for indigent families to establish micro-enterprises.",
        status: "completed",
        budget: 22000000,
        utilized: 21800000,
        startDate: "2023-08-01",
        endDate: "2024-10-31",
        location: "Community Centers",
        beneficiaries: 1800,
      },
    ],
  },
  {
    id: "6",
    name: "Provincial Tourism Office",
    acronym: "PTO",
    description:
      "Develops and promotes tourism industry in the province through sustainable tourism programs and infrastructure development.",
    type: "provincial",
    headOfficer: "Mr. Carlos Domingo",
    contactEmail: "tourism@province.gov.ph",
    contactPhone: "+63 921 456 7890",
    address: "Tourism Building, Provincial Capitol Complex",
    totalProjects: 7,
    activeProjects: 5,
    completedProjects: 2,
    totalBudget: 125000000,
    utilizedBudget: 82000000,
    projects: [
      {
        id: "p24",
        name: "Tourism Infrastructure Development",
        description: "Development of tourism facilities including viewing decks, rest areas, and signage systems.",
        status: "ongoing",
        budget: 45000000,
        utilized: 32000000,
        startDate: "2024-03-01",
        endDate: "2025-09-30",
        location: "Tourist Destinations",
        beneficiaries: 150000,
      },
      {
        id: "p25",
        name: "Provincial Tourism Promotion Campaign",
        description: "Multi-platform marketing campaign to promote provincial tourist destinations.",
        status: "ongoing",
        budget: 18000000,
        utilized: 12000000,
        startDate: "2024-01-01",
        endDate: "2025-06-30",
        location: "Various Media Platforms",
        beneficiaries: 500000,
      },
      {
        id: "p26",
        name: "Community-Based Tourism Training",
        description: "Training program for local communities in tourism services and hospitality management.",
        status: "ongoing",
        budget: 12000000,
        utilized: 8000000,
        startDate: "2024-04-01",
        endDate: "2025-08-31",
        location: "Tourism Communities",
        beneficiaries: 450,
      },
      {
        id: "p27",
        name: "Heritage Site Restoration",
        description: "Restoration and conservation of historical sites and structures for cultural tourism.",
        status: "completed",
        budget: 38000000,
        utilized: 37500000,
        startDate: "2023-05-01",
        endDate: "2024-11-15",
        location: "Historical Sites",
        beneficiaries: 80000,
      },
    ],
  },
]

export function getAgencyById(id: string): ImplementingAgency | undefined {
  return implementingAgencies.find((agency) => agency.id === id)
}

export function getAgencyStats(agency: ImplementingAgency) {
  const utilizationRate = agency.totalBudget > 0 ? (agency.utilizedBudget / agency.totalBudget) * 100 : 0

  const plannedProjects = agency.projects.filter((p) => p.status === "planned").length
  const onHoldProjects = agency.projects.filter((p) => p.status === "on-hold").length

  return {
    utilizationRate: utilizationRate.toFixed(1),
    plannedProjects,
    onHoldProjects,
    avgProjectBudget: agency.totalProjects > 0 ? Math.round(agency.totalBudget / agency.totalProjects) : 0,
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-PH").format(num)
}
