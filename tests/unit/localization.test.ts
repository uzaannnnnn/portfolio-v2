import { describe, it, expect } from "vitest";
import {
  pickLocalizedText,
  pickLocalizedList,
  getProfileCompleteness,
  getHeroCompleteness,
  getAboutCompleteness,
  getProjectCompleteness,
  getExperienceCompleteness,
  getEducationCompleteness,
  getCertificationCompleteness,
  getNoteCompleteness,
  getSkillCategoryCompleteness,
  getBootGreetingCompleteness,
  getSiteSettingsCompleteness,
  STATIC_UI_DICTIONARY,
  formatLocalizedEmploymentType,
  formatLocalizedWorkSystem,
} from "@/lib/i18n/localization";
import type {
  ProfileData,
  HeroContent,
  AboutContent,
  ProjectDetail,
  ExperienceItem,
  EducationItem,
  CertificationItem,
  EngineeringNote,
  SkillCategory,
  BootGreeting,
  SiteSettings,
} from "@/types/portfolio";

describe("Manual Bilingual Localization Utility", () => {
  describe("pickLocalizedText fallback rules", () => {
    it("returns English when language is 'en'", () => {
      expect(pickLocalizedText("en", "Software Engineer", "Perekayasa Perangkat Lunak")).toBe(
        "Software Engineer",
      );
    });

    it("returns Indonesian when language is 'id' and Indonesian text exists", () => {
      expect(pickLocalizedText("id", "Software Engineer", "Perekayasa Perangkat Lunak")).toBe(
        "Perekayasa Perangkat Lunak",
      );
    });

    it("falls back to English when language is 'id' but Indonesian text is undefined", () => {
      expect(pickLocalizedText("id", "Software Engineer", undefined)).toBe("Software Engineer");
    });

    it("falls back to English when language is 'id' but Indonesian text is empty or whitespace", () => {
      expect(pickLocalizedText("id", "Software Engineer", "")).toBe("Software Engineer");
      expect(pickLocalizedText("id", "Software Engineer", "   ")).toBe("Software Engineer");
    });
  });

  describe("pickLocalizedList fallback rules", () => {
    const enList = ["Distributed Systems", "Spatial Indexing"];
    const idList = ["Sistem Terdistribusi", "Pengindeksan Spasial"];

    it("returns English list when language is 'en'", () => {
      expect(pickLocalizedList("en", enList, idList)).toEqual(enList);
    });

    it("returns Indonesian list when language is 'id' and list is non-empty", () => {
      expect(pickLocalizedList("id", enList, idList)).toEqual(idList);
    });

    it("falls back to English list when language is 'id' but Indonesian list is undefined or empty", () => {
      expect(pickLocalizedList("id", enList, undefined)).toEqual(enList);
      expect(pickLocalizedList("id", enList, [])).toEqual(enList);
      expect(pickLocalizedList("id", enList, ["   ", ""])).toEqual(enList);
    });
  });

  describe("Completeness Calculators", () => {
    it("calculates Profile completeness correctly", () => {
      const incompleteProfile: ProfileData = {
        fullName: "Muhamad Fauzan",
        professionalTitle: "Software Engineer",
        professionalTitleId: "Perekayasa Perangkat Lunak",
        tagline: "Building reliable software",
        taglineId: undefined,
        shortBio: "Bio in English",
        shortBioId: "Bio in Indonesian",
        location: "Jakarta",
        locationId: "Jakarta",
        email: "contact@example.com",
        githubUrl: "https://github.com",
        linkedinUrl: "https://linkedin.com",
        websiteUrl: "https://example.com",
        avatarUrl: null,
        availableForWork: true,
        availabilityNote: "Available",
        availabilityNoteId: "Tersedia",
      };

      const result = getProfileCompleteness(incompleteProfile);
      expect(result.enComplete).toBe(true);
      expect(result.idComplete).toBe(false);

      const completeProfile: ProfileData = {
        ...incompleteProfile,
        taglineId: "Membangun perangkat lunak andal",
      };
      const resultComplete = getProfileCompleteness(completeProfile);
      expect(resultComplete.idComplete).toBe(true);
    });

    it("calculates Hero completeness correctly", () => {
      const hero: HeroContent = {
        eyebrow: "Systems Engineering",
        eyebrowId: "Rekayasa Sistem",
        headline: "High-throughput architectures",
        headlineId: "Arsitektur throughput tinggi",
        supportingDescription: "Building mission-critical systems",
        supportingDescriptionId: "Membangun sistem misi kritis",
        primaryCtaLabel: "View Projects",
        primaryCtaLabelId: "Lihat Proyek",
        primaryCtaHref: "/projects",
        secondaryCtaLabel: "Contact",
        secondaryCtaLabelId: "Hubungi",
        secondaryCtaHref: "/contact",
        engineeringFocusAreas: ["Backend", "PostGIS"],
        engineeringFocusAreasId: ["Backend", "PostGIS"],
      };

      expect(getHeroCompleteness(hero).enComplete).toBe(true);
      expect(getHeroCompleteness(hero).idComplete).toBe(true);

      const missingHero: HeroContent = {
        ...hero,
        headlineId: "",
      };
      expect(getHeroCompleteness(missingHero).idComplete).toBe(false);
    });

    it("calculates About completeness including pillars", () => {
      const about: AboutContent = {
        introduction: "Intro EN",
        introductionId: "Intro ID",
        narrativeParagraphs: ["P1 EN", "P2 EN"],
        narrativeParagraphsId: ["P1 ID", "P2 ID"],
        engineeringPhilosophyTitle: "Philosophy EN",
        engineeringPhilosophyTitleId: "Filosofi ID",
        engineeringPhilosophySubtitle: "Subtitle EN",
        engineeringPhilosophySubtitleId: "Subjudul ID",
        coreDomains: ["Backend", "Cloud"],
        coreDomainsId: ["Backend", "Cloud"],
        engineeringPillars: [
          {
            id: "pillar-1",
            title: "Simplicity EN",
            titleId: "Kesederhanaan ID",
            summary: "Summary EN",
            summaryId: "Ringkasan ID",
            practices: ["Practice 1"],
          },
        ],
      };

      expect(getAboutCompleteness(about).enComplete).toBe(true);
      expect(getAboutCompleteness(about).idComplete).toBe(true);

      const basePillar = about.engineeringPillars[0]!;
      const missingPillarAbout: AboutContent = {
        ...about,
        engineeringPillars: [
          {
            ...basePillar,
            summaryId: "",
          },
        ],
      };
      expect(getAboutCompleteness(missingPillarAbout).idComplete).toBe(false);
    });

    it("calculates Project completeness including 14 case study sections", () => {
      const project: ProjectDetail = {
        id: "proj-1",
        slug: "test-proj",
        name: "Test Project",
        category: "Backend",
        categoryId: "Backend ID",
        description: "Desc EN",
        descriptionId: "Desc ID",
        projectCompletionState: "Production",
        projectCompletionStateId: "Produksi",
        technologies: ["Node", "TypeScript"],
        coverUrl: null,
        githubUrl: null,
        liveDemoUrl: null,
        status: "draft",
        isFeatured: false,
        displayOrder: 1,
        updatedAt: "2026-11-07",
        screenshots: [],
        caseStudySections: [
          {
            id: "sec-1",
            sectionType: "overview",
            title: "Overview EN",
            titleId: "Ringkasan ID",
            content: "Content EN",
            contentId: "Konten ID",
            displayOrder: 1,
            isEnabled: true,
          },
        ],
      };

      expect(getProjectCompleteness(project).enComplete).toBe(true);
      expect(getProjectCompleteness(project).idComplete).toBe(true);

      const baseSection = project.caseStudySections[0]!;
      const missingSecProject: ProjectDetail = {
        ...project,
        caseStudySections: [
          {
            ...baseSection,
            contentId: "",
          },
        ],
      };
      expect(getProjectCompleteness(missingSecProject).idComplete).toBe(false);
    });

    it("calculates Experience completeness", () => {
      const exp: ExperienceItem = {
        id: "exp-1",
        organization: "Tech Corp",
        role: "Senior Backend Engineer",
        roleId: "Perekayasa Backend Senior",
        startMonth: 1,
        startYear: 2024,
        endMonth: null,
        endYear: null,
        isCurrent: true,
        employmentType: "Full-time",
        workSystem: "Remote",
        location: "Jakarta",
        description: "Leading core API development",
        descriptionId: "Memimpin pengembangan API utama",
        responsibilities: ["Architected microservices"],
        responsibilitiesId: ["Merancang mikroservis"],
        technologies: ["Go", "PostgreSQL"],
        technicalContributions: [],
        achievements: [],
        status: "published",
        displayOrder: 1,
      };

      expect(getExperienceCompleteness(exp).enComplete).toBe(true);
      expect(getExperienceCompleteness(exp).idComplete).toBe(true);

      const incompleteExp: ExperienceItem = {
        ...exp,
        responsibilitiesId: [],
      };
      expect(getExperienceCompleteness(incompleteExp).idComplete).toBe(false);
    });

    it("calculates Education completeness", () => {
      const edu: EducationItem = {
        id: "edu-1",
        institution: "University",
        degree: "Bachelor of Science",
        degreeId: "Sarjana Komputer",
        major: "Informatics",
        majorId: "Informatika",
        startDate: "2020",
        endDate: "2024",
        isCurrent: false,
        gpa: "3.85",
        thesisTitle: "Distributed Indexing",
        thesisTitleId: "Pengindeksan Terdistribusi",
        defenseGrade: "A",
        description: "Focus on distributed systems",
        descriptionId: "Fokus pada sistem terdistribusi",
        status: "published",
        displayOrder: 1,
      };

      expect(getEducationCompleteness(edu).enComplete).toBe(true);
      expect(getEducationCompleteness(edu).idComplete).toBe(true);

      const missingEdu: EducationItem = {
        ...edu,
        degreeId: undefined,
      };
      expect(getEducationCompleteness(missingEdu).idComplete).toBe(false);
    });

    it("calculates Certification completeness", () => {
      const cert: CertificationItem = {
        id: "cert-1",
        name: "AWS Certified Solutions Architect",
        issuingOrganization: "Amazon Web Services",
        issueMonth: 6,
        issueYear: 2024,
        expirationMonth: 6,
        expirationYear: 2027,
        credentialId: "AWS-123456",
        credentialUrl: "https://aws.amazon.com/verify",
        certificateMediaUrl: null,
        description: "Cloud architecture verification",
        descriptionId: "Verifikasi arsitektur komputasi awan",
        status: "published",
        displayOrder: 1,
      };

      expect(getCertificationCompleteness(cert).enComplete).toBe(true);
      expect(getCertificationCompleteness(cert).idComplete).toBe(true);

      const missingCert: CertificationItem = {
        ...cert,
        descriptionId: undefined,
      };
      expect(getCertificationCompleteness(missingCert).idComplete).toBe(false);
    });

    it("calculates Note completeness", () => {
      const note: EngineeringNote = {
        id: "note-1",
        slug: "postgis-optimization",
        title: "PostGIS Spatial Optimization",
        titleId: "Optimalisasi Spasial PostGIS",
        category: "Databases",
        categoryId: "Basis Data",
        summary: "Techniques for accelerating spatial queries",
        summaryId: "Teknik percepatan kueri spasial",
        contentMdx: "# Content EN",
        contentMdxId: "# Konten ID",
        tags: ["PostGIS", "SQL"],
        publishedAt: "2026-05-01",
        seoTitle: null,
        seoDescription: null,
        coverImageUrl: null,
        status: "published",
      };

      expect(getNoteCompleteness(note).enComplete).toBe(true);
      expect(getNoteCompleteness(note).idComplete).toBe(true);

      const missingNote: EngineeringNote = {
        ...note,
        contentMdxId: "",
      };
      expect(getNoteCompleteness(missingNote).idComplete).toBe(false);
    });

    it("calculates Skill Category completeness", () => {
      const cat: SkillCategory = {
        id: "cat-1",
        slug: "backend",
        name: "Backend Development",
        nameId: "Pengembangan Backend",
        description: "Server architecture and databases",
        descriptionId: "Arsitektur server dan basis data",
        displayOrder: 1,
        isEnabled: true,
        skills: [],
      };

      expect(getSkillCategoryCompleteness(cat).enComplete).toBe(true);
      expect(getSkillCategoryCompleteness(cat).idComplete).toBe(true);

      const missingCat: SkillCategory = {
        ...cat,
        descriptionId: undefined,
      };
      expect(getSkillCategoryCompleteness(missingCat).idComplete).toBe(false);
    });

    it("calculates Boot Greeting completeness", () => {
      const greeting: BootGreeting = {
        id: "greet-1",
        language: "Sunda",
        greeting: "Sampurasun",
        meaning: "May peace be with you",
        meaningId: "Semoga keselamatan menyertai Anda",
        regionNote: "Traditional Sundanese greeting",
        regionNoteId: "Salam tradisional masyarakat Sunda",
        isEnabled: true,
        displayOrder: 1,
        status: "published",
      };

      expect(getBootGreetingCompleteness(greeting).enComplete).toBe(true);
      expect(getBootGreetingCompleteness(greeting).idComplete).toBe(true);

      const missingGreeting: BootGreeting = {
        ...greeting,
        regionNoteId: undefined,
      };
      expect(getBootGreetingCompleteness(missingGreeting).idComplete).toBe(false);
    });

    it("calculates Site Settings completeness", () => {
      const settings: SiteSettings = {
        siteTitle: "Muhamad Fauzan Portfolio",
        siteTitleId: "Portofolio Muhamad Fauzan",
        siteDescription: "Engineering portfolio",
        siteDescriptionId: "Portofolio rekayasa perangkat lunak",
        footerText: "All rights reserved",
        footerTextId: "Hak cipta dilindungi",
        canonicalBaseUrl: "https://example.com",
        homepageSectionOrder: ["hero", "about"],
        bootWelcome: {
          enabled: true,
          intervalMs: 1200,
          welcomeName: "Muhamad Fauzan",
          welcomeTitle: "Welcome",
          welcomeTitleId: "Selamat Datang",
          welcomeMessage: "System booted",
          welcomeMessageId: "Sistem dimuat",
        },
      };

      expect(getSiteSettingsCompleteness(settings).enComplete).toBe(true);
      expect(getSiteSettingsCompleteness(settings).idComplete).toBe(true);

      const missingSettings: SiteSettings = {
        ...settings,
        footerTextId: "",
        bootWelcome: {
          ...settings.bootWelcome,
          welcomeMessageId: "",
        },
      };
      expect(getSiteSettingsCompleteness(missingSettings).idComplete).toBe(false);
    });
  });

  describe("Bilingual CMS Workflow & Persistence", () => {
    const TEST_ADMIN = {
      adminId: "00000000-0000-4000-8000-000000000001",
      authUserId: "00000000-0000-4000-8000-000000000099",
      email: "admin@muhamadfauzan.dev",
      role: "admin" as const,
    };

    it("saves and publishes bilingual content independently without cross-overwriting", async () => {
      const { cmsEngines, getCmsStore, getAdminDashboardSnapshot } = await import(
        "@/lib/database/cms-store"
      );
      const { FixturePortfolioRepository } = await import("@/lib/database/repository");

      process.env.DATA_ADAPTER_MODE = "fixture";
      const store = getCmsStore();
      store.resetToDefaults();

      const snap = getAdminDashboardSnapshot();

      // 1. Save bilingual profile draft
      await cmsEngines.profile().saveDraft({
        admin: TEST_ADMIN,
        entityType: "profile",
        entityId: "singleton",
        draftPayload: {
          ...snap.profile.draftData,
          professionalTitle: "Staff Systems Engineer",
          professionalTitleId: "Perekayasa Sistem Senior",
          tagline: "High throughput distributed software",
          taglineId: "Perangkat lunak terdistribusi berkinerja tinggi",
        },
      });

      // Verify draft persistence
      let currentSnap = getAdminDashboardSnapshot();
      expect(currentSnap.profile.draftData.professionalTitle).toBe("Staff Systems Engineer");
      expect(currentSnap.profile.draftData.professionalTitleId).toBe("Perekayasa Sistem Senior");

      // 2. Edit English without touching Indonesian
      await cmsEngines.profile().saveDraft({
        admin: TEST_ADMIN,
        entityType: "profile",
        entityId: "singleton",
        draftPayload: {
          ...currentSnap.profile.draftData,
          professionalTitle: "Principal Distributed Systems Engineer",
        },
      });

      currentSnap = getAdminDashboardSnapshot();
      expect(currentSnap.profile.draftData.professionalTitle).toBe(
        "Principal Distributed Systems Engineer",
      );
      expect(currentSnap.profile.draftData.professionalTitleId).toBe("Perekayasa Sistem Senior"); // Preserved!

      // 3. Edit Indonesian without touching English
      await cmsEngines.profile().saveDraft({
        admin: TEST_ADMIN,
        entityType: "profile",
        entityId: "singleton",
        draftPayload: {
          ...currentSnap.profile.draftData,
          professionalTitleId: "Principal Distributed Systems Engineer (ID)",
        },
      });

      currentSnap = getAdminDashboardSnapshot();
      expect(currentSnap.profile.draftData.professionalTitle).toBe(
        "Principal Distributed Systems Engineer",
      ); // Preserved!
      expect(currentSnap.profile.draftData.professionalTitleId).toBe(
        "Principal Distributed Systems Engineer (ID)",
      );

      // 4. Publish draft and verify published data
      await cmsEngines.profile().publishDraft({
        admin: TEST_ADMIN,
        entityType: "profile",
        entityId: "singleton",
      });

      currentSnap = getAdminDashboardSnapshot();
      expect(currentSnap.profile.publishedData?.professionalTitle).toBe(
        "Principal Distributed Systems Engineer",
      );
      expect(currentSnap.profile.publishedData?.professionalTitleId).toBe(
        "Principal Distributed Systems Engineer (ID)",
      );

      // 5. Verify public repository picks up both versions and handles fallback
      const repo = new FixturePortfolioRepository();
      const bundle = await repo.getPublicPortfolioBundle();

      // English preference
      expect(
        pickLocalizedText(
          "en",
          bundle.profile.professionalTitle,
          bundle.profile.professionalTitleId,
        ),
      ).toBe("Principal Distributed Systems Engineer");

      // Indonesian preference
      expect(
        pickLocalizedText(
          "id",
          bundle.profile.professionalTitle,
          bundle.profile.professionalTitleId,
        ),
      ).toBe("Principal Distributed Systems Engineer (ID)");

      // Per-field fallback when Indonesian field is missing or empty
      expect(
        pickLocalizedText("id", bundle.profile.fullName, undefined),
      ).toBe(bundle.profile.fullName);
    });

    it("preserves GeoEntity, ClayCV, and SPK Bansos SAW strictly in draft status", async () => {
      const { getAdminDashboardSnapshot, getCmsStore } = await import(
        "@/lib/database/cms-store"
      );
      process.env.DATA_ADAPTER_MODE = "fixture";
      const store = getCmsStore();
      store.resetToDefaults();

      const snap = getAdminDashboardSnapshot();
      const geo = snap.projects.find((p) => p.draftData.slug === "geoentity");
      const clay = snap.projects.find((p) => p.draftData.slug === "claycv");
      const spk = snap.projects.find((p) => p.draftData.slug === "spk-bansos-saw");

      expect(geo?.status).toBe("draft");
      expect(clay?.status).toBe("draft");
      expect(spk?.status).toBe("draft");
    });
  });

  describe("UI Dictionary integrity", () => {
    it("has complete dictionary keys for both en and id", () => {
      expect(STATIC_UI_DICTIONARY.en.showcase.heading).toBe("Selected Engineering Work");
      expect(STATIC_UI_DICTIONARY.id.showcase.heading).toBe("Rekayasa Perangkat Lunak Pilihan");
      expect(STATIC_UI_DICTIONARY.en.experience.present).toBe("Present");
      expect(STATIC_UI_DICTIONARY.id.experience.present).toBe("Sekarang");
      expect(STATIC_UI_DICTIONARY.en.caseStudy.sourceRepository).toBe("Source Repository");
      expect(STATIC_UI_DICTIONARY.id.caseStudy.sourceRepository).toBe("Repositori Kode");
    });

    it("formats employment types and work systems accurately in Indonesian", () => {
      expect(formatLocalizedEmploymentType("Full-time", "id")).toBe("Penuh Waktu");
      expect(formatLocalizedEmploymentType("Internship", "id")).toBe("Magang");
      expect(formatLocalizedWorkSystem("Remote", "id")).toBe("Jarak Jauh (Remote)");
      expect(formatLocalizedWorkSystem("Hybrid", "id")).toBe("Hibrida");
      expect(formatLocalizedWorkSystem("Onsite", "id")).toBe("Di Kantor (On-site)");
    });
  });
});
