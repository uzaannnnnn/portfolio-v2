import { createClient } from "@supabase/supabase-js";
import { getCmsStore } from "@/lib/database/cms-store";
import {
  INITIAL_ABOUT,
  INITIAL_ACTIVE_RESUME,
  INITIAL_HERO,
  INITIAL_PROFILE,
  INITIAL_SITE_SETTINGS,
} from "@/lib/database/fixtures";
import {
  SupabaseConnectionError,
  getRequiredSupabasePublicEnv,
} from "@/lib/supabase/errors";
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
    .map(
      ({
        screenshots: _s,
        caseStudySections: _c,
        architectureDiagram: _a,
        ...summary
      }) => summary,
    );
}

export interface FixtureRepositoryDataOverrides {
  projects?: ProjectDetail[];
  notes?: EngineeringNote[];
}

/**
 * Lightweight, read-only fixture adapter for local development and automated testing.
 * Strictly filters out draft/archived records just like the production database queries.
 * Accepts optional constructor overrides strictly for isolated unit/component testing.
 */
export class FixturePortfolioRepository implements PortfolioDataRepository {
  private readonly projectsOverride?: ProjectDetail[];
  private readonly notesOverride?: EngineeringNote[];

  constructor(overrides?: FixtureRepositoryDataOverrides) {
    this.projectsOverride = overrides?.projects;
    this.notesOverride = overrides?.notes;
  }

  private resolvePublishedProjects(): ProjectDetail[] {
    if (this.projectsOverride) {
      return this.projectsOverride.filter((p) => p.status === "published");
    }
    const store = getCmsStore();
    return store
      .listByType<ProjectDetail>("project")
      .filter((r) => r.status === "published" && r.publishedData !== null)
      .map((r) => r.publishedData!);
  }

  private resolvePublishedNotes(): EngineeringNote[] {
    if (this.notesOverride) {
      return this.notesOverride.filter((n) => n.status === "published");
    }
    const store = getCmsStore();
    return store
      .listByType<EngineeringNote>("note")
      .filter((r) => r.status === "published" && r.publishedData !== null)
      .map((r) => r.publishedData!);
  }

  async getPublicPortfolioBundle(): Promise<PublicPortfolioBundle> {
    const store = getCmsStore();
    const publishedProjects = filterPublishedProjects(
      this.resolvePublishedProjects(),
    );
    const featuredProjects = publishedProjects.filter(
      (project) => project.isFeatured,
    );

    const skillCategories: SkillCategory[] = store.skillCategories
      .filter((cat) => cat.isEnabled)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((category) => ({
        ...category,
        skills: category.skills
          .filter((skill) => skill.isEnabled && skill.status === "published")
          .sort((a, b) => a.displayOrder - b.displayOrder),
      }))
      .filter((category) => category.skills.length > 0);

    const experiences: ExperienceItem[] = store
      .listByType<ExperienceItem>("experience")
      .filter((exp) => exp.status === "published" && exp.publishedData !== null)
      .map((exp) => exp.publishedData!)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const educations: EducationItem[] = store
      .listByType<EducationItem>("education")
      .filter((edu) => edu.status === "published" && edu.publishedData !== null)
      .map((edu) => edu.publishedData!)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const certifications: CertificationItem[] = store
      .listByType<CertificationItem>("certification")
      .filter((cert) => cert.status === "published" && cert.publishedData !== null)
      .map((cert) => cert.publishedData!)
      .sort((a, b) => a.displayOrder - b.displayOrder);

    const notes: EngineeringNote[] = this.resolvePublishedNotes();

    const bootGreetings = filterAndSortPublicGreetings(store.bootGreetings);

    const publishedResume = store.resumeFiles.find(
      (r) => r.status === "published" && r.isActive,
    );
    const activeResume: ActiveResume | null =
      publishedResume ??
      (INITIAL_ACTIVE_RESUME && INITIAL_ACTIVE_RESUME.status === "published"
        ? INITIAL_ACTIVE_RESUME
        : null);

    const profileEntity = store.entities.get("profile:singleton");
    const settingsEntity = store.entities.get("site_settings:singleton");
    const heroEntity = store.entities.get("hero_content:singleton");
    const aboutEntity = store.entities.get("about_content:singleton");

    return {
      profile:
        profileEntity?.status === "published" && profileEntity.publishedData
          ? (profileEntity.publishedData as ProfileData)
          : INITIAL_PROFILE,
      siteSettings:
        settingsEntity?.status === "published" && settingsEntity.publishedData
          ? (settingsEntity.publishedData as SiteSettings)
          : INITIAL_SITE_SETTINGS,
      hero:
        heroEntity?.status === "published" && heroEntity.publishedData
          ? (heroEntity.publishedData as HeroContent)
          : INITIAL_HERO,
      about:
        aboutEntity?.status === "published" && aboutEntity.publishedData
          ? (aboutEntity.publishedData as AboutContent)
          : INITIAL_ABOUT,
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
    return filterPublishedProjects(this.resolvePublishedProjects());
  }

  async getPublishedProjectBySlug(slug: string): Promise<ProjectDetail | null> {
    const found = this.resolvePublishedProjects().find(
      (project) => project.slug === slug && project.status === "published",
    );
    return found ?? null;
  }

  async getPublishedNotes(): Promise<EngineeringNote[]> {
    return this.resolvePublishedNotes();
  }

  async getPublishedNoteBySlug(slug: string): Promise<EngineeringNote | null> {
    const found = this.resolvePublishedNotes().find(
      (note) => note.slug === slug && note.status === "published",
    );
    return found ?? null;
  }

  async getBootGreetings(): Promise<BootGreeting[]> {
    return filterAndSortPublicGreetings(getCmsStore().bootGreetings);
  }
}

/**
 * Production Supabase PostgreSQL adapter.
 * Never falls back silently to local fixtures:
 * - Throws SupabaseConfigurationError when environment variables are missing or invalid.
 * - Throws SupabaseConnectionError when database queries or network connections fail.
 */
export class SupabasePortfolioRepository implements PortfolioDataRepository {
  constructor(private readonly clientFactory?: () => ReturnType<typeof createClient>) {}

  private getClient() {
    const { url, anonKey } = getRequiredSupabasePublicEnv();
    if (this.clientFactory) {
      return this.clientFactory();
    }

    return createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  async getPublicPortfolioBundle(): Promise<PublicPortfolioBundle> {
    const client = this.getClient();

    let singletonRes;
    let categoriesRes;
    let projectsRes;
    let experiencesRes;
    let educationsRes;
    let certificationsRes;
    let notesRes;
    let greetingsRes;
    let resumeRes;

    try {
      [
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
    } catch (networkErr) {
      throw new SupabaseConnectionError(
        `SupabaseConnectionError: failed to reach Supabase PostgreSQL endpoint.`,
        networkErr,
      );
    }

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
      throw new SupabaseConnectionError(
        `SupabaseConnectionError: database query failed (${firstError.message}).`,
        firstError,
      );
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
      throw new SupabaseConnectionError(
        `SupabaseConnectionError: failed to fetch published projects (${error.message}).`,
        error,
      );
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
      throw new SupabaseConnectionError(
        `SupabaseConnectionError: failed to fetch project "${slug}" (${error.message}).`,
        error,
      );
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
      throw new SupabaseConnectionError(
        `SupabaseConnectionError: failed to fetch published notes (${error.message}).`,
        error,
      );
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
      throw new SupabaseConnectionError(
        `SupabaseConnectionError: failed to fetch note "${slug}" (${error.message}).`,
        error,
      );
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
      throw new SupabaseConnectionError(
        `SupabaseConnectionError: failed to fetch boot greetings (${error.message}).`,
        error,
      );
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
