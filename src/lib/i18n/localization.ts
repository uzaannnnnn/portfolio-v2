import type {
  AboutContent,
  BootGreeting,
  CertificationItem,
  EducationItem,
  EmploymentType,
  EngineeringNote,
  ExperienceItem,
  HeroContent,
  LanguagePreference,
  ProfileData,
  ProjectDetail,
  ProjectSummary,
  SiteSettings,
  SkillCategory,
  WorkSystem,
} from "@/types/portfolio";

export interface LanguageCompleteness {
  enComplete: boolean;
  idComplete: boolean;
  filledEnCount: number;
  totalEnCount: number;
  filledIdCount: number;
  totalIdCount: number;
  enLabel: "English Complete" | "English Incomplete";
  idLabel: "Indonesia Complete" | "Indonesia Incomplete";
}

export function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

export function hasList(list: string[] | null | undefined): boolean {
  return Array.isArray(list) && list.some((item) => hasText(item));
}

/**
 * Selects the localized string for the current language preference.
 * Falls back strictly per-field to the English value whenever the Indonesian value is empty or whitespace.
 */
export function pickLocalizedText(
  language: LanguagePreference,
  enValue: string | null | undefined,
  idValue?: string | null | undefined,
): string {
  const safeEn = typeof enValue === "string" ? enValue : "";
  if (language === "id" && hasText(idValue)) {
    return idValue!.trim();
  }
  return safeEn;
}

/**
 * Selects the localized string array for the current language preference.
 * Falls back strictly per-field to the English array when the Indonesian array has no non-empty items.
 */
export function pickLocalizedList(
  language: LanguagePreference,
  enList: string[] | null | undefined,
  idList?: string[] | null | undefined,
): string[] {
  const safeEn = Array.isArray(enList) ? enList : [];
  if (language === "id" && Array.isArray(idList)) {
    const cleaned = idList.map((item) => item.trim()).filter((item) => item.length > 0);
    if (cleaned.length > 0) {
      return cleaned;
    }
  }
  return safeEn;
}

export function buildCompleteness(
  enChecks: boolean[],
  idChecks: boolean[],
): LanguageCompleteness {
  const filledEnCount = enChecks.filter(Boolean).length;
  const totalEnCount = enChecks.length;
  const filledIdCount = idChecks.filter(Boolean).length;
  const totalIdCount = idChecks.length;
  const enComplete = totalEnCount === 0 || filledEnCount === totalEnCount;
  const idComplete = totalIdCount > 0 && filledIdCount === totalIdCount;

  return {
    enComplete,
    idComplete,
    filledEnCount,
    totalEnCount,
    filledIdCount,
    totalIdCount,
    enLabel: enComplete ? "English Complete" : "English Incomplete",
    idLabel: idComplete ? "Indonesia Complete" : "Indonesia Incomplete",
  };
}

export function getProfileCompleteness(profile: ProfileData): LanguageCompleteness {
  return buildCompleteness(
    [
      hasText(profile.professionalTitle),
      hasText(profile.tagline),
      hasText(profile.shortBio),
      hasText(profile.location),
      hasText(profile.availabilityNote),
    ],
    [
      hasText(profile.professionalTitleId),
      hasText(profile.taglineId),
      hasText(profile.shortBioId),
      hasText(profile.locationId),
      hasText(profile.availabilityNoteId),
    ],
  );
}

export function getHeroCompleteness(hero: HeroContent): LanguageCompleteness {
  return buildCompleteness(
    [
      hasText(hero.eyebrow),
      hasText(hero.headline),
      hasText(hero.supportingDescription),
      hasText(hero.primaryCtaLabel),
      hasText(hero.secondaryCtaLabel),
      hasList(hero.engineeringFocusAreas),
    ],
    [
      hasText(hero.eyebrowId),
      hasText(hero.headlineId),
      hasText(hero.supportingDescriptionId),
      hasText(hero.primaryCtaLabelId),
      hasText(hero.secondaryCtaLabelId),
      hasList(hero.engineeringFocusAreasId),
    ],
  );
}

export function getAboutCompleteness(about: AboutContent): LanguageCompleteness {
  const pillarEnChecks = about.engineeringPillars.flatMap((pillar) => [
    hasText(pillar.title),
    hasText(pillar.summary),
  ]);
  const pillarIdChecks = about.engineeringPillars.flatMap((pillar) => [
    hasText(pillar.titleId),
    hasText(pillar.summaryId),
  ]);

  return buildCompleteness(
    [
      hasText(about.introduction),
      hasList(about.narrativeParagraphs),
      hasText(about.engineeringPhilosophyTitle),
      hasText(about.engineeringPhilosophySubtitle),
      hasList(about.coreDomains),
      ...pillarEnChecks,
    ],
    [
      hasText(about.introductionId),
      hasList(about.narrativeParagraphsId),
      hasText(about.engineeringPhilosophyTitleId),
      hasText(about.engineeringPhilosophySubtitleId),
      hasList(about.coreDomainsId),
      ...pillarIdChecks,
    ],
  );
}

export function getProjectCompleteness(
  project: ProjectSummary | ProjectDetail,
): LanguageCompleteness {
  const detailSections =
    "caseStudySections" in project && Array.isArray(project.caseStudySections)
      ? project.caseStudySections
      : [];

  return buildCompleteness(
    [
      hasText(project.description),
      hasText(project.projectCompletionState),
      ...detailSections.map((sec) => hasText(sec.title) && hasText(sec.content)),
    ],
    [
      hasText(project.descriptionId),
      hasText(project.projectCompletionStateId),
      ...detailSections.map((sec) => hasText(sec.titleId) && hasText(sec.contentId)),
    ],
  );
}

export function getExperienceCompleteness(exp: ExperienceItem): LanguageCompleteness {
  return buildCompleteness(
    [
      hasText(exp.role),
      hasText(exp.description),
      hasList(exp.responsibilities),
    ],
    [
      hasText(exp.roleId),
      hasText(exp.descriptionId),
      hasList(exp.responsibilitiesId),
    ],
  );
}

export function getEducationCompleteness(edu: EducationItem): LanguageCompleteness {
  return buildCompleteness(
    [
      hasText(edu.degree),
      hasText(edu.major),
      hasText(edu.description),
    ],
    [
      hasText(edu.degreeId),
      hasText(edu.majorId),
      hasText(edu.descriptionId),
    ],
  );
}

export function getCertificationCompleteness(
  cert: CertificationItem,
): LanguageCompleteness {
  return buildCompleteness(
    [hasText(cert.description)],
    [hasText(cert.descriptionId)],
  );
}

export function getNoteCompleteness(note: EngineeringNote): LanguageCompleteness {
  return buildCompleteness(
    [
      hasText(note.title),
      hasText(note.category),
      hasText(note.summary),
      hasText(note.contentMdx),
    ],
    [
      hasText(note.titleId),
      hasText(note.categoryId),
      hasText(note.summaryId),
      hasText(note.contentMdxId),
    ],
  );
}

export function getBootGreetingCompleteness(
  greeting: BootGreeting,
): LanguageCompleteness {
  return buildCompleteness(
    [hasText(greeting.meaning), hasText(greeting.regionNote)],
    [hasText(greeting.meaningId), hasText(greeting.regionNoteId)],
  );
}

export function getSiteSettingsCompleteness(
  settings: SiteSettings,
): LanguageCompleteness {
  return buildCompleteness(
    [
      hasText(settings.siteTitle),
      hasText(settings.siteDescription),
      hasText(settings.bootWelcome?.welcomeTitle),
      hasText(settings.bootWelcome?.welcomeMessage),
    ],
    [
      hasText(settings.siteTitleId),
      hasText(settings.siteDescriptionId),
      hasText(settings.bootWelcome?.welcomeTitleId),
      hasText(settings.bootWelcome?.welcomeMessageId),
    ],
  );
}

export function getSkillCategoryCompleteness(
  category: SkillCategory,
): LanguageCompleteness {
  return buildCompleteness(
    [hasText(category.name), hasText(category.description)],
    [hasText(category.nameId), hasText(category.descriptionId)],
  );
}

export const STATIC_UI_DICTIONARY = {
  en: {
    me: {
      eyebrow: "01 / Me",
      educationHeading: "Education",
      gpaLabel: "GPA",
      thesisLabel: "Thesis",
    },
    experience: {
      eyebrow: "02 / Experience",
      heading: "Career Trajectory",
      present: "Present",
      empty: "No published experience entries yet.",
    },
    showcase: {
      eyebrow: "03 / Showcase",
      heading: "Selected Engineering Work",
      archiveLink: "Full Archive",
      empty: "No published projects yet.",
      caseStudyLink: "Case Study",
      liveSiteLink: "Live Site",
      sourceLink: "Source",
    },
    certifications: {
      eyebrow: "04 / Certifications",
      heading: "Credentials & Verification",
      empty: "No published certifications yet.",
      issuedPrefix: "Issued",
      expiresPrefix: "Expires",
      credentialIdPrefix: "ID",
      verifyLink: "Verify",
    },
    contact: {
      eyebrow: "05 / Contact",
      defaultHeading: "Start a Conversation.",
      defaultSupportText:
        "Available for backend, full-stack, and geospatial engineering roles or consulting inquiries.",
      emailLabel: "Email",
      githubLabel: "GitHub",
      linkedinLabel: "LinkedIn",
      resumeLabel: "Resume",
    },
    projectsDirectory: {
      eyebrow: "Engineering Dossiers",
      heading: "System Case Studies & Architecture",
      subtitle:
        "Every project below is documented with a 14-section architectural breakdown: problem statement, trade-offs, system topology, data model, security posture, and engineering lessons learned.",
      allCategories: "All Categories",
      searchPlaceholder: "Search by project, stack, or domain...",
      showingPrefix: "Showing",
      ofConnector: "of",
      publishedSystemsSuffix: "published systems",
      featuredBadge: "Featured Case Study",
      readDossierCta: "Read Full 14-Section Dossier",
      emptyFilter: "No projects match the current filter criteria.",
      resetFilters: "Reset Filters",
    },
    caseStudy: {
      backToShowcase: "Back to Showcase",
      liveDeployment: "Live Deployment",
      sourceRepository: "Source Repository",
      completionState: "Completion State",
      primaryStack: "Primary Stack",
      architectureBlueprint: "14-Section Architecture Blueprint",
      contentsHeading: "Dossier Contents",
      nextCaseStudy: "Next Case Study",
      allProjects: "All Projects",
    },
    notesDirectory: {
      eyebrow: "Engineering Notes",
      heading: "Technical Essays & Architecture Logs",
      subtitle:
        "Long-form notes on distributed systems, PostGIS spatial indexing, deterministic algorithms, and software craftsmanship.",
      readNoteCta: "Read Note",
      empty: "No published engineering notes yet.",
      backToNotes: "Back to Engineering Notes",
      publishedOn: "Published",
    },
  },
  id: {
    me: {
      eyebrow: "01 / Tentang Saya",
      educationHeading: "Pendidikan",
      gpaLabel: "IPK",
      thesisLabel: "Skripsi",
    },
    experience: {
      eyebrow: "02 / Pengalaman",
      heading: "Perjalanan Karier",
      present: "Sekarang",
      empty: "Belum ada data pengalaman yang dipublikasikan.",
    },
    showcase: {
      eyebrow: "03 / Karya Pilihan",
      heading: "Rekayasa Perangkat Lunak Pilihan",
      archiveLink: "Arsip Lengkap",
      empty: "Belum ada proyek yang dipublikasikan.",
      caseStudyLink: "Studi Kasus",
      liveSiteLink: "Situs Langsung",
      sourceLink: "Kode Sumber",
    },
    certifications: {
      eyebrow: "04 / Sertifikasi",
      heading: "Kredensial & Verifikasi",
      empty: "Belum ada sertifikasi yang dipublikasikan.",
      issuedPrefix: "Diterbitkan",
      expiresPrefix: "Berlaku hingga",
      credentialIdPrefix: "ID",
      verifyLink: "Verifikasi",
    },
    contact: {
      eyebrow: "05 / Kontak",
      defaultHeading: "Mari Berdiskusi.",
      defaultSupportText:
        "Terbuka untuk peluang rekayasa backend, full-stack, sistem geospasial, maupun kolaborasi teknis.",
      emailLabel: "Surel",
      githubLabel: "GitHub",
      linkedinLabel: "LinkedIn",
      resumeLabel: "CV / Resume",
    },
    projectsDirectory: {
      eyebrow: "Dokumen Rekayasa",
      heading: "Studi Kasus Sistem & Arsitektur",
      subtitle:
        "Setiap proyek didokumentasikan melalui rincian arsitektur 14 bagian: rumusan masalah, kompromi teknis, topologi sistem, model data, keamanan, serta pembelajaran rekayasa.",
      allCategories: "Semua Kategori",
      searchPlaceholder: "Cari berdasarkan nama proyek, teknologi, atau domain...",
      showingPrefix: "Menampilkan",
      ofConnector: "dari",
      publishedSystemsSuffix: "sistem terpublikasi",
      featuredBadge: "Studi Kasus Utama",
      readDossierCta: "Baca Dokumen Arsitektur 14 Bagian",
      emptyFilter: "Tidak ada proyek yang sesuai dengan kriteria pencarian.",
      resetFilters: "Atur Ulang Filter",
    },
    caseStudy: {
      backToShowcase: "Kembali ke Karya",
      liveDeployment: "Aplikasi Langsung",
      sourceRepository: "Repositori Kode",
      completionState: "Status Penyelesaian",
      primaryStack: "Teknologi Utama",
      architectureBlueprint: "Cetak Biru Arsitektur 14 Bagian",
      contentsHeading: "Daftar Isi Dokumen",
      nextCaseStudy: "Studi Kasus Berikutnya",
      allProjects: "Semua Proyek",
    },
    notesDirectory: {
      eyebrow: "Catatan Rekayasa",
      heading: "Esai Teknis & Catatan Arsitektur",
      subtitle:
        "Tulisan mendalam mengenai sistem terdistribusi, indeks spasial PostGIS, algoritma deterministik, dan kualitas perangkat lunak.",
      readNoteCta: "Baca Catatan",
      empty: "Belum ada catatan rekayasa yang dipublikasikan.",
      backToNotes: "Kembali ke Catatan Rekayasa",
      publishedOn: "Dipublikasikan",
    },
  },
} as const;

const MONTHS_EN: Record<string, string> = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "May",
  "06": "Jun",
  "07": "Jul",
  "08": "Aug",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Dec",
};

const MONTHS_ID: Record<string, string> = {
  "01": "Jan",
  "02": "Feb",
  "03": "Mar",
  "04": "Apr",
  "05": "Mei",
  "06": "Jun",
  "07": "Jul",
  "08": "Agu",
  "09": "Sep",
  "10": "Okt",
  "11": "Nov",
  "12": "Des",
};

export function formatLocalizedMonth(
  dateStr: string | null,
  language: LanguagePreference,
): string {
  if (!dateStr) {
    return STATIC_UI_DICTIONARY[language].experience.present;
  }
  const [year, month] = dateStr.split("-");
  if (!year || !month) return dateStr;
  const map = language === "id" ? MONTHS_ID : MONTHS_EN;
  return `${map[month] ?? month} ${year}`;
}

export function formatLocalizedEmploymentType(
  type: EmploymentType,
  language: LanguagePreference,
): string {
  const labels: Record<LanguagePreference, Record<EmploymentType, string>> = {
    en: {
      "Full-time": "Full-time",
      "Part-time": "Part-time",
      Contract: "Contract",
      Internship: "Internship",
      Freelance: "Freelance",
    },
    id: {
      "Full-time": "Penuh Waktu",
      "Part-time": "Paruh Waktu",
      Contract: "Kontrak",
      Internship: "Magang",
      Freelance: "Lepas (Freelance)",
    },
  };
  return labels[language][type] ?? type;
}

export function formatLocalizedWorkSystem(
  system: WorkSystem,
  language: LanguagePreference,
): string {
  const labels: Record<LanguagePreference, Record<WorkSystem, string>> = {
    en: {
      Onsite: "On-site",
      Hybrid: "Hybrid",
      Remote: "Remote",
    },
    id: {
      Onsite: "Di Kantor (On-site)",
      Hybrid: "Hibrida",
      Remote: "Jarak Jauh (Remote)",
    },
  };
  return labels[language][system] ?? system;
}
