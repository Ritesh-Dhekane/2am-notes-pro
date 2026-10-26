// What the portal offers: courses, their semesters, core subjects and elective groups, and how each
// subject is named and drawn. Semester ids are the Drive folder names (MCA-Sem-II/subjects/…, and the
// prefix before "-Sem-" is the course); subject slugs must be unique across courses. Subject slugs
// are the subject folder names. A subject folder that isn't listed here still shows up (as core,
// with a neutral look), so adding content never needs a code change — only grouping does.

import {
  BarChart3,
  Boxes,
  AppWindow,
  Brain,
  BrainCircuit,
  Building2,
  Bug,
  Cloud,
  CloudCog,
  CloudUpload,
  Code2,
  Cpu,
  Database,
  Factory,
  FileSearch,
  Globe,
  Coffee,
  FlaskConical,
  Lightbulb,
  KanbanSquare,
  Landmark,
  ListTree,
  LockKeyhole,
  Palette,
  Megaphone,
  Microscope,
  Network,
  PieChart,
  ShieldAlert,
  ShieldCheck,
  ShieldHalf,
  ShoppingCart,
  Stethoscope,
  Store,
  Sigma,
  Sparkles,
  Smartphone,
  Target,
  Terminal,
  TestTubes,
  TrendingUp,
  UserCog,
  Users,
  Webhook,
  Wheat,
} from 'lucide-react'

export const COURSES = [
  { id: 'MCA', name: 'MCA', full: 'Master of Computer Applications' },
  { id: 'BCA', name: 'BCA', full: 'Bachelor of Computer Applications' },
  { id: 'MBA', name: 'MBA', full: 'Master of Business Administration' },
]

export const SEMESTERS = [
  {
    // 2025 pattern (from 2025-26); Semesters II and III below are the 2024 pattern.
    id: 'MCA-Sem-I',
    course: 'MCA',
    number: 1,
    label: 'Semester I (2025 pattern)',
    short: 'Sem I',
    core: [
      'mathematical-foundation-for-computer-application',
      'data-structures-and-algorithms',
      'object-oriented-programming',
      'research-methodology-2025',
    ],
    groups: [
      {
        id: 'elective-i',
        label: 'Elective I',
        pick: 'one',
        options: ['mca-artificial-intelligence', 'mobile-computing', 'data-analytics'],
      },
    ],
  },
  {
    id: 'MCA-Sem-II',
    course: 'MCA',
    number: 2,
    label: 'Semester II',
    short: 'Sem II',
    core: ['java-programming', 'software-testing-and-quality-assurance', 'optimization-techniques', 'research-methodology'],
    groups: [
      {
        id: 'electives',
        label: 'Electives',
        hint: 'Choose the two electives you take.',
        pick: 2,
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
    course: 'MCA',
    number: 3,
    label: 'Semester III',
    short: 'Sem III',
    core: ['design-and-analysis-of-algorithms', 'organizational-behaviour', 'practicals', 'research-project', 'software-testing'],
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
  {
    id: 'BCA-Sem-V',
    course: 'BCA',
    number: 5,
    label: 'Semester V',
    short: 'Sem V',
    core: ['software-engineering-and-testing', 'fundamentals-of-artificial-intelligence', 'fundamentals-of-data-science', 'core-java-programming'],
    groups: [
      {
        id: 'elective',
        label: 'Elective',
        pick: 'one',
        options: ['ui-ux-design', 'cloud-computing', 'bca-cyber-security'],
      },
    ],
  },
  {
    id: 'BCA-Sem-VI',
    course: 'BCA',
    number: 6,
    label: 'Semester VI',
    short: 'Sem VI',
    core: ['software-project-management', 'web-programming', 'operating-system-design', 'advanced-java-programming'],
    groups: [
      {
        id: 'elective',
        label: 'Elective',
        pick: 'one',
        options: ['prompt-and-generative-ai', 'big-data-and-analytics', 'bca-mobile-application-development'],
      },
    ],
  },
  {
    // 2024 pattern, Business Analytics only for now: the Python core and pick 4 of the 8 electives.
    id: 'MBA-Sem-III-2024',
    course: 'MBA',
    number: 3,
    label: 'Semester III (2024 pattern, Business Analytics)',
    short: 'Sem III 2024',
    core: ['strategic-management', 'mba-python'],
    groups: [
      {
        id: 'ba-electives',
        label: 'Business Analytics electives',
        pick: 4,
        options: [
          'advanced-statistical-methods',
          'data-visualization-and-storytelling',
          'ba-marketing-analytics',
          'financial-analytics',
          'workforce-analytics',
          'big-data-analytics',
          'supply-and-operations-chain-analytics',
          'marketing-intelligence',
        ],
      },
    ],
  },
  {
    // 2025 pattern, core only for now: Strategic Management plus the specialization's core course.
    // Was "MBA-Sem-III" (the Drive folder's old name), kept as an alias so saved choices still work.
    id: 'MBA-Sem-III-2025',
    aliases: ['MBA-Sem-III'],
    course: 'MBA',
    number: 3,
    label: 'Semester III (2025 pattern)',
    short: 'Sem III 2025',
    core: ['strategic-management'],
    groups: [
      {
        id: 'specialization',
        label: 'Specialization',
        hint: 'Pick your specialization to see its core course.',
        pick: 'one',
        options: [
          'services-marketing',
          'advanced-financial-management',
          'strategic-human-resource-management',
          'services-operations-management',
          'mba-python',
          'agriculture-and-indian-economy',
          'fundamentals-of-pharma-and-healthcare-management',
        ],
      },
    ],
  },
  {
    // 2024 pattern, Business Analytics only for now: the Data Mining core and pick 4 of the 8 electives.
    id: 'MBA-Sem-IV-2024',
    course: 'MBA',
    number: 4,
    label: 'Semester IV (2024 pattern, Business Analytics)',
    short: 'Sem IV 2024',
    core: ['data-mining'],
    groups: [
      {
        id: 'ba-electives',
        label: 'Business Analytics electives',
        pick: 4,
        options: [
          'time-series-analysis-and-forecasting',
          'strategic-management-and-business-analytics',
          'retail-and-e-commerce-analytics',
          'generative-ai-for-business-applications',
          'healthcare-analytics',
          'predictive-analytics-and-machine-learning-using-python',
          'sports-analytics',
          'business-applications-of-blockchain-technologies',
        ],
      },
    ],
  },
]

const SUBJECTS = {
  // Semester I (2025 pattern)
  'mathematical-foundation-for-computer-application': { name: 'Mathematical Foundation for Computer Application', short: 'Maths', code: 'MJC-501', icon: Sigma, tint: '#F43F5E', about: 'Sets and logic, relations and functions, probability, statistics, trees and graphs.' },
  'data-structures-and-algorithms': { name: 'Data Structures & Algorithms', short: 'DSA', code: 'MJC-502', icon: ListTree, tint: '#8B5CF6', about: 'Linked lists, stacks and queues, trees and graphs, searching, sorting and hashing.' },
  'object-oriented-programming': { name: 'Object Oriented Programming', short: 'OOP', code: 'MJC-503', icon: Boxes, tint: '#F59E0B', about: 'C++: classes and objects, inheritance, polymorphism, templates, exceptions and files.' },
  'research-methodology-2025': { name: 'Research Methodology', short: 'RM', code: 'RM-530', icon: FileSearch, tint: '#A855F7', about: 'Research design, data collection and sampling, analysis, ethics and report writing.' },
  'mca-artificial-intelligence': { name: 'Artificial Intelligence', short: 'AI', code: 'MEC-520', icon: BrainCircuit, tint: '#06B6D4', about: 'Elective I.' },
  'mobile-computing': { name: 'Mobile Computing', short: 'Mobile', code: 'MEC-520', icon: Smartphone, tint: '#22C55E', about: 'Elective I.' },
  'data-analytics': { name: 'Data Analytics', short: 'Data Analytics', code: 'MEC-520', icon: BarChart3, tint: '#EAB308', about: 'Elective I.' },
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
  'software-testing': { name: 'Software Testing', short: 'ST', code: 'NPTEL', icon: TestTubes, tint: '#14B8A6', about: 'NPTEL course: graph, logic and input-space coverage, mutation, web and symbolic testing.' },
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
  // BCA Semester V
  'software-engineering-and-testing': { name: 'Software Engineering & Testing', short: 'SE&T', code: 'CA-301', icon: ShieldCheck, tint: '#10B981', about: 'System engineering, SDLC models, analysis and design tools, testing methods and QA.' },
  'fundamentals-of-artificial-intelligence': { name: 'Fundamentals of Artificial Intelligence', short: 'AI', code: 'CA-302', icon: BrainCircuit, tint: '#06B6D4', about: 'Problem spaces and search, game playing and machine learning basics.' },
  'fundamentals-of-data-science': { name: 'Fundamentals of Data Science', short: 'Data Science', code: 'CA-304', icon: BarChart3, tint: '#F43F5E', about: 'Statistics, data collection and preprocessing, visualization, tools and ethics.' },
  'core-java-programming': { name: 'Core Java Programming', short: 'Core Java', code: 'CA-321', icon: Coffee, tint: '#F59E0B', about: 'Skill course: hands-on Core Java practicals.' },
  'ui-ux-design': { name: 'UI & UX Design', short: 'UI/UX', code: 'CA-310', icon: Palette, tint: '#EC4899', about: 'User research, design principles, prototyping and usability testing.' },
  'cloud-computing': { name: 'Cloud Computing', short: 'Cloud', code: 'CA-312', icon: Cloud, tint: '#0EA5E9', about: 'Virtualization, cloud platforms, emerging trends and cloud security.' },
  'bca-cyber-security': { name: 'Cyber Security', short: 'Cyber', code: 'CA-314', icon: ShieldAlert, tint: '#EF4444', about: 'Cyber offenses, cybercrime tools, cryptography and cyber forensics.' },
  // BCA Semester VI
  'software-project-management': { name: 'Software Project Management', short: 'SPM', code: 'CA-351', icon: KanbanSquare, tint: '#6366F1', about: 'Planning, estimating and running software projects.' },
  'web-programming': { name: 'Web Programming', short: 'Web', code: 'CA-352', icon: Globe, tint: '#3B82F6', about: 'Building dynamic websites and web applications.' },
  'operating-system-design': { name: 'Operating System Design', short: 'OS', code: 'CA-354', icon: Cpu, tint: '#64748B', about: 'Processes, scheduling, memory and file systems.' },
  'advanced-java-programming': { name: 'Advanced Java Programming', short: 'Adv Java', code: 'CA-371', icon: Coffee, tint: '#F97316', about: 'Skill course: hands-on Advanced Java practicals.' },
  'prompt-and-generative-ai': { name: 'Prompt & Generative AI', short: 'GenAI', code: 'CA-360', icon: Sparkles, tint: '#A855F7', about: 'Prompt design and working with generative AI models.' },
  'big-data-and-analytics': { name: 'Big Data & Analytics', short: 'Big Data', code: 'CA-362', icon: Database, tint: '#EAB308', about: 'Storing, processing and analysing large data sets.' },
  'bca-mobile-application-development': { name: 'Mobile Application Development', short: 'MAD', code: 'CA-364', icon: AppWindow, tint: '#22C55E', about: 'Building mobile apps: UI, data and publishing.' },
  // MBA Semester III (core)
  'strategic-management': { name: 'Strategic Management', short: 'SM', code: '301 GC-14', icon: Target, tint: '#6366F1', about: 'Core for every MBA specialization.' },
  'services-marketing': { name: 'Services Marketing', short: 'Services Mktg', code: '302 SC MKT-01', icon: Store, tint: '#EC4899', about: 'Marketing specialization core.' },
  'advanced-financial-management': { name: 'Advanced Financial Management', short: 'AFM', code: '302 SC FIN-01', icon: Landmark, tint: '#10B981', about: 'Finance specialization core.' },
  'strategic-human-resource-management': { name: 'Strategic Human Resource Management', short: 'SHRM', code: '302 SC HRM-01', icon: UserCog, tint: '#F59E0B', about: 'HR specialization core.' },
  'services-operations-management': { name: 'Services Operations Management', short: 'SOM', code: '302 SC OSCM-01', icon: Factory, tint: '#64748B', about: 'Operations & supply chain specialization core.' },
  'mba-python': { name: 'Python', short: 'Python', code: '302 SC BA-01', icon: Terminal, tint: '#3B82F6', about: 'Business analytics specialization core.' },
  'agriculture-and-indian-economy': { name: 'Agriculture and Indian Economy', short: 'Agri Economy', code: '302 SC ABM-01', icon: Wheat, tint: '#84CC16', about: 'Agri business specialization core.' },
  'fundamentals-of-pharma-and-healthcare-management': { name: 'Fundamentals of Pharma and Healthcare Management', short: 'Pharma & Healthcare', code: '302 SC PHM-01', icon: Stethoscope, tint: '#06B6D4', about: 'Pharma & healthcare specialization core.' },
  // MBA Business Analytics electives (2024 pattern), Semester III
  'advanced-statistical-methods': { name: 'Advanced Statistical Methods', short: 'Adv Stats', code: 'BA 610 SE-01', icon: Sigma, tint: '#8B5CF6', about: 'R programming, hypothesis testing, regression and time series.' },
  'data-visualization-and-storytelling': { name: 'Data Visualization and Storytelling', short: 'Data Viz', code: 'BA 611 SE-02', icon: PieChart, tint: '#EAB308', about: 'Power BI: Power Query, charts, DAX and dashboards.' },
  'ba-marketing-analytics': { name: 'Marketing Analytics', short: 'Mktg Analytics', code: 'BA 612 SE-03', icon: Megaphone, tint: '#EC4899', about: 'Business Analytics elective.' },
  'financial-analytics': { name: 'Financial Analytics', short: 'Fin Analytics', code: 'BA 613 SE-04', icon: Landmark, tint: '#10B981', about: 'Business Analytics elective.' },
  'workforce-analytics': { name: 'Workforce Analytics', short: 'Workforce', code: 'BA 614 SE-05', icon: Users, tint: '#F59E0B', about: 'Business Analytics elective.' },
  'big-data-analytics': { name: 'Big Data Analytics', short: 'Big Data', code: 'BA 615 SE-06', icon: Database, tint: '#0EA5E9', about: 'Business Analytics elective.' },
  'supply-and-operations-chain-analytics': { name: 'Supply & Operation Chain Analytics', short: 'SCM Analytics', code: 'BA 617 SE-07', icon: Factory, tint: '#64748B', about: 'Business Analytics elective.' },
  'marketing-intelligence': { name: 'Marketing Intelligence', short: 'Mktg Intel', code: 'BA 618 SE-08', icon: Target, tint: '#F43F5E', about: 'Business Analytics elective.' },
  // MBA Business Analytics (2024 pattern), Semester IV
  'data-mining': { name: 'Data Mining', short: 'Data Mining', code: 'BA 653 SC-02', icon: Database, tint: '#6366F1', about: 'Business Analytics specialization core.' },
  'time-series-analysis-and-forecasting': { name: 'Time Series Analysis and Forecasting', short: 'Time Series', code: 'BA 660 SE-09', icon: TrendingUp, tint: '#3B82F6', about: 'Business Analytics elective.' },
  'strategic-management-and-business-analytics': { name: 'Strategic Management and Business Analytics', short: 'SM & BA', code: 'BA 661 SE-10', icon: Target, tint: '#6366F1', about: 'Business Analytics elective.' },
  'retail-and-e-commerce-analytics': { name: 'Retail and E-Commerce Analytics', short: 'Retail Analytics', code: 'BA 662 SE-11', icon: ShoppingCart, tint: '#F59E0B', about: 'Business Analytics elective.' },
  'generative-ai-for-business-applications': { name: 'Generative AI for Business Applications', short: 'GenAI', code: 'BA 663 SE-12', icon: Sparkles, tint: '#A855F7', about: 'Business Analytics elective.' },
  'healthcare-analytics': { name: 'Healthcare Analytics', short: 'Healthcare', code: 'BA 664 SE-13', icon: Stethoscope, tint: '#06B6D4', about: 'Business Analytics elective.' },
  'predictive-analytics-and-machine-learning-using-python': { name: 'Predictive Analytics and Machine Learning using Python', short: 'Predictive ML', code: 'BA 665 SE-14', icon: BrainCircuit, tint: '#14B8A6', about: 'Business Analytics elective.' },
  'sports-analytics': { name: 'Sports Analytics', short: 'Sports', code: 'BA 666 SE-15', icon: BarChart3, tint: '#22C55E', about: 'Business Analytics elective.' },
  'business-applications-of-blockchain-technologies': { name: 'Business Applications of Blockchain Technologies', short: 'Blockchain', code: 'BA 667 SE-16', icon: Boxes, tint: '#84CC16', about: 'Business Analytics elective.' },
}

export function subjectInfo(slug) {
  return SUBJECTS[slug] || null
}

export function semesterById(id) {
  return SEMESTERS.find((s) => s.id === id || s.aliases?.includes(id)) || null
}

// A renamed semester's current id ("MBA-Sem-III" -> "MBA-Sem-III-2025"); other ids unchanged.
export function canonicalSemesterId(id) {
  return SEMESTERS.find((s) => s.aliases?.includes(id))?.id ?? id
}

export function courseById(id) {
  return COURSES.find((c) => c.id === id) || null
}

// "BCA Semester V" / "BCA Sem V"; empty for an unknown semester.
export function semesterTitle(semester, { short = false } = {}) {
  return semester ? `${semester.course} ${short ? semester.short : semester.label}` : ''
}

// Groups have pick: 'one' (radio) or a number n (choose exactly n). Choices are stored as
// { [groupId]: slug } for pick-one groups and { [groupId]: [slug, …] } for the others.
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

// For analytics and logs: "machine-learning-techniques,power-bi".
export function electivesLabel(semester, electives) {
  return semester ? [...chosenElectives(semester, electives)].sort().join(',') : ''
}

// Which subjects a student sees: the semester's core, the electives they picked, and any subject
// folder the catalog doesn't know about yet.
export function isSubjectVisible(semester, electives, slug) {
  if (!semester) return true
  const grouped = semester.groups.some((g) => g.options.includes(slug))
  return !grouped || chosenElectives(semester, electives).has(slug)
}

export function groupChoiceCount(group, electives = {}) {
  const value = electives[group.id]
  if (group.pick === 'one') return group.options.includes(value) ? 1 : 0
  return Array.isArray(value) ? value.filter((slug) => group.options.includes(slug)).length : 0
}

export function groupNeeds(group) {
  return group.pick === 'one' ? 1 : group.pick
}

// Every group needs exactly its number of choices.
export function isSetupComplete(semester, electives = {}) {
  if (!semester) return false
  return semester.groups.every((g) => groupChoiceCount(g, electives) === groupNeeds(g))
}

// Where a subject sits in its semester: 'Core', 'Elective IV', …
export function subjectGroupLabel(semester, slug) {
  const group = semester?.groups.find((g) => g.options.includes(slug))
  return group ? group.label : 'Core'
}
