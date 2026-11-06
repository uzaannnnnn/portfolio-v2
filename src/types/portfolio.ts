export type ContentStatus = "draft" | "published" | "archived";

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
  tagline: string;
  shortBio: string;
  location: string;
  email: string;
  githubUrl: string;
  linkedinUrl: string;
  websiteUrl: string;
  avatarUrl: string | null;
  availableForWork: boolean;
  availabilityNote: string;
}

export interface HeroContent {
  eyebrow: string;
  headline: string;
  supportingDescription: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  engineeringFocusAreas: string[];
}

export interface EngineeringPillar {
  id: string;
  title: string;
  summary: string;
  practices: string[];
}

export interface AboutContent {
  introduction: string;
  narrativeParagraphs: string[];
  engineeringPhilosophyTitle: string;
  engineeringPhilosophySubtitle: string;
  engineeringPillars: EngineeringPillar[];
  coreDomains: string[];
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
  slug: string;
  description: string;
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

export interface CaseStudySection {
  id: string;
  sectionType: CaseStudySectionType;
  title: string;
  content: string;
  displayOrder: number;
  isEnabled: boolean;
}

export interface ProjectSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  technologies: string[];
  coverUrl: string | null;
  githubUrl: string | null;
  liveDemoUrl: string | null;
  projectCompletionState: string;
  status: ContentStatus;
  isFeatured: boolean;
  displayOrder: number;
  updatedAt: string;
}

export interface ProjectDetail extends ProjectSummary {
  screenshots: { url: string; alt: string }[];
  caseStudySections: CaseStudySection[];
}

export type EmploymentType =
  | "Internship"
  | "Full-time"
  | "Part-time"
  | "Freelance"
  | "Contract";

export type WorkSystem = "Onsite" | "Remote" | "Hybrid";

export interface ExperienceItem {
  id: string;
  organization: string;
  role: string;
  employmentType: EmploymentType;
  workSystem: WorkSystem;
  location: string;
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  isCurrent: boolean;
  description: string;
  responsibilities: string[];
  technicalContributions: string[];
  achievements: string[];
  technologies: string[];
  displayOrder: number;
  status: ContentStatus;
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  major: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
  gpa: string | null;
  thesisTitle: string | null;
  defenseGrade: string | null;
  description: string | null;
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
  displayOrder: number;
  status: ContentStatus;
}

export interface EngineeringNote {
  id: string;
  title: string;
  slug: string;
  summary: string;
  contentMdx: string;
  coverImageUrl: string | null;
  category: string;
  tags: string[];
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: ContentStatus;
}

export interface BootGreeting {
  id: string;
  language: string;
  greeting: string;
  meaning: string;
  isEnabled: boolean;
  displayOrder: number;
  status: ContentStatus;
}

export interface BootWelcomeConfig {
  enabled: boolean;
  intervalMs: number;
  welcomeName: string;
  welcomeTitle: string;
  welcomeMessage: string;
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
  siteDescription: string;
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
