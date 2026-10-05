// Look of each subject: icon, colour and a one-line description. Subjects come from the Drive
// folder names, so anything not listed here still works with a neutral look.

import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  Coffee,
  FlaskConical,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

const KNOWN = [
  {
    match: /java/,
    icon: Coffee,
    tint: '#F59E0B',
    short: 'Java',
    about: 'Object-oriented core, exceptions, multithreading, collections and JDBC.',
  },
  {
    match: /test/,
    icon: ShieldCheck,
    tint: '#10B981',
    short: 'Testing',
    about: 'Test design, black-box and white-box techniques, automation and quality.',
  },
  {
    match: /research/,
    icon: FlaskConical,
    tint: '#A855F7',
    short: 'Research',
    about: 'Research design, sampling, hypothesis testing and academic writing.',
  },
  {
    match: /machine|learning|\bml\b/,
    icon: BrainCircuit,
    tint: '#06B6D4',
    short: 'ML',
    about: 'Supervised and unsupervised learning, neural networks and model evaluation.',
  },
  {
    match: /optimi/,
    icon: TrendingUp,
    tint: '#F43F5E',
    short: 'Optimization',
    about: 'Linear programming, simplex, transportation and network models.',
  },
  {
    match: /power|\bbi\b|data-vis/,
    icon: BarChart3,
    tint: '#EAB308',
    short: 'Power BI',
    about: 'Data modelling, Power Query, DAX and dashboards.',
  },
]

const FALLBACK = { icon: BookOpen, tint: '#6366F1', about: 'Notes, PYQs and references.' }

export function subjectLook(slug, name) {
  const key = `${slug} ${name || ''}`.toLowerCase().replace(/[_\s]+/g, '-')
  const known = KNOWN.find((k) => k.match.test(key))
  return { ...FALLBACK, short: name, ...(known || {}) }
}

// Style for an element that carries a subject colour (used with the .tint classes in index.css).
export function tintStyle(look) {
  return { '--tint': look.tint }
}
