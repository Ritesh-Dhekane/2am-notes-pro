// Development-only sample backend (open the app with ?demo). Mirrors the Apps Script responses so
// every screen can be built and tested without Google sign-in or Drive. Never bundled in production
// (api.js only imports it when import.meta.env.DEV is true).

import sampleDocx from './fixtures/sample.docx?url'
import sampleJpg from './fixtures/sample.jpg?url'
import samplePptx from './fixtures/sample.pptx?url'
import sampleXlsx from './fixtures/sample.xlsx?url'

const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'

const DAY = 24 * 60 * 60 * 1000
const now = Date.now()
const ago = (days) => new Date(now - days * DAY).toISOString()

let nextId = 1
function file(name, { size = 4200, days = 30, mimeType } = {}) {
  const ext = name.split('.').pop()
  return {
    id: `demo-${nextId++}`,
    name,
    mimeType:
      mimeType || (ext === 'pdf' ? 'application/pdf' : ext === 'md' ? 'text/markdown' : 'text/plain'),
    size,
    updated: ago(days),
  }
}

// Semester → subjects, mirroring Drive's MCA-Sem-II/subjects/<slug>/… layout.
const SEM_II = [
  {
    slug: 'java-programming',
    name: 'Java Programming',
    files: {
      notes: [
        file('unit-01-oop-principles-and-jvm-internals.md', { days: 40 }),
        file('unit-01-classes-objects-and-constructors.md', { days: 38 }),
        file('unit-02-exception-handling-in-java.md', { size: 9800, days: 2 }),
        file('unit-02-custom-exceptions-best-practices.pdf', { size: 2_400_000, days: 9 }),
        file('unit-02-thread-synchronization-and-deadlocks.md', { days: 12 }),
        file('unit-03-collections-framework-and-generics.md', { days: 20 }),
        file('unit-04-io-streams-and-nio.md', { days: 25 }),
        file('unit-05-jdbc-and-connection-pooling.txt', { size: 1800, days: 30 }),
      ],
      pyqs: [
        file('dec-2025-end-semester.pdf', { size: 820_000, days: 4 }),
        file('may-2025-end-semester.pdf', { size: 760_000, days: 120 }),
        file('dec-2024-end-semester-solutions.md', { days: 60 }),
      ],
      references: [
        file('herbert-schildt-java-the-complete-reference-ch-10.pdf', { size: 3_100_000, days: 90 }),
        file('java-exception-hierarchy-cheat-sheet.md', { days: 15 }),
      ],
    },
  },
  {
    slug: 'software-testing-and-quality-assurance',
    name: 'Software Testing And Quality Assurance',
    files: {
      notes: [
        file('unit-01-testing-fundamentals.md'),
        file('unit-02-black-box-testing-techniques.md', { days: 5 }),
        file('unit-03-white-box-and-path-testing.md'),
      ],
      pyqs: [file('dec-2025-end-semester.pdf', { size: 640_000 })],
      references: [file('selenium-quick-reference.md')],
    },
  },
  {
    slug: 'research-methodology',
    name: 'Research Methodology',
    files: {
      notes: [file('unit-01-research-design.md'), file('unit-02-sampling-methods.md')],
      pyqs: [file('may-2025-end-semester.pdf')],
      references: [],
    },
  },
  {
    slug: 'machine-learning-techniques',
    name: 'Machine Learning Techniques',
    files: {
      notes: [
        file('unit-01-supervised-learning.md'),
        file('unit-03-k-means-clustering.md', { days: 1 }),
        file('unit-04-neural-networks-and-backpropagation.md'),
      ],
      pyqs: [file('dec-2025-end-semester.pdf')],
      references: [file('ml-formula-sheet.pdf', { size: 410_000 })],
    },
  },
  {
    slug: 'optimization-techniques',
    name: 'Optimization Techniques',
    files: {
      notes: [file('unit-01-linear-programming.md'), file('unit-02-simplex-method.md')],
      pyqs: [],
      references: [],
    },
  },
  {
    slug: 'power-bi',
    name: 'Power BI',
    files: { notes: [file('unit-01-data-modelling.md')], pyqs: [], references: [file('dax-cheat-sheet.md')] },
  },
  {
    slug: 'cloud-computing-management-and-security',
    name: 'Cloud Computing Management And Security',
    files: {
      notes: [file('unit-01-cloud-management-and-security.md'), file('unit-03-security-concepts-in-aws.pdf', { size: 880_000 })],
      pyqs: [file('nov-dec-2025-question-paper.pdf', { size: 32_000, days: 10 })],
      references: [],
    },
  },
  {
    slug: 'cyber-security',
    name: 'Cyber Security',
    files: { notes: [file('unit-01-evolution-of-cyber-security.md'), file('unit-04-cyber-crime.md')], pyqs: [], references: [] },
  },
]

const SEM_III = [
  // Office files and images, for the document viewer.
  {
    slug: 'tableau',
    name: 'Tableau',
    files: {
      notes: [],
      pyqs: [file('sep-2025-unit-test-1.jpg', { size: 51_798, days: 3, mimeType: 'image/jpeg' })],
      references: [
        file('assignment-1-basics-of-tableau.docx', { size: 37_110, days: 5, mimeType: DOCX }),
        file('literature-review-sheet.xlsx', { size: 5_869, days: 6, mimeType: XLSX }),
        file('research-presentation.pptx', { size: 29_176, days: 8, mimeType: PPTX }),
      ],
    },
  },
  {
    slug: 'design-and-analysis-of-algorithms',
    name: 'Design And Analysis Of Algorithms',
    files: {
      notes: [file('unit-01-asymptotic-notation.md', { days: 2 }), file('unit-02-divide-and-conquer.md'), file('unit-03-greedy-method.md')],
      pyqs: [file('dec-2025-end-semester.pdf', { size: 410_000, days: 5 })],
      references: [],
    },
  },
  {
    slug: 'organizational-behaviour',
    name: 'Organizational Behaviour',
    files: {
      notes: [file('unit-01-foundations-of-ob.md'), file('unit-02-motivation-theories.md', { days: 4 })],
      pyqs: [],
      references: [file('assignment-1.pdf', { size: 1_200_000, days: 12 })],
    },
  },
  { slug: 'practicals', name: 'Practicals', files: { notes: [], pyqs: [], references: [] } },
  {
    slug: 'research-project',
    name: 'Research Project',
    files: { notes: [file('unit-01-choosing-a-topic.md')], pyqs: [], references: [file('literature-review-template.md')] },
  },
  {
    slug: 'deep-learning',
    name: 'Deep Learning',
    files: { notes: [file('unit-01-neural-network-basics.md', { days: 1 }), file('unit-02-cnn.md')], pyqs: [], references: [] },
  },
  {
    slug: 'mern-stack-development',
    name: 'Mern Stack Development',
    files: { notes: [file('unit-01-node-and-express.md')], pyqs: [], references: [] },
  },
  {
    slug: 'enterprise-resource-planning',
    name: 'Enterprise Resource Planning',
    files: { notes: [file('unit-01-erp-overview.md')], pyqs: [], references: [] },
  },
  {
    slug: 'e-commerce',
    name: 'E Commerce',
    files: { notes: [file('unit-01-business-models.md')], pyqs: [], references: [] },
  },
]

// Every subject except Practicals has a syllabus at its root, like the real Drive folders.
for (const subject of [...SEM_II, ...SEM_III]) {
  subject.syllabus = subject.slug === 'practicals' ? null : file('syllabus.pdf', { size: 320_000, days: 200 })
}

const SEMESTERS = { 'MCA-Sem-II': SEM_II, 'MCA-Sem-III': SEM_III }
const ALL_FILES = [...SEM_II, ...SEM_III].flatMap((s) => [...Object.values(s.files).flat(), ...(s.syllabus ? [s.syllabus] : [])])

const FIXTURES = {
  'sep-2025-unit-test-1.jpg': sampleJpg,
  'assignment-1-basics-of-tableau.docx': sampleDocx,
  'literature-review-sheet.xlsx': sampleXlsx,
  'research-presentation.pptx': samplePptx,
}

async function fixtureBase64(url) {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer())
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(binary)
}

const EXCEPTION_NOTE = `# Exception Handling in Java

Exceptions let a program deal with errors without crashing. This note covers what an exception is, the \`Throwable\` hierarchy, checked vs unchecked exceptions, and the \`try\`–\`catch\`–\`finally\` and try-with-resources patterns that examiners ask about every year.

## 1. What is an exception?

An **exception** is an abnormal condition that arises while a program is running and disrupts the normal flow of instructions. When it happens inside a method, Java creates an exception object and hands it to the runtime system — this is called *throwing* an exception.

The runtime then searches the call stack, from the current method back towards \`main()\`, for a block that can handle it. If none is found, the default handler prints the stack trace and stops the thread.

> **Definition:** An exception is an object of a subclass of \`java.lang.Throwable\` that describes an error condition at run time.

## 2. The Throwable hierarchy

Every exception type is a subclass of \`Throwable\`, which splits into two branches:

- **Error** — serious problems the application should not try to catch, such as \`OutOfMemoryError\` and \`StackOverflowError\`.
- **Exception** — conditions a reasonable program might want to catch, such as \`IOException\` and \`SQLException\`.
- **RuntimeException** — a subclass of \`Exception\` for programming bugs, such as \`NullPointerException\`.

> **Exam tip:** Draw the hierarchy (Object → Throwable → Error / Exception → RuntimeException) at the start of a long answer. Examiners look for the exact place of \`RuntimeException\`; leaving it out commonly costs 2–3 marks.

## 3. Checked vs unchecked exceptions

| Criterion | Checked | Unchecked |
| --- | --- | --- |
| Inherits from | \`Exception\` (not \`RuntimeException\`) | \`RuntimeException\` or \`Error\` |
| Compiler check | Must be caught or declared with \`throws\` | Not checked by the compiler |
| Typical cause | External failures (file, network) | Bugs in the program |
| Examples | \`IOException\`, \`SQLException\` | \`NullPointerException\`, \`ArithmeticException\` |

## 4. try, catch and finally

\`\`\`java
public class Division {
    public static void main(String[] args) {
        try {
            int result = 10 / 0;
            System.out.println(result);
        } catch (ArithmeticException e) {
            System.out.println("Cannot divide by zero: " + e.getMessage());
        } finally {
            System.out.println("This always runs.");
        }
    }
}
\`\`\`

The \`finally\` block runs whether or not an exception was thrown, so it is the place to release resources.

> **Important:** \`finally\` runs even if the \`try\` block contains a \`return\` statement. It is skipped only by \`System.exit()\` or a crash of the JVM itself.

## 5. try-with-resources (Java 7+)

Any object that implements \`AutoCloseable\` can be declared in the parentheses after \`try\`; Java closes it automatically at the end of the block.

\`\`\`java
try (BufferedReader reader = new BufferedReader(new FileReader("marks.txt"))) {
    System.out.println(reader.readLine());
} catch (IOException e) {
    System.err.println("Could not read the file: " + e.getMessage());
}
\`\`\`

## 6. Creating your own exception

\`\`\`java
public class InsufficientBalanceException extends Exception {
    public InsufficientBalanceException(String message) {
        super(message);
    }
}
\`\`\`

Extend \`Exception\` for a checked exception or \`RuntimeException\` for an unchecked one, and pass a clear message to \`super\`.

## 7. Key takeaways

1. Catch the most specific exception first, then more general ones.
2. Never leave a \`catch\` block empty — at least log the error.
3. Prefer try-with-resources over closing resources by hand in \`finally\`.
`

function shortNote(title, unit) {
  return `# ${title}

A short revision note for Unit ${unit}. The full note is coming soon.

## Key points

- Start with the definition and one example.
- Draw a diagram where the topic has a structure or a flow.
- End with advantages and limitations — they are asked as 5-mark questions.

> **Exam tip:** Write headings exactly as in the syllabus so the examiner can find each part quickly.

> [!NOTE]
> Notes moved over from 2AM Notes use GitHub-style callouts like this one.
`
}

// A tiny valid one-page PDF, so the PDF viewer has something real to show.
function samplePdf(title) {
  const text = title.replace(/[()\\]/g, '')
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    null,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]
  const stream = `BT /F1 20 Tf 72 760 Td (${text}) Tj /F1 12 Tf 0 -32 Td (Sample PDF in demo mode.) Tj ET`
  objects[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
  let pdf = '%PDF-1.4\n'
  const offsets = []
  objects.forEach((body, i) => {
    offsets.push(pdf.length)
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`
  })
  const xref = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  offsets.forEach((o) => {
    pdf += `${String(o).padStart(10, '0')} 00000 n \n`
  })
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`
  return btoa(pdf)
}

async function contentFor(f) {
  if (FIXTURES[f.name]) return { encoding: 'base64', content: await fixtureBase64(FIXTURES[f.name]) }
  if (f.name === 'unit-02-exception-handling-in-java.md') return { encoding: 'utf8', content: EXCEPTION_NOTE }
  const base = f.name.replace(/\.[a-z]+$/, '')
  const unit = Number(base.match(/^unit-(\d+)/)?.[1] || 1)
  const title = base
    .replace(/^unit-\d+-/, '')
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
  if (f.mimeType === 'application/pdf') return { encoding: 'base64', content: samplePdf(title) }
  if (f.mimeType === 'text/plain') {
    return { encoding: 'utf8', content: `${title}\n\nPlain text notes (demo).\n\n1. Load the driver\n2. Open a connection\n3. Run the statement\n4. Close everything` }
  }
  return { encoding: 'utf8', content: shortNote(title, unit) }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function handleDemo(action, params) {
  await wait(250)
  const user = { email: 'ritesh@example.com', name: 'Ritesh Dhekane', picture: null }
  switch (action) {
    case 'verify':
    case 'login':
    case 'logout':
      return { authenticated: true, user }
    // The "account" copy of the semester choice, kept in localStorage so it survives reloads like the real one.
    case 'getStudy':
      return { authenticated: true, user, study: JSON.parse(localStorage.getItem('notes-pro.demo-account-study') || 'null') }
    case 'saveStudy': {
      const study = { ...params.study, updatedAt: new Date().toISOString() }
      localStorage.setItem('notes-pro.demo-account-study', JSON.stringify(study))
      return { authenticated: true, user, study }
    }
    case 'catalog':
      // Public: what's on offer, with counts but no file names or ids.
      return {
        authenticated: false,
        semesters: Object.entries(SEMESTERS).map(([id, subjects]) => ({
          id,
          subjects: subjects.map((s) => ({
            slug: s.slug,
            name: s.name,
            counts: { notes: s.files.notes.length, pyqs: s.files.pyqs.length, references: s.files.references.length },
            hasSyllabus: Boolean(s.syllabus),
          })),
        })),
      }
    case 'listLibrary':
      if (!SEMESTERS[params.semester]) throw new Error('semester_not_found')
      return { authenticated: true, user, subjects: SEMESTERS[params.semester] }
    case 'getFile': {
      const f = ALL_FILES.find((x) => x.id === params.fileId)
      if (!f) throw new Error('file_not_accessible')
      return { authenticated: true, user, file: { id: f.id, name: f.name, mimeType: f.mimeType, ...(await contentFor(f)) } }
    }
    default:
      throw new Error('unknown_action')
  }
}
