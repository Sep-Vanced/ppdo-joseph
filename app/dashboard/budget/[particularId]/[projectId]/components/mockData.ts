// components/mockData.ts

import { type FinancialBreakdownItem, type InspectionItem, type StatItem, type TransactionCardProps, type RemarkItem } from "./types"

// --- Financial Mock Data ---
export const mockFinancialBreakdown: FinancialBreakdownItem[] = [
  // ... (Original mockFinancialBreakdown array) ...
  {
    id: "a",
    code: "A",
    description: "Crime Prevention and law enforcement activities",
    appropriation: 10200000,
    obligation: 950000,
    balance: 9250000,
    level: 0,
    children: [
      {
        id: "a1",
        code: "A.1",
        description: "Provision of equipage, supplies and materials...",
        appropriation: 5200000,
        obligation: 0,
        balance: 5200000,
        level: 1,
      },
      {
        id: "a2",
        code: "A.2",
        description: "Provision of fuel, oil and lubricants...",
        appropriation: 3000000,
        obligation: 950000,
        balance: 2050000,
        level: 1,
      },
    ],
  },
  {
    id: "b",
    code: "B",
    description: "Aid and/or capability development/trainings...",
    appropriation: 13835000,
    obligation: 5551645.23,
    balance: 8283354.77,
    level: 0,
    children: [
      {
        id: "b1",
        code: "B.1",
        description: "Providing subsidy and equipage for personnel...",
        appropriation: 4035000,
        obligation: 0,
        balance: 4035000,
        level: 1,
      },
      {
        id: "b2",
        code: "B.2",
        description: "Grants, subsidies and contribution to LEA",
        appropriation: 3450000,
        obligation: 1885040,
        balance: 1564960,
        level: 1,
      },
    ],
  },
  {
    id: "c",
    code: "C",
    description: "Program for anti-illegal drug, illegal gambling...",
    appropriation: 105820000,
    obligation: 85110003.49,
    balance: 20709996.51,
    level: 0,
    children: [
      {
        id: "c1",
        code: "C.1",
        description: "Programs against illegal drugs and surrenderers",
        appropriation: 6044657,
        obligation: 1566998.94,
        balance: 4477658.06,
        level: 1,
      },
      {
        id: "c2",
        code: "C.2",
        description: "Support to LGUs for various peace and order programs",
        appropriation: 38848744,
        obligation: 29428400,
        balance: 9420344,
        level: 1,
      },
    ],
  },
]

export const stats: StatItem[] = [
  { label: "Total Appropriation", amount: 130000000.00 },
  { label: "Total Obligation", amount: 91611003.49 },
  { label: "Remaining Balance", amount: 38388996.51 },
]

export const transactions: TransactionCardProps[] = [
  { amount: 200000.0, name: "Maria Clara Hospital", email: "mch@gov.ph", type: "Health Services" },
  { amount: 500000.0, name: "City Hall Procurement", email: "procurement@city.gov.ph", type: "IT Equipment" },
  { amount: 60082199.04, name: "Project C.3", email: "propoor@gov.ph", type: "Indigency Fund" },
  { amount: 1885040.0, name: "Project B.2", email: "grants@gov.ph", type: "Grants & Subsidies" },
]

// --- Inspection Mock Data ---
export const mockInspections: InspectionItem[] = [
  // ... (Original mockInspections array) ...
  {
    id: "1",
    programNumber: "12",
    title: "Community Women Empowerment Workshop - Phase 1",
    category: "Skill Development",
    date: "2024-12-03",
    remarks: "Community engagement activities focused on women's empowerment and development.\n\nKey achievements:\n- 45 participants trained in entrepreneurship\n- 3 new community businesses established\n- 100% satisfaction rate from participants",
    status: "Completed",
    images: ["https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800", "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800", "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800", "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800"],
    views: "1.2K views",
  },
  {
    id: "2",
    programNumber: "08",
    title: "Agricultural Training Program for Rural Communities",
    category: "Economic Development",
    date: "2024-11-28",
    remarks: "Comprehensive agricultural training program focusing on modern farming techniques and sustainable agriculture practices. The program covered crop rotation, organic farming methods, and efficient water management systems.",
    status: "Completed",
    images: ["https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800", "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800"],
    views: "856 views",
  },
  {
    id: "3",
    programNumber: "15",
    title: "Youth Leadership Forum 2025",
    category: "Leadership",
    date: "2024-11-21",
    remarks: "Annual youth leadership forum bringing together young leaders from different sectors. The forum included workshops on public speaking, project management, and community organizing.",
    status: "In Progress",
    images: ["https://images.unsplash.com/photo-1552664730-d307ca884978?w=800"],
    views: "2.4K views",
  },
  {
    id: "4",
    programNumber: "22",
    title: "Health and Wellness Program for Seniors",
    category: "Healthcare",
    date: "2024-11-15",
    remarks: "Monthly health screening and wellness program for senior citizens. Includes free medical checkups, health education sessions, and distribution of maintenance medications.",
    status: "Completed",
    images: [],
    views: "1.5K views",
  },
  {
    id: "5",
    programNumber: "19",
    title: "Environmental Conservation Awareness Campaign",
    category: "Environment",
    date: "2024-11-05",
    remarks: "Large-scale environmental awareness campaign focusing on waste management, tree planting, and coastal cleanup activities. Over 200 volunteers participated in the initiative.",
    status: "Completed",
    images: ["https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800", "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800", "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800"],
    views: "945 views",
  },
  {
    id: "6",
    programNumber: "31",
    title: "Digital Literacy Program for Seniors",
    category: "Technology",
    date: "2024-10-28",
    remarks: "Training program designed to teach senior citizens basic computer skills, internet navigation, and social media usage. The program aims to bridge the digital divide and keep seniors connected with their families.",
    status: "Pending",
    images: ["https://images.unsplash.com/photo-1552664730-d307ca884978?w=800", "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800"],
    views: "1.8K views",
  },
]

// --- Remark Mock Data (Original RemarkItem structure) ---
export const mockRemarks: RemarkItem[] = [
  // ... (Original mockRemarks array) ...
  {
    id: "1",
    author: "Maria Santos",
    authorRole: "Budget Officer",
    date: "2024-12-04",
    content: "The utilization rate for Section A (Crime Prevention) remains critically low at 9.31%. We need to expedite the procurement process for law enforcement equipment to avoid budget realignment at year-end. Suggest coordinating with the procurement office for immediate action.",
    category: "Budget Utilization",
    priority: "High",
  },
  // ... (Remaining remarks) ...
]

// Assuming ReportContent uses this data
export const mockReportContent = {
  title: "Q4 2024 Budget Utilization Report",
  summary: "The Q4 2024 budget report highlights a strong overall performance with an 80% utilization rate in key development programs. [cite_start]The highest obligation is noted in the 'Program for anti-illegal drug, illegal gambling, counter-insurgency' category (C)[cite: 524]. [cite_start]Overall, the department maintains a healthy $38.2 million balance across all major accounts[cite: 525]. [cite_start]A key finding is the low obligation rate in the 'Crime Prevention and law enforcement' category (9.3%) [cite: 526][cite_start], indicating potential delays in procurement or implementation which should be inspected[cite: 526].",
  recommendations: [
    "Immediately review procurement schedules for Section A (Crime Prevention) to address the low obligation rate[cite: 528].",
    "Allocate a contingency fund to manage the near-complete depletion of the Indigency Fund (C.3).",
    "Expand Phase 2 of the Community Women Empowerment Workshop due to high demand and positive outcomes.",
  ],
  metadata: {
    status: "Approved & Filed",
    date: "2024-12-31",
    preparedBy: "J. Dela Cruz",
  }
}