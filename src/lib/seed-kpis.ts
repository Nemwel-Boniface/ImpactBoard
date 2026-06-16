import { getAllKPIs, createKPI, getAllObjectives } from './kv'

const Q2_KPIS = [
  {
    title: 'Client Integration Ownership',
    description:
      'Drive successful onboarding of assigned clients from technical kickoff through database provisioning, documentation handoff, and integration readiness.',
    weight: 35,
    balanceScoreCard: 'Financial' as const,
    keyMetrics:
      'Successfully own at least 10 assigned clients end-to-end (kickoff → provisioning → documentation sharing), with at least 5 clients reaching test-ready or integration-ready status, and all assigned clients receiving initial setup within 3 working days of kickoff.',
    quarter: 'Q2 2026',
    matchObjectiveName: 'Number of Integrations',
    active: true,
  },
  {
    title: 'Backend Delivery for HIMS Service Portal 2.0',
    description:
      'Contribute to the readiness and stability of the HIMS Service Portal 2.0 demo and related backend flows.',
    weight: 25,
    balanceScoreCard: 'Customer' as const,
    keyMetrics:
      'Complete all assigned backend tasks for the HIMS Service Portal 2.0 demo, with features deployed and tested, and no more than 1 major rework iteration required after stakeholder review.',
    quarter: 'Q2 2026',
    matchObjectiveName: 'Number of SPs Using Our Tech',
    active: true,
  },
  {
    title: 'End-to-End Clinical Workflow Support',
    description:
      'Support the core clinical journeys that the platform depends on by working on end-to-end backend flows.',
    weight: 20,
    balanceScoreCard: 'Internal Business Processes' as const,
    keyMetrics:
      'Implement and validate at least 2 complete clinical workflows (e.g., optical + outpatient), ensuring all key stages (visit → diagnosis → prescription → dispensation) function correctly in the system and are demo-ready.',
    quarter: 'Q2 2026',
    matchObjectiveName: 'Time to Complete an Integration',
    active: true,
  },
  {
    title: 'Documentation, Communication & Stakeholder Alignment',
    description:
      'Improve clarity and reduce friction by keeping stakeholders aligned through structured communication and documentation.',
    weight: 10,
    balanceScoreCard: 'Internal Business Processes' as const,
    keyMetrics:
      'Provide structured documentation and updates for all assigned clients, including kickoff notes, integration requirements, and follow-ups, with at least one documented update per client per week and no repeated clarification requests on previously shared information.',
    quarter: 'Q2 2026',
    matchObjectiveName: 'Time to a Signed Contract',
    active: true,
  },
  {
    title: 'Ownership & Execution Discipline',
    description:
      'Increase independence in the backend stack and become more effective in the company\'s Python / FastAPI environment.',
    weight: 10,
    balanceScoreCard: 'Learning and Growth' as const,
    keyMetrics:
      'Independently complete at least 3 backend tasks (features, bug fixes, or enhancements) in the Python/FastAPI codebase, including submitting PRs and resolving feedback with minimal supervision.',
    quarter: 'Q2 2026',
    matchObjectiveName: 'Engaged Employee NPS',
    active: true,
  },
]

export async function seedKPIs(): Promise<{ created: number; skipped: number }> {
  const existing = await getAllKPIs()
  const existingTitles = new Set(existing.map(k => k.title.toLowerCase().trim()))

  const objectives = await getAllObjectives()
  const objectiveByName = Object.fromEntries(objectives.map(o => [o.name, o]))

  let created = 0
  let skipped = 0

  for (const kpi of Q2_KPIS) {
    const { matchObjectiveName, ...rest } = kpi
    if (existingTitles.has(rest.title.toLowerCase().trim())) {
      skipped++
      continue
    }
    const objective = objectiveByName[matchObjectiveName]
    if (!objective) {
      console.warn(`Objective not found: ${matchObjectiveName}`)
      skipped++
      continue
    }
    await createKPI({ ...rest, objectiveId: objective.id })
    created++
  }
  return { created, skipped }
}
