// What the portal offers: semesters, their core subjects and elective groups, and how each subject
// is named and drawn. Semester ids are the Drive folder names (MCA-Sem-II/subjects/…); subject slugs
// are the subject folder names. A subject folder that isn't listed here still shows up (as core,
// with a neutral look), so adding content never needs a code change — only grouping does.

import {
  BarChart3,
  Brain,
  BrainCircuit,
  Building2,
  Bug,
  Cloud,
  CloudCog,
  CloudUpload,
  Code2,
  Coffee,
  FlaskConical,
  Lightbulb,
  LockKeyhole,
  Megaphone,
  Microscope,
  Network,
  PieChart,
  ShieldAlert,
  ShieldCheck,
  ShieldHalf,
  ShoppingCart,
  Smartphone,
  TestTubes,
  TrendingUp,
  Users,
  Webhook,
} from 'lucide-react'

export const SEMESTERS = [
  {
    id: 'MCA-Sem-II',
    number: 2,
    label: 'Semester II',
    short: 'Sem II',
    core: ['java-programming', 'software-testing-and-quality-assurance', 'optimization-techniques', 'research-methodology'],
    groups: [
      {
        id: 'electives',
        label: 'Electives',
        hint: 'Tick every elective you take.',
        pick: 'many',
        options: [
          'machine-learning-techniques',
          'power-bi',
          'cloud-computing-management-and-security',
          'essentials-of-cloud-computing-and-security',
          'cyber-security',
          'information-security',
        ],
      },
    ],
  },
  {
    id: 'MCA-Sem-III',
    number: 3,
    label: 'Semester III',
    short: 'Sem III',
    core: ['design-and-analysis-of-algorithms', 'organizational-behaviour', 'practicals', 'research-project'],
    groups: [
      {
        id: 'elective-iv',
        label: 'Elective IV',
        pick: 'one',
        options: ['cloud-apis-and-services', 'end-point-security', 'mobile-application-development', 'tableau'],
      },
      {
        id: 'elective-v',
        label: 'Elective V',
        pick: 'one',
        options: ['cloud-migration-and-management', 'deep-learning', 'ethical-hacking', 'mern-stack-development'],
      },
      {
        id: 'elective-vi',
        label: 'Elective VI',
        pick: 'one',
        options: ['e-commerce', 'enterprise-resource-planning', 'innovation-and-entrepreneurship-development', 'social-media-marketing'],
      },
    ],
  },
]

const SUBJECTS = {
  // Semester II
  'java-programming': { name: 'Java Programming', short: 'Java', code: 'IT21', icon: Coffee, tint: '#F59E0B', about: 'Core Java, servlets, JSP and Spring MVC.' },
  'software-testing-and-quality-assurance': { name: 'Software Testing & QA', short: 'STQA', code: 'IT22', icon: ShieldCheck, tint: '#10B981', about: 'Quality assurance, static and dynamic testing, test management and tools.' },
  'optimization-techniques': { name: 'Optimization Techniques', short: 'OT', code: 'MT21', icon: TrendingUp, tint: '#F43F5E', about: 'Linear programming, simplex, PERT/CPM, game and decision theory.' },
  'research-methodology': { name: 'Research Methodology', short: 'Research', code: 'RM21', icon: FlaskConical, tint: '#A855F7', about: 'Research design, hypothesis testing, data analysis and ethics.' },
  'machine-learning-techniques': { name: 'Machine Learning Techniques', short: 'ML', code: 'EC21-3', icon: BrainCircuit, tint: '#06B6D4', about: 'Regression, classification, clustering and model evaluation.' },
  'power-bi': { name: 'Power BI', short: 'Power BI', code: 'EC22-3', icon: BarChart3, tint: '#EAB308', about: 'Data modelling, Power Query, DAX and dashboards.' },
  'cloud-computing-management-and-security': { name: 'Cloud Computing Management & Security', short: 'CCMS', code: 'EC21-1', icon: Cloud, tint: '#0EA5E9', about: 'Cloud migration, AWS security, backup and disaster recovery.' },
  'essentials-of-cloud-computing-and-security': { name: 'Essentials of Cloud Computing & Security', short: 'ECCS', code: 'ECS564MJ', icon: CloudCog, tint: '#3B82F6', about: 'Cloud models, security policies and the CIA triad.' },
  'cyber-security': { name: 'Cyber Security', short: 'Cyber', icon: ShieldAlert, tint: '#EF4444', about: 'Networking basics, data privacy, threats and cyber crime.' },
  'information-security': { name: 'Information Security', short: 'InfoSec', icon: LockKeyhole, tint: '#64748B', about: 'Security fundamentals and building secure information systems.' },
  // Semester III
  'design-and-analysis-of-algorithms': { name: 'Design & Analysis of Algorithms', short: 'DAA', code: 'DAA602MJ', icon: Network, tint: '#8B5CF6', about: 'Complexity, divide and conquer, greedy, dynamic programming.' },
  'organizational-behaviour': { name: 'Organizational Behaviour', short: 'OB', code: 'OBE601MJ', icon: Users, tint: '#EC4899', about: 'Individual and group behaviour, motivation, leadership and culture.' },
  practicals: { name: 'Practicals (Electives IV & V)', short: 'Practicals', code: 'PBE603MJP', icon: TestTubes, tint: '#14B8A6', about: 'Practical work for your Elective IV and V subjects.' },
  'research-project': { name: 'Research Project', short: 'Research', code: 'RP641RP', icon: Microscope, tint: '#A855F7', about: 'Literature review, methodology and the final presentation.' },
  'cloud-apis-and-services': { name: "Cloud API's & Services", short: 'Cloud APIs', code: 'CAS610MJ', icon: Webhook, tint: '#0EA5E9', about: 'Cloud service models and working with cloud APIs.' },
  'end-point-security': { name: 'End-Point Security', short: 'EPS', code: 'EPS613MJ', icon: ShieldHalf, tint: '#EF4444', about: 'Protecting devices: threats, controls and monitoring.' },
  'mobile-application-development': { name: 'Mobile Application Development', short: 'MAD', code: 'MAD611MJ', icon: Smartphone, tint: '#22C55E', about: 'Building mobile apps: UI, data and publishing.' },
  tableau: { name: 'Tableau', short: 'Tableau', code: 'TAB612MJ', icon: PieChart, tint: '#F97316', about: 'Connecting data, charts, calculated fields and dashboards.' },
  'cloud-migration-and-management': { name: 'Cloud Migration & Management', short: 'Cloud Migration', code: 'CMM614MJ', icon: CloudUpload, tint: '#3B82F6', about: 'Planning, running and managing a move to the cloud.' },
  'deep-learning': { name: 'Deep Learning', short: 'DL', code: 'DEL616MJ', icon: Brain, tint: '#06B6D4', about: 'Neural networks, CNNs, RNNs and training deep models.' },
  'ethical-hacking': { name: 'Ethical Hacking', short: 'Ethical Hacking', code: 'EH617MJ', icon: Bug, tint: '#84CC16', about: 'Reconnaissance, scanning, exploitation and reporting, legally.' },
  'mern-stack-development': { name: 'MERN Stack Development', short: 'MERN', code: 'MSD615MJ', icon: Code2, tint: '#10B981', about: 'MongoDB, Express, React and Node.js.' },
  'e-commerce': { name: 'E-Commerce', short: 'E-Commerce', code: 'EC619MJ', icon: ShoppingCart, tint: '#F59E0B', about: 'Online business models, payments and security.' },
  'enterprise-resource-planning': { name: 'Enterprise Resource Planning', short: 'ERP', code: 'ERP618MJ', icon: Building2, tint: '#6366F1', about: 'ERP modules, implementation and business processes.' },
  'innovation-and-entrepreneurship-development': { name: 'Innovation & Entrepreneurship Development', short: 'IED', code: 'IED621MJ', icon: Lightbulb, tint: '#EAB308', about: 'From idea to venture: innovation, planning and funding.' },
  'social-media-marketing': { name: 'Social Media Marketing', short: 'SMM', code: 'SMM620MJ', icon: Megaphone, tint: '#EC4899', about: 'Platforms, content strategy, campaigns and analytics.' },
}

export function subjectInfo(slug) {
  return SUBJECTS[slug] || null
}

export function semesterById(id) {
  return SEMESTERS.find((s) => s.id === id) || null
}

// Elective choices are stored as { [groupId]: slug } for pick-one groups and
// { [groupId]: [slug, …] } for pick-many groups.
export function chosenElectives(semester, electives = {}) {
  const chosen = new Set()
  for (const group of semester.groups) {
    const value = electives[group.id]
    for (const slug of Array.isArray(value) ? value : value ? [value] : []) {
      if (group.options.includes(slug)) chosen.add(slug)
    }
  }
  return chosen
}

// Which subjects a student sees: the semester's core, the electives they picked, and any subject
// folder the catalog doesn't know about yet.
export function isSubjectVisible(semester, electives, slug) {
  if (!semester) return true
  const grouped = semester.groups.some((g) => g.options.includes(slug))
  return !grouped || chosenElectives(semester, electives).has(slug)
}

// Every pick-one group needs an answer; pick-many groups may be left empty.
export function isSetupComplete(semester, electives = {}) {
  if (!semester) return false
  return semester.groups.every((g) => g.pick !== 'one' || g.options.includes(electives[g.id]))
}

// Where a subject sits in its semester: 'Core', 'Elective IV', …
export function subjectGroupLabel(semester, slug) {
  const group = semester?.groups.find((g) => g.options.includes(slug))
  return group ? group.label : 'Core'
}
