import { getAllObjectives, createObjective } from './kv'

const COMPANY_OBJECTIVES = [
  {
    name: 'Total Capital Deployed',
    description: 'Efficiently deploy capital to fund operations and growth initiatives',
    targetLabel: 'Q4: $15M',
    balanceScoreCard: 'Financial' as const,
    order: 1,
    active: true,
  },
  {
    name: 'Total Claims Processed',
    description: 'Process claims at scale through TPAs to ensure operational efficiency',
    targetLabel: 'Q4: 3+ TPA Contracts',
    balanceScoreCard: 'Financial' as const,
    order: 2,
    active: true,
  },
  {
    name: 'Number of Signed SP Contracts',
    description: 'Expand service provider network to increase revenue and reach',
    targetLabel: 'Q4: 300+',
    balanceScoreCard: 'Customer' as const,
    order: 3,
    active: true,
  },
  {
    name: 'Number of Integrations',
    description: 'Increase platform adoption via system integrations',
    targetLabel: 'Q4: 100+',
    balanceScoreCard: 'Customer' as const,
    order: 4,
    active: true,
  },
  {
    name: 'Time to Complete an Integration',
    description: 'Deliver integrations efficiently within set timelines',
    targetLabel: '3 weeks',
    balanceScoreCard: 'Internal Business Processes' as const,
    order: 5,
    active: true,
  },
  {
    name: 'Time to a Signed Contract',
    description: 'Accelerate deal closure for faster revenue realization',
    targetLabel: '3 weeks',
    balanceScoreCard: 'Internal Business Processes' as const,
    order: 6,
    active: true,
  },
  {
    name: 'Number of SPs Using Our Tech',
    description: 'Ensure active adoption of technology by service providers',
    targetLabel: '3 SPs',
    balanceScoreCard: 'Internal Business Processes' as const,
    order: 7,
    active: true,
  },
  {
    name: 'Factoring Default Rate',
    description: 'Maintain low default risk in factoring operations',
    targetLabel: '< 2%',
    balanceScoreCard: 'Financial' as const,
    order: 8,
    active: true,
  },
  {
    name: 'Hospital NPS',
    description: 'Achieve high satisfaction and loyalty among partner hospitals',
    targetLabel: '50+',
    balanceScoreCard: 'Customer' as const,
    order: 9,
    active: true,
  },
  {
    name: 'Engaged Employee NPS',
    description: 'Maintain strong employee engagement to support performance',
    targetLabel: '75+',
    balanceScoreCard: 'Learning and Growth' as const,
    order: 10,
    active: true,
  },
]

export async function seedCompanyObjectives(): Promise<{ created: number; skipped: number }> {
  const existing = await getAllObjectives()
  if (existing.length > 0) {
    return { created: 0, skipped: COMPANY_OBJECTIVES.length }
  }

  let created = 0
  for (const obj of COMPANY_OBJECTIVES) {
    await createObjective(obj)
    created++
  }
  return { created, skipped: 0 }
}
