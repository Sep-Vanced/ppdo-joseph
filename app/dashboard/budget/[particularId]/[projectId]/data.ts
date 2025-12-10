// app/dashboard/budget/[particularId]/[projectId]/data.ts

import {
  FinancialBreakdownItem,
  Project,
  Remark,
} from "../../types";
import { getProjectsByParticular } from "../data";

// Mock remarks data - in production, this would come from an API
export function getRemarksByProject(projectId: string): Remark[] {
  return [
    {
      id: "rem-1",
      projectId: projectId,
      content: "Initial budget allocation approved by the finance committee. All line items have been reviewed and confirmed.",
      createdBy: "Maria Santos",
      createdAt: new Date("2024-01-15T09:30:00"),
      updatedBy: "Maria Santos",
      updatedAt: new Date("2024-01-15T09:30:00"),
    },
    {
      id: "rem-2",
      projectId: projectId,
      content: "Obligation for fuel and lubricants has been processed. Waiting for delivery confirmation from supplier.",
      createdBy: "Juan Dela Cruz",
      createdAt: new Date("2024-02-10T14:20:00"),
      updatedBy: "Juan Dela Cruz",
      updatedAt: new Date("2024-02-10T14:20:00"),
    },
    {
      id: "rem-3",
      projectId: projectId,
      content: "Training expenses for Q1 have been fully obligated. Budget utilization is on track with projections.",
      createdBy: "Ana Reyes",
      createdAt: new Date("2024-03-05T11:15:00"),
      updatedBy: "Maria Santos",
      updatedAt: new Date("2024-03-06T08:45:00"),
    },
    {
      id: "rem-4",
      projectId: projectId,
      content: "Request for budget reallocation submitted for anti-drug programs. Pending approval from the provincial board.",
      createdBy: "Roberto Garcia",
      createdAt: new Date("2024-03-20T16:00:00"),
      updatedBy: "Roberto Garcia",
      updatedAt: new Date("2024-03-20T16:00:00"),
    },
    {
      id: "rem-5",
      projectId: projectId,
      content: "Mid-year budget review completed. Overall utilization rate at 68%. Recommend accelerating disbursement for remaining quarters.",
      createdBy: "Maria Santos",
      createdAt: new Date("2024-06-30T10:00:00"),
      updatedBy: "Ana Reyes",
      updatedAt: new Date("2024-07-02T09:30:00"),
    },
  ];
}

// Add a new remark - in production, this would POST to an API
export function addRemark(
  projectId: string,
  content: string,
  createdBy: string
): Remark {
  const newRemark: Remark = {
    id: `rem-${Date.now()}`,
    projectId: projectId,
    content: content,
    createdBy: createdBy,
    createdAt: new Date(),
    updatedBy: createdBy,
    updatedAt: new Date(),
  };
  return newRemark;
}

// Update an existing remark - in production, this would PUT to an API
export function updateRemark(
  remarkId: string,
  content: string,
  updatedBy: string
): Remark | null {
  // In production, fetch and update the remark via API
  // This is just a mock response
  return {
    id: remarkId,
    projectId: "project-1",
    content: content,
    createdBy: "Original Creator",
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedBy: updatedBy,
    updatedAt: new Date(),
  };
}

// Delete a remark - in production, this would DELETE via API
export function deleteRemark(remarkId: string): boolean {
  // In production, delete via API
  return true;
}

// Mock financial breakdown data - in production, this would come from an API
export function getFinancialBreakdownByProject(
  projectId: string
): FinancialBreakdownItem[] {
  // Sample hierarchical financial breakdown
  // In production, fetch from API based on projectId
  return [
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
          description:
            "Provision of equipage, supplies and materials and/or logistical support for law enforcement activities",
          appropriation: 5200000,
          obligation: 0,
          balance: 5200000,
          level: 1,
        },
        {
          id: "a2",
          code: "A.2",
          description:
            "Provision of fuel, oil and lubricants to law enforcement agencies",
          appropriation: 3000000,
          obligation: 950000,
          balance: 2050000,
          level: 1,
        },
        {
          id: "a3",
          code: "A.3",
          description:
            "Provision for coordination meetings and workshops expenses with partner agencies",
          appropriation: 2000000,
          obligation: 0,
          balance: 2000000,
          level: 1,
        },
      ],
    },
    {
      id: "b",
      code: "B",
      description:
        "Aid and/or capability development/trainings for personnel of law enforcement agencies",
      appropriation: 13835000,
      obligation: 5551645.23,
      balance: 8283354.77,
      level: 0,
      children: [
        {
          id: "b1",
          code: "B.1",
          description:
            "Providing subsidy and equipage for personnel of law enforcement agencies in their career enhancement activities",
          appropriation: 4035000,
          obligation: 0,
          balance: 4035000,
          level: 1,
        },
        {
          id: "b2",
          code: "B.2",
          description:
            "Grants, subsidies and contribution to Law Enforcement Agencies",
          appropriation: 3450000,
          obligation: 1885040,
          balance: 1564960,
          level: 1,
        },
        {
          id: "b3",
          code: "B.3",
          description: "Lupong Tagapamayapa Incentives Awards Activities",
          appropriation: 700000,
          obligation: 110000,
          balance: 590000,
          level: 1,
        },
        {
          id: "b4",
          code: "B.4",
          description:
            "Support to Peace and Order Councils/Secretariat and anti-Drug Councils/Secretariat",
          appropriation: 1500000,
          obligation: 1006645.23,
          balance: 493354.77,
          level: 1,
        },
        {
          id: "b5",
          code: "B.5",
          description:
            "Training expenses/ enhancement of citizen capacity to assist in peace and order/ peace and development efforts",
          appropriation: 4300000,
          obligation: 2550000,
          balance: 1750000,
          level: 1,
        },
      ],
    },
    {
      id: "c",
      code: "C",
      description:
        "Program for anti-illegal drug, illegal gambling, counter-insurgency and/or counter-terrorism, illegal logging, illegal mining, illegal fishing, smuggling and Human - trafficking",
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
          children: [
            {
              id: "c1-treatment",
              code: "C.1.1",
              description: "Treatment and Rehabilitation Program",
              appropriation: 751187,
              obligation: 625650.92,
              balance: 125536.08,
              level: 2,
              children: [
                {
                  id: "c1-treatment-office",
                  description: "Office Supplies Expenses",
                  appropriation: 140290,
                  obligation: 15753.92,
                  balance: 124536.08,
                  level: 3,
                },
                {
                  id: "c1-treatment-semi",
                  description:
                    "Semi-Expendable Machinery & Equipment Expenses",
                  appropriation: 5200,
                  obligation: 5200,
                  balance: 0,
                  level: 3,
                },
                {
                  id: "c1-treatment-donations",
                  description: "Donations",
                  appropriation: 602697,
                  obligation: 602697,
                  balance: 0,
                  level: 3,
                },
                {
                  id: "c1-treatment-other",
                  description: "Other Maintenance and Operating Expenses",
                  appropriation: 3000,
                  obligation: 3000,
                  balance: 0,
                  level: 3,
                },
              ],
            },
            {
              id: "c1-prevention",
              code: "C.1.2",
              description:
                "Drug Prevention Program, Mental Health Awareness and Harm Prevention Advocacy",
              appropriation: 1337727,
              obligation: 459137.42,
              balance: 878589.58,
              level: 2,
              children: [
                {
                  id: "c1-prevention-training",
                  description: "Training Expenses",
                  appropriation: 403107,
                  obligation: 6883.1,
                  balance: 396223.9,
                  level: 3,
                },
                {
                  id: "c1-prevention-office",
                  description: "Office Supplies Expenses",
                  appropriation: 57195,
                  obligation: 3839.32,
                  balance: 53355.68,
                  level: 3,
                },
                {
                  id: "c1-prevention-advertising",
                  description: "Advertising Expenses",
                  appropriation: 495000,
                  obligation: 165000,
                  balance: 330000,
                  level: 3,
                },
                {
                  id: "c1-prevention-supplies",
                  description: "Other Supplies and Materials Expenses",
                  appropriation: 69918,
                  obligation: 69918,
                  balance: 0,
                  level: 3,
                },
                {
                  id: "c1-prevention-furniture",
                  description:
                    "Semi-Expendable Furniture, Fixtures and Books Expenses",
                  appropriation: 105400,
                  obligation: 105400,
                  balance: 0,
                  level: 3,
                },
                {
                  id: "c1-prevention-machinery",
                  description:
                    "Semi-Expendable Machinery & Equipment Expenses",
                  appropriation: 106107,
                  obligation: 106107,
                  balance: 0,
                  level: 3,
                },
                {
                  id: "c1-prevention-ict",
                  description:
                    "Information and Communication Technology Equipment",
                  appropriation: 112000,
                  obligation: 112000,
                  balance: 0,
                  level: 3,
                },
              ],
            },
            {
              id: "c1-lab",
              code: "C.1.3",
              description: "Drug Testing Laboratory",
              appropriation: 641342,
              obligation: 567211.5,
              balance: 74130.5,
              level: 2,
              children: [
                {
                  id: "c1-lab-office",
                  description: "Office Supplies Expenses",
                  appropriation: 85050,
                  obligation: 9051.5,
                  balance: 75998.5,
                  level: 3,
                },
                {
                  id: "c1-lab-printing",
                  description: "Printing and Publication Expenses",
                  appropriation: 89000,
                  obligation: 89000,
                  balance: 0,
                  level: 3,
                },
                {
                  id: "c1-lab-medical",
                  description:
                    "Medical, Dental & Laboratory Supplies Expenses",
                  appropriation: 318000,
                  obligation: 318000,
                  balance: 0,
                  level: 3,
                },
                {
                  id: "c1-lab-supplies",
                  description: "Other Supplies and Materials Expenses",
                  appropriation: 87342,
                  obligation: 87342,
                  balance: 0,
                  level: 3,
                },
                {
                  id: "c1-lab-machinery",
                  description:
                    "Semi-Expendable Machinery & Equipment Expenses",
                  appropriation: 32200,
                  obligation: 32200,
                  balance: 0,
                  level: 3,
                },
                {
                  id: "c1-lab-postage",
                  description: "Postage and Courier Services",
                  appropriation: 10000,
                  obligation: 0,
                  balance: 10000,
                  level: 3,
                },
                {
                  id: "c1-lab-taxes",
                  description: "Taxes, Duties and Licenses",
                  appropriation: 10000,
                  obligation: 0,
                  balance: 10000,
                  level: 3,
                },
                {
                  id: "c1-lab-other",
                  description: "Other Maintenance and Operating Expenses",
                  appropriation: 19750,
                  obligation: 19750,
                  balance: 0,
                  level: 3,
                },
              ],
            },
            {
              id: "c1-support",
              code: "C.1.4",
              description:
                "Anti Illegal Drugs & Surrenderers Support Services",
              appropriation: 3136872,
              obligation: 2452222.61,
              balance: 684649.39,
              level: 2,
              children: [
                {
                  id: "c1-support-other",
                  description: "Other Maintenance and Operating Expenses",
                  appropriation: 3136872,
                  obligation: 2452222.61,
                  balance: 684649.39,
                  level: 3,
                },
              ],
            },
          ],
        },
        {
          id: "c2",
          code: "C.2",
          description:
            "Support to LGUs for various peace and order programs",
          appropriation: 38848744,
          obligation: 29428400,
          balance: 9420344,
          level: 1,
        },
        {
          id: "c3",
          code: "C.3",
          description: "Indigency / Pro poor/ Rehabilitation Program",
          appropriation: 60863128,
          obligation: 60082199.04,
          balance: 780928.96,
          level: 1,
        },
      ],
    },
  ];
}

// Flatten hierarchical structure for table display
export function flattenFinancialBreakdown(
  items: FinancialBreakdownItem[]
): FinancialBreakdownItem[] {
  const result: FinancialBreakdownItem[] = [];

  function traverse(item: FinancialBreakdownItem) {
    result.push(item);
    if (item.children) {
      item.children.forEach(traverse);
    }
  }

  items.forEach(traverse);
  return result;
}

// Get project by ID - in production, fetch from API
export function getProjectById(
  projectId: string,
  particularId: string
): Project | null {
  const projects = getProjectsByParticular(particularId as any);
  return projects.find((p) => p.id === projectId) || null;
}