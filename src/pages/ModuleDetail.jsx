import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import SubtopicAccordion from '../components/SubtopicAccordion'
import { getModuleDetail } from '../utils/progress'
import { ISLAND_DATA, ADVENTURE_NAMES } from '../data/islands'

export default function ModuleDetail() {
  const { moduleId } = useParams()
  const module = useMemo(() => getModuleDetail(moduleId), [moduleId])
  const island = ISLAND_DATA[moduleId]

  // Rename each adventure from the mapping; fall back to the raw title.
  const adventures = useMemo(
    () =>
      module
        ? module.subTopics.map((s) => ({
            ...s,
            title: ADVENTURE_NAMES[s.id]?.adventure ?? s.title,
          }))
        : [],
    [module],
  )

  if (!module) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Island not found
        </h1>
        <Link
          to="/modules"
          className="hover:underline"
          style={{ color: 'var(--color-cyan)' }}
        >
          ← Back to World Map
        </Link>
      </div>
    )
  }

  const doneCount = module.subTopics.filter((s) => s.isFullyCompleted).length

  return (
    <div className="space-y-6">
      <header>
        <Link
          to="/modules"
          className="text-sm font-medium hover:underline"
          style={{ color: 'var(--color-cyan)' }}
        >
          ← World Map
        </Link>
        <h1
          className="text-glow-cyan mt-1 flex items-center gap-2 text-3xl font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          <span>{island?.emoji}</span>
          {island?.name ?? module.title}
        </h1>
        {island && (
          <p className="text-sm italic" style={{ color: 'var(--color-cyan)' }}>
            “{island.description}”
          </p>
        )}
        <p className="mt-1" style={{ color: 'var(--text-muted)' }}>
          {doneCount}/{module.subTopics.length} adventures complete
        </p>
      </header>

      <SubtopicAccordion subTopics={adventures} />
    </div>
  )
}
