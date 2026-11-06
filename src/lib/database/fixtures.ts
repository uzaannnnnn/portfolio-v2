import type {
  AboutContent,
  ActiveResume,
  BootGreeting,
  CertificationItem,
  EducationItem,
  EngineeringNote,
  ExperienceItem,
  HeroContent,
  ProfileData,
  ProjectDetail,
  SiteSettings,
  SkillCategory,
} from "@/types/portfolio";

export const INITIAL_PROFILE: ProfileData = {
  fullName: "Muhamad Fauzan",
  professionalTitle: "Software Engineer",
  tagline: "Building software that solves real-world problems.",
  shortBio:
    "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
  location: "Indonesia",
  email: "",
  githubUrl: "https://github.com/uzaannnnnn",
  linkedinUrl: "",
  websiteUrl: "http://localhost:3000",
  avatarUrl: null,
  availableForWork: true,
  availabilityNote: "Open to software engineering roles and technical collaborations.",
};

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  siteTitle: "Muhamad Fauzan — Software Engineer",
  siteDescription:
    "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
  canonicalBaseUrl: "http://localhost:3000",
  homepageSectionOrder: [
    "hero",
    "about",
    "skills",
    "featured_projects",
    "experience",
    "philosophy",
    "education",
    "certifications",
    "contact",
  ],
  bootWelcome: {
    enabled: true,
    intervalMs: 1650,
    welcomeName: "Muhamad Fauzan",
    welcomeTitle: "Software Engineer",
    welcomeMessage: "Welcome to my portfolio.",
  },
};

export const INITIAL_HERO: HeroContent = {
  eyebrow: "Software Engineering Portfolio",
  headline: "Building software that solves real-world problems.",
  supportingDescription:
    "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
  primaryCtaLabel: "Explore Engineering Work",
  primaryCtaHref: "#projects",
  secondaryCtaLabel: "Get in Touch",
  secondaryCtaHref: "/contact",
  engineeringFocusAreas: [
    "Software Engineering Fundamentals",
    "Frontend & Full-Stack Architecture",
    "Backend & API Engineering",
    "Relational Database Design",
    "Automated Testing & Verification",
    "Deployment & AI Integration",
  ],
};

export const INITIAL_ABOUT: AboutContent = {
  introduction:
    "I am Muhamad Fauzan, a Software Engineer dedicated to designing, implementing, testing, and deploying maintainable software systems.",
  narrativeParagraphs: [
    "My engineering approach emphasizes clean system boundaries, explicit data modeling, and verifiable behavior from the database schema up to the user interface.",
    "Rather than treating software as isolated screens or temporary scripts, I focus on end-to-end engineering: structured requirements analysis, normalized relational schemas, type-safe APIs, accessible interfaces, and automated quality gates.",
  ],
  engineeringPhilosophyTitle: "Engineering Philosophy",
  engineeringPhilosophySubtitle:
    "Core principles that guide how I design, build, test, and maintain software systems.",
  engineeringPillars: [
    {
      id: "pillar-fundamentals",
      title: "Architecture & Data Integrity First",
      summary:
        "Reliable software starts with well-defined domain boundaries, normalized schemas, and strict server-side validation.",
      practices: [
        "Normalized relational data modeling with explicit constraints",
        "Strict separation between presentation and data access layers",
        "End-to-end type safety with TypeScript and schema validation",
      ],
    },
    {
      id: "pillar-evidence",
      title: "Verification Over Assumptions",
      summary:
        "Correctness, security, and accessibility must be verified systematically rather than assumed from happy-path manual runs.",
      practices: [
        "Automated unit, integration, and end-to-end testing workflows",
        "Server-enforced authentication, authorization, and access control",
        "Semantic HTML, keyboard accessibility, and WCAG contrast discipline",
      ],
    },
    {
      id: "pillar-pragmatism",
      title: "Maintainable Simplicity",
      summary:
        "Choose clear, proven architectures that solve the actual problem without introducing speculative complexity.",
      practices: [
        "Server-first rendering with minimal client-side JavaScript overhead",
        "Modular feature boundaries that remain easy to inspect and refactor",
        "Predictable state transitions such as explicit draft-to-publish flows",
      ],
    },
  ],
  coreDomains: [
    "Full-Stack Web Engineering",
    "Backend Services & REST APIs",
    "Database Modeling & SQL",
    "System Architecture",
    "Automated QA & CI/CD",
    "Practical AI Integration",
  ],
};

export const INITIAL_SKILL_CATEGORIES: SkillCategory[] = [
  {
    id: "cat-languages",
    name: "Programming Languages",
    slug: "programming-languages",
    description: "Languages used across backend services, web applications, and systems exercises.",
    displayOrder: 1,
    isEnabled: true,
    skills: [
      { id: "sk-ts", categoryId: "cat-languages", name: "TypeScript", isEnabled: true, displayOrder: 1, status: "published" },
      { id: "sk-js", categoryId: "cat-languages", name: "JavaScript", isEnabled: true, displayOrder: 2, status: "published" },
      { id: "sk-go", categoryId: "cat-languages", name: "Go", isEnabled: true, displayOrder: 3, status: "published" },
      { id: "sk-php", categoryId: "cat-languages", name: "PHP", isEnabled: true, displayOrder: 4, status: "published" },
      { id: "sk-py", categoryId: "cat-languages", name: "Python", isEnabled: true, displayOrder: 5, status: "published" },
      { id: "sk-java", categoryId: "cat-languages", name: "Java", isEnabled: true, displayOrder: 6, status: "published" },
      { id: "sk-csharp", categoryId: "cat-languages", name: "C#", isEnabled: true, displayOrder: 7, status: "published" },
      { id: "sk-cpp", categoryId: "cat-languages", name: "C/C++", isEnabled: true, displayOrder: 8, status: "published" },
    ],
  },
  {
    id: "cat-frontend",
    name: "Frontend Engineering",
    slug: "frontend",
    description: "Modern component architectures, responsive layouts, and accessible interfaces.",
    displayOrder: 2,
    isEnabled: true,
    skills: [
      { id: "sk-react", categoryId: "cat-frontend", name: "React", isEnabled: true, displayOrder: 1, status: "published" },
      { id: "sk-nextjs", categoryId: "cat-frontend", name: "Next.js", isEnabled: true, displayOrder: 2, status: "published" },
      { id: "sk-html", categoryId: "cat-frontend", name: "HTML", isEnabled: true, displayOrder: 3, status: "published" },
      { id: "sk-css", categoryId: "cat-frontend", name: "CSS", isEnabled: true, displayOrder: 4, status: "published" },
      { id: "sk-tailwind", categoryId: "cat-frontend", name: "Tailwind CSS", isEnabled: true, displayOrder: 5, status: "published" },
    ],
  },
  {
    id: "cat-backend",
    name: "Backend Engineering",
    slug: "backend",
    description: "Server-side application logic, APIs, and service implementation.",
    displayOrder: 3,
    isEnabled: true,
    skills: [
      { id: "sk-node", categoryId: "cat-backend", name: "Node.js", isEnabled: true, displayOrder: 1, status: "published" },
      { id: "sk-go-be", categoryId: "cat-backend", name: "Go", isEnabled: true, displayOrder: 2, status: "published" },
      { id: "sk-laravel", categoryId: "cat-backend", name: "Laravel", isEnabled: true, displayOrder: 3, status: "published" },
    ],
  },
  {
    id: "cat-database",
    name: "Database Engineering",
    slug: "database",
    description: "Relational and document data storage, schema design, and query optimization.",
    displayOrder: 4,
    isEnabled: true,
    skills: [
      { id: "sk-pg", categoryId: "cat-database", name: "PostgreSQL", isEnabled: true, displayOrder: 1, status: "published" },
      { id: "sk-mysql", categoryId: "cat-database", name: "MySQL", isEnabled: true, displayOrder: 2, status: "published" },
      { id: "sk-mongo", categoryId: "cat-database", name: "MongoDB", isEnabled: true, displayOrder: 3, status: "published" },
      { id: "sk-sqlite", categoryId: "cat-database", name: "SQLite", isEnabled: true, displayOrder: 4, status: "published" },
    ],
  },
  {
    id: "cat-infra",
    name: "Infrastructure & Delivery",
    slug: "infrastructure",
    description: "Containerization, automated workflows, and cloud deployment.",
    displayOrder: 5,
    isEnabled: true,
    skills: [
      { id: "sk-docker", categoryId: "cat-infra", name: "Docker", isEnabled: true, displayOrder: 1, status: "published" },
      { id: "sk-gha", categoryId: "cat-infra", name: "GitHub Actions", isEnabled: true, displayOrder: 2, status: "published" },
      { id: "sk-vercel", categoryId: "cat-infra", name: "Vercel", isEnabled: true, displayOrder: 3, status: "published" },
    ],
  },
  {
    id: "cat-engineering",
    name: "Software Engineering Practices",
    slug: "engineering",
    description: "Core architectural, security, and verification disciplines.",
    displayOrder: 6,
    isEnabled: true,
    skills: [
      { id: "sk-rest", categoryId: "cat-engineering", name: "REST API", isEnabled: true, displayOrder: 1, status: "published" },
      { id: "sk-sysdesign", categoryId: "cat-engineering", name: "System Design", isEnabled: true, displayOrder: 2, status: "published" },
      { id: "sk-authn", categoryId: "cat-engineering", name: "Authentication", isEnabled: true, displayOrder: 3, status: "published" },
      { id: "sk-authz", categoryId: "cat-engineering", name: "Authorization", isEnabled: true, displayOrder: 4, status: "published" },
      { id: "sk-dbdesign", categoryId: "cat-engineering", name: "Database Design", isEnabled: true, displayOrder: 5, status: "published" },
      { id: "sk-testing", categoryId: "cat-engineering", name: "Software Testing", isEnabled: true, displayOrder: 6, status: "published" },
      { id: "sk-cicd", categoryId: "cat-engineering", name: "CI/CD", isEnabled: true, displayOrder: 7, status: "published" },
    ],
  },
  {
    id: "cat-ai",
    name: "AI Integration",
    slug: "ai-integration",
    description: "Integrating language and machine learning models into application workflows.",
    displayOrder: 7,
    isEnabled: true,
    skills: [
      { id: "sk-ai-api", categoryId: "cat-ai", name: "AI API Integration", isEnabled: true, displayOrder: 1, status: "published" },
      { id: "sk-model-int", categoryId: "cat-ai", name: "Model Integration", isEnabled: true, displayOrder: 2, status: "published" },
      { id: "sk-py-ai", categoryId: "cat-ai", name: "Python AI Ecosystem", isEnabled: true, displayOrder: 3, status: "published" },
    ],
  },
];

/**
 * Per user directive #1:
 * Seed GeoEntity, ClayCV, and SPK Bansos SAW as DRAFT projects initially.
 * Do not publish any project until its complete public-facing information has been verified and approved.
 */
export const INITIAL_PROJECTS: ProjectDetail[] = [
  {
    id: "proj-geoentity",
    slug: "geoentity",
    name: "GeoEntity",
    description: "Geospatial engineering and structured data operations built with Go and SQLite.",
    category: "Backend & Data Engineering",
    technologies: ["Go", "SQLite", "Geospatial Engineering", "Data Operations"],
    coverUrl: null,
    githubUrl: "https://github.com/uzaannnnnn/GeoEntity",
    liveDemoUrl: null,
    projectCompletionState: "Repository Available — Pending Case Study Verification",
    status: "draft",
    isFeatured: true,
    displayOrder: 1,
    updatedAt: "2026-11-06T00:00:00.000Z",
    screenshots: [],
    caseStudySections: [
      {
        id: "cs-geo-overview",
        sectionType: "overview",
        title: "Overview",
        content:
          "GeoEntity is a Go and SQLite project focused on geospatial engineering and structured data operations. Detailed case study sections are currently in draft awaiting owner verification.",
        displayOrder: 1,
        isEnabled: true,
      },
    ],
  },
  {
    id: "proj-claycv",
    slug: "claycv",
    name: "ClayCV",
    description:
      "ATS-friendly CV builder with live preview and PDF generation built with Next.js, React, and TypeScript.",
    category: "Full-Stack Web Application",
    technologies: ["Next.js", "React", "TypeScript", "PDF Generation"],
    coverUrl: null,
    githubUrl: "https://github.com/uzaannnnnn/ClayCV",
    liveDemoUrl: null,
    projectCompletionState: "Repository Available — Pending Case Study Verification",
    status: "draft",
    isFeatured: true,
    displayOrder: 2,
    updatedAt: "2026-11-06T00:00:00.000Z",
    screenshots: [],
    caseStudySections: [
      {
        id: "cs-clay-overview",
        sectionType: "overview",
        title: "Overview",
        content:
          "ClayCV is a web application for generating ATS-friendly CVs with live preview and PDF export using Next.js, React, and TypeScript. Detailed architectural notes are in draft awaiting verification.",
        displayOrder: 1,
        isEnabled: true,
      },
    ],
  },
  {
    id: "proj-spk-bansos-saw",
    slug: "spk-bansos-saw",
    name: "SPK Bansos SAW",
    description:
      "Sistem Pendukung Keputusan Penerima Manfaat Bansos Menggunakan Metode SAW Studi Kasus Desa Panundaan.",
    category: "Decision Support System",
    technologies: ["PHP", "Laravel", "MySQL", "Simple Additive Weighting (SAW)"],
    coverUrl: null,
    githubUrl: null,
    liveDemoUrl: null,
    projectCompletionState: "Draft — Pending Owner Confirmation",
    status: "draft",
    isFeatured: false,
    displayOrder: 3,
    updatedAt: "2026-11-06T00:00:00.000Z",
    screenshots: [],
    caseStudySections: [
      {
        id: "cs-spk-overview",
        sectionType: "overview",
        title: "Overview",
        content:
          "Decision support system implementing the Simple Additive Weighting (SAW) method for social assistance beneficiary evaluation (Desa Panundaan case study), built with PHP, Laravel, and MySQL.",
        displayOrder: 1,
        isEnabled: true,
      },
    ],
  },
];

/**
 * Rule 2: Do not invent work experience, employers, education, or certifications.
 * Empty arrays are provided so the public UI displays clean, honest empty states until configured in the Admin Dashboard.
 */
export const INITIAL_EXPERIENCES: ExperienceItem[] = [];
export const INITIAL_EDUCATIONS: EducationItem[] = [];
export const INITIAL_CERTIFICATIONS: CertificationItem[] = [];
export const INITIAL_NOTES: EngineeringNote[] = [];
export const INITIAL_ACTIVE_RESUME: ActiveResume | null = null;

export const INITIAL_BOOT_GREETINGS: BootGreeting[] = [
  {
    id: "greet-id",
    language: "Indonesian",
    greeting: "Selamat Datang",
    meaning: "Welcome",
    isEnabled: true,
    displayOrder: 1,
    status: "published",
  },
  {
    id: "greet-su",
    language: "Sundanese",
    greeting: "Wilujeng Sumping",
    meaning: "Welcome",
    isEnabled: true,
    displayOrder: 2,
    status: "published",
  },
  {
    id: "greet-jv",
    language: "Javanese",
    greeting: "Sugeng Rawuh",
    meaning: "Welcome",
    isEnabled: true,
    displayOrder: 3,
    status: "published",
  },
  {
    id: "greet-ban",
    language: "Balinese",
    greeting: "Rahajeng Rauh",
    meaning: "Welcome",
    isEnabled: true,
    displayOrder: 4,
    status: "published",
  },
  {
    id: "greet-min",
    language: "Minangkabau",
    greeting: "Salamaik Datang",
    meaning: "Welcome",
    isEnabled: true,
    displayOrder: 5,
    status: "published",
  },
  {
    id: "greet-bbc",
    language: "Batak Toba",
    greeting: "Horas",
    meaning: "Greeting",
    isEnabled: true,
    displayOrder: 6,
    status: "published",
  },
  {
    id: "greet-bug",
    language: "Bugis",
    greeting: "Tabe'",
    meaning: "Greeting / Respect",
    isEnabled: true,
    displayOrder: 7,
    status: "published",
  },
  {
    id: "greet-ace",
    language: "Acehnese",
    greeting: "Peumulia Jamee",
    meaning: "Welcoming guests",
    isEnabled: true,
    displayOrder: 8,
    status: "published",
  },
  {
    id: "greet-bjn",
    language: "Banjar",
    greeting: "Salamat Datang",
    meaning: "Welcome",
    isEnabled: true,
    displayOrder: 9,
    status: "published",
  },
  {
    id: "greet-ms",
    language: "Malay",
    greeting: "Selamat Datang",
    meaning: "Welcome",
    isEnabled: true,
    displayOrder: 10,
    status: "published",
  },
];
