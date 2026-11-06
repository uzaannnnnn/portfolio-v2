import { createClient } from "@supabase/supabase-js";
import {
  INITIAL_ABOUT,
  INITIAL_ACTIVE_RESUME,
  INITIAL_BOOT_GREETINGS,
  INITIAL_CERTIFICATIONS,
  INITIAL_EDUCATIONS,
  INITIAL_EXPERIENCES,
  INITIAL_HERO,
  INITIAL_NOTES,
  INITIAL_PROFILE,
  INITIAL_PROJECTS,
  INITIAL_SITE_SETTINGS,
  INITIAL_SKILL_CATEGORIES,
} from "@/lib/database/fixtures";
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
  ProjectSummary,
  PublicPortfolioBundle,
  SiteSettings,
  SkillCategory,
} from "@/types/portfolio";

export interface PortfolioDataRepository {
  getPublicPortfolioBundle(): Promise<PublicPortfolioBundle>;
  getPublishedProjects(): Promise<ProjectSummary[]>;
  getPublishedProjectBySlug(slug: string): Promise<ProjectDetail | null>;
  getPublishedNotes(): Promise<EngineeringNote[]>;
  getPublishedNoteBySlug(slug: string): Promise<EngineeringNote | null>;
  getBootGreetings(): Promise<BootGreeting[]>;
}

/**
 * Sorts and filters boot greetings so only published & enabled entries appear publicly,
 * ordered by displayOrder ascending.
 */
export function filterAndSortPublicGreetings(greetings: BootGreeting[]): BootGreeting[] {
  return greetings
    .filter((item) => item.status === "published" && item.isEnabled)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Filters projects so only published projects are returned to anonymous visitors.
 * Rule 4: Anonymous visitors must never see unpublished content.
 */
export function filterPublishedProjects(projects: ProjectDetail[]): ProjectSummary[] {
  return projects
    .filter((project) => project.status === "published")
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(({ screenshots: _s, caseStudySections: _c, ...summary }) => summary);
}

/**
 * Lightweight, read-only fixture adapter for local development and automated testing.
 * Strictly filters out draft/archived records just like the production database queries.
 */
export class FixturePortfolioRepository implements PortfolioDataRepository {
  async getPublicPortfolioBundle(): Promise<PublicPortfolioBundle> {
    const publishedProjects = filterPublishedProjects(INITIAL_PROJECTS);
    const featuredProjects = publishedProjects.filter((project) => project.isFeatured);

    const skillCategories: SkillCategory[] = INITIAL_SKILL_CATEGORIES.filter(
      (cat) => cat.isEnabled,
    )
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((category) => ({
        ...category,
        skills: category.skills
          .filter((skill) => skill.isEnabled && skill.status === "published")
          .sort((a, b) => a.displayOrder - b.displayOrder),
      }))
      .filter((category) => category.skills.length > 0);

    const experiences: ExperienceItem[] = INITIAL_EXPERIENCES.filter(
      (exp) => exp.status === "published",
    ).sort((a, b) => a.displayOrder - b.displayOrder);

    const educations: EducationItem[] = INITIAL_EDUCATIONS.filter(
      (edu) => edu.status === "published",
    ).sort((a, b) => a.displayOrder - b.displayOrder);

    const certifications: CertificationItem[] = INITIAL_CERTIFICATIONS.filter(
      (cert) => cert.status === "published",
    ).sort((a, b) => a.displayOrder - b.displayOrder);

    const notes: EngineeringNote[] = INITIAL_NOTES.filter(
      (note) => note.status === "published",
    );

    const bootGreetings = filterAndSortPublicGreetings(INITIAL_BOOT_GREETINGS);

    const activeResume: ActiveResume | null =
      INITIAL_ACTIVE_RESUME && INITIAL_ACTIVE_RESUME.status === "published"
        ? INITIAL_ACTIVE_RESUME
        : null;

    return {
      profile: INITIAL_PROFILE,
      siteSettings: INITIAL_SITE_SETTINGS,
      hero: INITIAL_HERO,
      about: INITIAL_ABOUT,
      skillCategories,
      featuredProjects,
      allPublishedProjects: publishedProjects,
      experiences,
      educations,
      certifications,
      notes,
      bootGreetings,
      activeResume,
    };
  }

  async getPublishedProjects(): Promise<ProjectSummary[]> {
    return filterPublishedProjects(INITIAL_PROJECTS);
  }

  async getPublishedProjectBySlug(slug: string): Promise<ProjectDetail | null> {
    const found = INITIAL_PROJECTS.find(
      (project) => project.slug === slug && project.status === "published",
    );
    return found ?? null;
  }

  async getPublishedNotes(): Promise<EngineeringNote[]> {
    return INITIAL_NOTES.filter((note) => note.status === "published");
  }

  async getPublishedNoteBySlug(slug: string): Promise<EngineeringNote | null> {
    const found = INITIAL_NOTES.find(
      (note) => note.slug === slug && note.status === "published",
    );
    return found ?? null;
  }

  async getBootGreetings(): Promise<BootGreeting[]> {
    return filterAndSortPublicGreetings(INITIAL_BOOT_GREETINGS);
  }
}

/**
 * Production Supabase PostgreSQL adapter.
 * Never falls back silently to local fixtures: if credentials are missing or a database error occurs,
 * it throws an explicit error so operational issues are immediately visible.
 */
export class SupabasePortfolioRepository implements PortfolioDataRepository {
  private getClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "SupabasePortfolioRepository error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be configured when DATA_ADAPTER_MODE=supabase.",
      );
    }

    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });
  }

  async getPublicPortfolioBundle(): Promise<PublicPortfolioBundle> {
    const client = this.getClient();

    const [
      singletonRes,
      categoriesRes,
      projectsRes,
      experiencesRes,
      educationsRes,
      certificationsRes,
      notesRes,
      greetingsRes,
      resumeRes,
    ] = await Promise.all([
      client
        .from("singleton_configs")
        .select("key, published_data")
        .eq("status", "published"),
      client
        .from("skill_categories")
        .select("id, name, slug, description, display_order, is_enabled, skills(id, category_id, name, proficiency, is_enabled, display_order, status)")
        .eq("is_enabled", true)
        .order("display_order", { ascending: true }),
      client
        .from("projects")
        .select("published_data")
        .eq("status", "published")
        .order("display_order", { ascending: true }),
      client
        .from("experiences")
        .select("published_data")
        .eq("status", "published")
        .order("display_order", { ascending: true }),
      client
        .from("educations")
        .select("published_data")
        .eq("status", "published")
        .order("display_order", { ascending: true }),
      client
        .from("certifications")
        .select("published_data")
        .eq("status", "published")
        .order("display_order", { ascending: true }),
      client
        .from("notes")
        .select("published_data")
        .eq("status", "published")
        .order("display_order", { ascending: true }),
      client
        .from("boot_greetings")
        .select("id, language, greeting, meaning, is_enabled, display_order, status")
        .eq("status", "published")
        .eq("is_enabled", true)
        .order("display_order", { ascending: true }),
      client
        .from("resume_files")
        .select("id, version_label, file_name, file_url, published_at, summary_note, status")
        .eq("status", "published")
        .eq("is_active", true)
        .maybeSingle(),
    ]);

    const firstError =
      singletonRes.error ||
      categoriesRes.error ||
      projectsRes.error ||
      experiencesRes.error ||
      educationsRes.error ||
      certificationsRes.error ||
      notesRes.error ||
      greetingsRes.error ||
      resumeRes.error;

    if (firstError) {
      throw new Error(`Supabase query failed: ${firstError.message}`);
    }

    const configMap = new Map<string, unknown>();
    for (const row of singletonRes.data ?? []) {
      configMap.set(row.key as string, row.published_data);
    }

    const profile = (configMap.get("profile") as ProfileData | undefined) ?? INITIAL_PROFILE;
    const siteSettings =
      (configMap.get("site_settings") as SiteSettings | undefined) ?? INITIAL_SITE_SETTINGS;
    const hero = (configMap.get("hero_content") as HeroContent | undefined) ?? INITIAL_HERO;
    const about = (configMap.get("about_content") as AboutContent | undefined) ?? INITIAL_ABOUT;

    const skillCategories: SkillCategory[] = (categoriesRes.data ?? []).map((cat) => ({
      id: String(cat.id),
      name: String(cat.name),
      slug: String(cat.slug),
      description: String(cat.description ?? ""),
      displayOrder: Number(cat.display_order ?? 0),
      isEnabled: Boolean(cat.is_enabled),
      skills: Array.isArray(cat.skills)
        ? cat.skills
            .filter((s) => Boolean(s.is_enabled) && s.status === "published")
            .map((s) => ({
              id: String(s.id),
              categoryId: String(s.category_id),
              name: String(s.name),
              proficiency: s.proficiency as SkillCategory["skills"][number]["proficiency"],
              isEnabled: Boolean(s.is_enabled),
              displayOrder: Number(s.display_order ?? 0),
              status: "published" as const,
            }))
            .sort((a, b) => a.displayOrder - b.displayOrder)
        : [],
    }));

    const allPublishedProjects: ProjectSummary[] = (projectsRes.data ?? []).map(
      (row) => row.published_data as ProjectSummary,
    );

    const featuredProjects = allPublishedProjects.filter((p) => p.isFeatured);

    return {
      profile,
      siteSettings,
      hero,
      about,
      skillCategories,
      featuredProjects,
      allPublishedProjects,
      experiences: (experiencesRes.data ?? []).map((r) => r.published_data as ExperienceItem),
      educations: (educationsRes.data ?? []).map((r) => r.published_data as EducationItem),
      certifications: (certificationsRes.data ?? []).map(
        (r) => r.published_data as CertificationItem,
      ),
      notes: (notesRes.data ?? []).map((r) => r.published_data as EngineeringNote),
      bootGreetings: (greetingsRes.data ?? []).map((g) => ({
        id: String(g.id),
        language: String(g.language),
        greeting: String(g.greeting),
        meaning: String(g.meaning),
        isEnabled: Boolean(g.is_enabled),
        displayOrder: Number(g.display_order ?? 0),
        status: "published" as const,
      })),
      activeResume: resumeRes.data
        ? {
            id: String(resumeRes.data.id),
            versionLabel: String(resumeRes.data.version_label),
            fileName: String(resumeRes.data.file_name),
            fileUrl: resumeRes.data.file_url ? String(resumeRes.data.file_url) : null,
            updatedAt: String(resumeRes.data.published_at ?? ""),
            summaryNote: String(resumeRes.data.summary_note ?? ""),
            status: "published",
          }
        : null,
    };
  }

  async getPublishedProjects(): Promise<ProjectSummary[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from("projects")
      .select("published_data")
      .eq("status", "published")
      .order("display_order", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch published projects: ${error.message}`);
    }

    return (data ?? []).map((row) => row.published_data as ProjectSummary);
  }

  async getPublishedProjectBySlug(slug: string): Promise<ProjectDetail | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from("projects")
      .select("published_data")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch project by slug "${slug}": ${error.message}`);
    }

    return data ? (data.published_data as ProjectDetail) : null;
  }

  async getPublishedNotes(): Promise<EngineeringNote[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from("notes")
      .select("published_data")
      .eq("status", "published")
      .order("display_order", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch published notes: ${error.message}`);
    }

    return (data ?? []).map((row) => row.published_data as EngineeringNote);
  }

  async getPublishedNoteBySlug(slug: string): Promise<EngineeringNote | null> {
    const client = this.getClient();
    const { data, error } = await client
      .from("notes")
      .select("published_data")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch note by slug "${slug}": ${error.message}`);
    }

    return data ? (data.published_data as EngineeringNote) : null;
  }

  async getBootGreetings(): Promise<BootGreeting[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from("boot_greetings")
      .select("id, language, greeting, meaning, is_enabled, display_order, status")
      .eq("status", "published")
      .eq("is_enabled", true)
      .order("display_order", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch boot greetings: ${error.message}`);
    }

    return (data ?? []).map((g) => ({
      id: String(g.id),
      language: String(g.language),
      greeting: String(g.greeting),
      meaning: String(g.meaning),
      isEnabled: Boolean(g.is_enabled),
      displayOrder: Number(g.display_order ?? 0),
      status: "published" as const,
    }));
  }
}

/**
 * Resolves the active repository implementation.
 * - When DATA_ADAPTER_MODE="supabase", strictly uses SupabasePortfolioRepository and never falls back silently.
 * - When DATA_ADAPTER_MODE="fixture" (or unset in local/test environments without DATA_ADAPTER_MODE="supabase"),
 *   uses FixturePortfolioRepository.
 */
export function getPortfolioRepository(
  modeOverride?: "supabase" | "fixture",
): PortfolioDataRepository {
  const mode = modeOverride ?? process.env.DATA_ADAPTER_MODE ?? "fixture";

  if (mode === "supabase") {
    return new SupabasePortfolioRepository();
  }

  if (mode === "fixture") {
    return new FixturePortfolioRepository();
  }

  throw new Error(
    `Invalid DATA_ADAPTER_MODE "${mode}". Expected "supabase" or "fixture".`,
  );
}
