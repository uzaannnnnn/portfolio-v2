export type ContentStatus = "draft" | "published" | "archived";

export type LanguagePreference = "en" | "id";

export type HomepageSectionKey =
  | "hero"
  | "about"
  | "skills"
  | "featured_projects"
  | "experience"
  | "philosophy"
  | "education"
  | "certifications"
  | "contact";

export interface ProfileData {
  fullName: string;
  professionalTitle: string;
  professionalTitleId?: string;
  tagline: string;
  taglineId?: string;
  shortBio: string;
  shortBioId?: string;
  location: string;
  locationId?: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
  avatarUrl: string | null;
  availableForWork: boolean;
  availabilityNote: string;
  availabilityNoteId?: string;
  contactHeading?: string;
  contactHeadingId?: string;
  contactSupportText?: string;
  contactSupportTextId?: string;
}

export interface HeroContent {
  eyebrow: string;
  eyebrowId?: string;
  headline: string;
  headlineId?: string;
  supportingDescription: string;
  supportingDescriptionId?: string;
  primaryCtaLabel: string;
  primaryCtaLabelId?: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaLabelId?: string;
  secondaryCtaHref: string;
  engineeringFocusAreas: string[];
  engineeringFocusAreasId?: string[];
}

export interface EngineeringPillar {
  id: string;
  title: string;
  titleId?: string;
  summary: string;
  summaryId?: string;
  practices: string[];
  practicesId?: string[];
}

export interface AboutContent {
  introduction: string;
  introductionId?: string;
  narrativeParagraphs: string[];
  narrativeParagraphsId?: string[];
  engineeringPhilosophyTitle: string;
  engineeringPhilosophyTitleId?: string;
  engineeringPhilosophySubtitle: string;
  engineeringPhilosophySubtitleId?: string;
  engineeringPillars: EngineeringPillar[];
  coreDomains: string[];
  coreDomainsId?: string[];
}

export interface SkillItem {
  id: string;
  categoryId: string;
  name: string;
  proficiency?: "Core" | "Proficient" | "Working Knowledge" | "Exploring";
  isEnabled: boolean;
  displayOrder: number;
  status: ContentStatus;
}

export interface SkillCategory {
  id: string;
  name: string;
  nameId?: string;
  slug: string;
  description: string;
  descriptionId?: string;
  displayOrder: number;
  isEnabled: boolean;
  skills: SkillItem[];
}

export type CaseStudySectionType =
  | "overview"
  | "problem"
  | "objectives"
  | "solution"
  | "architecture"
  | "implementation"
  | "database"
  | "api"
  | "challenges"
  | "tradeoffs"
  | "testing"
  | "deployment"
  | "results"
  | "lessons";

export const CASE_STUDY_SECTION_LABELS: Record<CaseStudySectionType, string> = {
  overview: "Overview",
  problem: "Problem Statement",
  objectives: "Objectives",
  solution: "Proposed Solution",
  architecture: "System Architecture",
  implementation: "Technical Implementation",
  database: "Database Design",
  api: "API Design",
  challenges: "Engineering Challenges",
  tradeoffs: "Technical Decisions & Trade-offs",
  testing: "Testing & Quality Assurance",
  deployment: "Deployment & Infrastructure",
  results: "Results",
  lessons: "Lessons Learned",
};

export const CASE_STUDY_SECTION_LABELS_ID: Record<CaseStudySectionType, string> = {
  overview: "Ringkasan Proyek",
  problem: "Rumusan Masalah",
  objectives: "Tujuan & Kriteria Keberhasilan",
  solution: "Solusi yang Diusulkan",
  architecture: "Arsitektur Sistem",
  implementation: "Implementasi Teknis",
  database: "Perancangan Basis Data",
  api: "Desain API & Alur Backend",
  challenges: "Tantangan Rekayasa",
  tradeoffs: "Keputusan Teknis & Kompromi",
  testing: "Pengujian & Penjaminan Mutu",
  deployment: "Deployment & Infrastruktur",
  results: "Hasil & Status Proyek",
  lessons: "Pembelajaran & Pengembangan Lanjutan",
};

export interface ArchitectureNode {
  id: string;
  label: string;
  layer: "client" | "application" | "service" | "data" | "infrastructure";
  description: string;
  technologies?: string[];
}

export interface ArchitectureConnection {
  id: string;
  from: string;
  to: string;
  protocolOrAction: string;
}

export interface ArchitectureDiagramData {
  title: string;
  summary: string;
  nodes: ArchitectureNode[];
  connections: ArchitectureConnection[];
}

export interface CaseStudySection {
  id: string;
  sectionType: CaseStudySectionType;
  title: string;
  titleId?: string;
  content: string;
  contentId?: string;
  displayOrder: number;
  isEnabled: boolean;
}

export const TECHNOLOGY_CATEGORIES = [
  "FE",
  "BE",
  "DB",
  "API",
  "ARCHITECTURE",
  "DEVOPS & INFRA",
  "SOFTWARE QUALITY",
] as const;

export type TechnologyCategory = (typeof TECHNOLOGY_CATEGORIES)[number];

export interface CategorizedTechnologyItem {
  category: TechnologyCategory;
  name: string;
}

export interface ProjectSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  descriptionId?: string;
  version?: string;
  category?: string;
  categoryId?: string;
  technologies: string[];
  categorizedTechnologies?: CategorizedTechnologyItem[];
  coverUrl: string | null;
  githubUrl: string | null;
  liveDemoUrl: string | null;
  projectCompletionState: string;
  projectCompletionStateId?: string;
  status: ContentStatus;
  isFeatured: boolean;
  displayOrder: number;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectSummary {
  screenshots: { url: string; alt: string }[];
  architectureDiagram?: ArchitectureDiagramData | null;
  caseStudySections: CaseStudySection[];
}

export type EmploymentType = "Internship" | "Full-time" | "Part-time" | "Freelance" | "Contract";

export type WorkSystem = "Onsite" | "Remote" | "Hybrid";

export interface ExperienceItem {
  id: string;
  organization: string;
  role: string;
  roleId?: string;
  employmentType: EmploymentType;
  workSystem: WorkSystem;
  location: string;
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  isCurrent: boolean;
  description: string;
  descriptionId?: string;
  responsibilities: string[];
  responsibilitiesId?: string[];
  technicalContributions: string[];
  technicalContributionsId?: string[];
  achievements: string[];
  achievementsId?: string[];
  technologies: string[];
  displayOrder: number;
  status: ContentStatus;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  degreeId?: string;
  major: string;
  majorId?: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  gpa: string | null;
  thesisTitle: string | null;
  thesisTitleId?: string | null;
  defenseGrade: string | null;
  description: string | null;
  descriptionId?: string | null;
  displayOrder: number;
  status: ContentStatus;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuingOrganization: string;
  issueMonth: number;
  issueYear: number;
  expirationMonth: number | null;
  expirationYear: number | null;
  credentialId: string | null;
  credentialUrl: string | null;
  certificateMediaUrl: string | null;
  description: string | null;
  descriptionId?: string | null;
  displayOrder: number;
  status: ContentStatus;
}

export interface EngineeringNote {
  id: string;
  title: string;
  titleId?: string;
  slug: string;
  summary: string;
  summaryId?: string;
  contentMdx: string;
  contentMdxId?: string;
  coverImageUrl: string | null;
  category: string;
  categoryId?: string;
  tags: string[];
  publishedAt: string | null;
  seoTitle: string | null;
  seoTitleId?: string | null;
  seoDescription: string | null;
  seoDescriptionId?: string | null;
  status: ContentStatus;
}

export type HandwritingFontId =
  "dancing-script" | "caveat" | "alex-brush" | "sacramento" | "marck-script" | "allura";

export interface HandwritingFontOption {
  id: HandwritingFontId;
  name: string;
  category: string;
  file: string;
  family: string;
  sampleText: string;
}

export interface BootGreeting {
  id: string;
  language: string;
  greeting: string;
  meaning: string;
  meaningId?: string;
  regionNote?: string;
  regionNoteId?: string;
  isEnabled: boolean;
  displayOrder: number;
  status: ContentStatus;
}

export interface BootWelcomeConfig {
  enabled: boolean;
  intervalMs: number;
  welcomeName: string;
  welcomeTitle: string;
  welcomeTitleId?: string;
  welcomeMessage: string;
  welcomeMessageId?: string;
}

export interface ActiveResume {
  id: string;
  versionLabel: string;
  fileName: string;
  fileUrl: string | null;
  updatedAt: string;
  summaryNote: string;
  status: ContentStatus;
}

export interface SiteSettings {
  siteTitle: string;
  siteTitleId?: string;
  siteDescription: string;
  siteDescriptionId?: string;
  footerText?: string;
  footerTextId?: string;
  canonicalBaseUrl: string;
  homepageSectionOrder: HomepageSectionKey[];
  bootWelcome: BootWelcomeConfig;
}

export interface PublicPortfolioBundle {
  profile: ProfileData;
  siteSettings: SiteSettings;
  hero: HeroContent;
  about: AboutContent;
  skillCategories: SkillCategory[];
  featuredProjects: ProjectSummary[];
  allPublishedProjects: ProjectSummary[];
  experiences: ExperienceItem[];
  educations: EducationItem[];
  certifications: CertificationItem[];
  notes: EngineeringNote[];
  bootGreetings: BootGreeting[];
  activeResume: ActiveResume | null;
}
