-- ============================================================================
-- Seed Data: supabase/seed.sql
-- Purpose: Safe initial development seed data for Muhamad Fauzan Portfolio CMS.
-- IMPORTANT:
--   - GeoEntity, ClayCV, and SPK Bansos SAW are seeded strictly as DRAFT
--     (status = 'draft', published_data = NULL).
--   - Never seeds real credentials or secrets.
--   - Never fabricates experience, education, or certification claims.
-- ============================================================================

-- 1. Singleton Configurations (Profile, Site Settings, Hero, About)
INSERT INTO public.singleton_configs (key, status, published_data, draft_data, published_at)
VALUES
  (
    'profile',
    'published',
    '{
      "fullName": "Muhamad Fauzan",
      "professionalTitle": "Software Engineer",
      "tagline": "Building software that solves real-world problems.",
      "shortBio": "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
      "location": "Indonesia",
      "email": "",
      "githubUrl": "https://github.com/uzaannnnnn",
      "linkedinUrl": "",
      "websiteUrl": "http://localhost:3000",
      "avatarUrl": null,
      "availableForWork": true,
      "availabilityNote": "Open to software engineering roles and technical collaborations."
    }'::jsonb,
    '{
      "fullName": "Muhamad Fauzan",
      "professionalTitle": "Software Engineer",
      "tagline": "Building software that solves real-world problems.",
      "shortBio": "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
      "location": "Indonesia",
      "email": "",
      "githubUrl": "https://github.com/uzaannnnnn",
      "linkedinUrl": "",
      "websiteUrl": "http://localhost:3000",
      "avatarUrl": null,
      "availableForWork": true,
      "availabilityNote": "Open to software engineering roles and technical collaborations."
    }'::jsonb,
    NOW()
  ),
  (
    'site_settings',
    'published',
    '{
      "siteTitle": "Muhamad Fauzan — Software Engineer",
      "siteDescription": "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
      "canonicalBaseUrl": "http://localhost:3000",
      "homepageSectionOrder": [
        "hero",
        "about",
        "skills",
        "featured_projects",
        "experience",
        "philosophy",
        "education",
        "certifications",
        "contact"
      ],
      "bootWelcome": {
        "enabled": true,
        "intervalMs": 1650,
        "welcomeName": "Muhamad Fauzan",
        "welcomeTitle": "Software Engineer",
        "welcomeMessage": "Welcome to my portfolio."
      }
    }'::jsonb,
    '{
      "siteTitle": "Muhamad Fauzan — Software Engineer",
      "siteDescription": "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
      "canonicalBaseUrl": "http://localhost:3000",
      "homepageSectionOrder": [
        "hero",
        "about",
        "skills",
        "featured_projects",
        "experience",
        "philosophy",
        "education",
        "certifications",
        "contact"
      ],
      "bootWelcome": {
        "enabled": true,
        "intervalMs": 1650,
        "welcomeName": "Muhamad Fauzan",
        "welcomeTitle": "Software Engineer",
        "welcomeMessage": "Welcome to my portfolio."
      }
    }'::jsonb,
    NOW()
  ),
  (
    'hero_content',
    'published',
    '{
      "eyebrow": "Software Engineering Portfolio",
      "headline": "Building software that solves real-world problems.",
      "supportingDescription": "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
      "primaryCtaLabel": "Explore Engineering Work",
      "primaryCtaHref": "#projects",
      "secondaryCtaLabel": "Get in Touch",
      "secondaryCtaHref": "/contact",
      "engineeringFocusAreas": [
        "Software Engineering Fundamentals",
        "Frontend & Full-Stack Architecture",
        "Backend & API Engineering",
        "Relational Database Design",
        "Automated Testing & Verification",
        "Deployment & AI Integration"
      ]
    }'::jsonb,
    '{
      "eyebrow": "Software Engineering Portfolio",
      "headline": "Building software that solves real-world problems.",
      "supportingDescription": "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
      "primaryCtaLabel": "Explore Engineering Work",
      "primaryCtaHref": "#projects",
      "secondaryCtaLabel": "Get in Touch",
      "secondaryCtaHref": "/contact",
      "engineeringFocusAreas": [
        "Software Engineering Fundamentals",
        "Frontend & Full-Stack Architecture",
        "Backend & API Engineering",
        "Relational Database Design",
        "Automated Testing & Verification",
        "Deployment & AI Integration"
      ]
    }'::jsonb,
    NOW()
  ),
  (
    'about_content',
    'published',
    '{
      "introduction": "I am Muhamad Fauzan, a Software Engineer dedicated to designing, implementing, testing, and deploying maintainable software systems.",
      "narrativeParagraphs": [
        "My engineering approach emphasizes clean system boundaries, explicit data modeling, and verifiable behavior from the database schema up to the user interface.",
        "Rather than treating software as isolated screens or temporary scripts, I focus on end-to-end engineering: structured requirements analysis, normalized relational schemas, type-safe APIs, accessible interfaces, and automated quality gates."
      ],
      "engineeringPhilosophyTitle": "Engineering Philosophy",
      "engineeringPhilosophySubtitle": "Core principles that guide how I design, build, test, and maintain software systems.",
      "engineeringPillars": [
        {
          "id": "pillar-fundamentals",
          "title": "Architecture & Data Integrity First",
          "summary": "Reliable software starts with well-defined domain boundaries, normalized schemas, and strict server-side validation.",
          "practices": [
            "Normalized relational data modeling with explicit constraints",
            "Strict separation between presentation and data access layers",
            "End-to-end type safety with TypeScript and schema validation"
          ]
        },
        {
          "id": "pillar-evidence",
          "title": "Verification Over Assumptions",
          "summary": "Correctness, security, and accessibility must be verified systematically rather than assumed from happy-path manual runs.",
          "practices": [
            "Automated unit, integration, and end-to-end testing workflows",
            "Server-enforced authentication, authorization, and access control",
            "Semantic HTML, keyboard accessibility, and WCAG contrast discipline"
          ]
        },
        {
          "id": "pillar-pragmatism",
          "title": "Maintainable Simplicity",
          "summary": "Choose clear, proven architectures that solve the actual problem without introducing speculative complexity.",
          "practices": [
            "Server-first rendering with minimal client-side JavaScript overhead",
            "Modular feature boundaries that remain easy to inspect and refactor",
            "Predictable state transitions such as explicit draft-to-publish flows"
          ]
        }
      ],
      "coreDomains": [
        "Full-Stack Web Engineering",
        "Backend Services & REST APIs",
        "Database Modeling & SQL",
        "System Architecture",
        "Automated QA & CI/CD",
        "Practical AI Integration"
      ]
    }'::jsonb,
    '{
      "introduction": "I am Muhamad Fauzan, a Software Engineer dedicated to designing, implementing, testing, and deploying maintainable software systems.",
      "narrativeParagraphs": [
        "My engineering approach emphasizes clean system boundaries, explicit data modeling, and verifiable behavior from the database schema up to the user interface.",
        "Rather than treating software as isolated screens or temporary scripts, I focus on end-to-end engineering: structured requirements analysis, normalized relational schemas, type-safe APIs, accessible interfaces, and automated quality gates."
      ],
      "engineeringPhilosophyTitle": "Engineering Philosophy",
      "engineeringPhilosophySubtitle": "Core principles that guide how I design, build, test, and maintain software systems.",
      "engineeringPillars": [
        {
          "id": "pillar-fundamentals",
          "title": "Architecture & Data Integrity First",
          "summary": "Reliable software starts with well-defined domain boundaries, normalized schemas, and strict server-side validation.",
          "practices": [
            "Normalized relational data modeling with explicit constraints",
            "Strict separation between presentation and data access layers",
            "End-to-end type safety with TypeScript and schema validation"
          ]
        },
        {
          "id": "pillar-evidence",
          "title": "Verification Over Assumptions",
          "summary": "Correctness, security, and accessibility must be verified systematically rather than assumed from happy-path manual runs.",
          "practices": [
            "Automated unit, integration, and end-to-end testing workflows",
            "Server-enforced authentication, authorization, and access control",
            "Semantic HTML, keyboard accessibility, and WCAG contrast discipline"
          ]
        },
        {
          "id": "pillar-pragmatism",
          "title": "Maintainable Simplicity",
          "summary": "Choose clear, proven architectures that solve the actual problem without introducing speculative complexity.",
          "practices": [
            "Server-first rendering with minimal client-side JavaScript overhead",
            "Modular feature boundaries that remain easy to inspect and refactor",
            "Predictable state transitions such as explicit draft-to-publish flows"
          ]
        }
      ],
      "coreDomains": [
        "Full-Stack Web Engineering",
        "Backend Services & REST APIs",
        "Database Modeling & SQL",
        "System Architecture",
        "Automated QA & CI/CD",
        "Practical AI Integration"
      ]
    }'::jsonb,
    NOW()
  )
ON CONFLICT (key) DO NOTHING;

-- 2. Projects (GeoEntity, ClayCV, SPK Bansos SAW seeded strictly as DRAFT with published_data = NULL)
INSERT INTO public.projects (
  id,
  slug,
  name,
  category,
  status,
  is_featured,
  display_order,
  published_data,
  draft_data
)
VALUES
  (
    '11111111-1111-4111-8111-111111111101',
    'geoentity',
    'GeoEntity',
    'Backend & Data Engineering',
    'draft',
    TRUE,
    1,
    NULL,
    '{
      "id": "11111111-1111-4111-8111-111111111101",
      "slug": "geoentity",
      "name": "GeoEntity",
      "description": "Geospatial engineering and structured data operations built with Go and SQLite.",
      "category": "Backend & Data Engineering",
      "technologies": ["Go", "SQLite", "Geospatial Engineering", "Data Operations"],
      "coverUrl": null,
      "githubUrl": "https://github.com/uzaannnnnn/GeoEntity",
      "liveDemoUrl": null,
      "projectCompletionState": "Repository Available — Pending Case Study Verification",
      "status": "draft",
      "isFeatured": true,
      "displayOrder": 1,
      "updatedAt": "2026-11-06T00:00:00.000Z",
      "screenshots": [],
      "caseStudySections": [
        {
          "id": "cs-geo-overview",
          "sectionType": "overview",
          "title": "Overview",
          "content": "GeoEntity is a Go and SQLite project focused on geospatial engineering and structured data operations. Detailed case study sections are currently in draft awaiting owner verification.",
          "displayOrder": 1,
          "isEnabled": true
        }
      ]
    }'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111102',
    'claycv',
    'ClayCV',
    'Full-Stack Web Application',
    'draft',
    TRUE,
    2,
    NULL,
    '{
      "id": "11111111-1111-4111-8111-111111111102",
      "slug": "claycv",
      "name": "ClayCV",
      "description": "ATS-friendly CV builder with live preview and PDF generation built with Next.js, React, and TypeScript.",
      "category": "Full-Stack Web Application",
      "technologies": ["Next.js", "React", "TypeScript", "PDF Generation"],
      "coverUrl": null,
      "githubUrl": "https://github.com/uzaannnnnn/ClayCV",
      "liveDemoUrl": null,
      "projectCompletionState": "Repository Available — Pending Case Study Verification",
      "status": "draft",
      "isFeatured": true,
      "displayOrder": 2,
      "updatedAt": "2026-11-06T00:00:00.000Z",
      "screenshots": [],
      "caseStudySections": [
        {
          "id": "cs-clay-overview",
          "sectionType": "overview",
          "title": "Overview",
          "content": "ClayCV is a web application for generating ATS-friendly CVs with live preview and PDF export using Next.js, React, and TypeScript. Detailed architectural notes are in draft awaiting verification.",
          "displayOrder": 1,
          "isEnabled": true
        }
      ]
    }'::jsonb
  ),
  (
    '11111111-1111-4111-8111-111111111103',
    'spk-bansos-saw',
    'SPK Bansos SAW',
    'Decision Support System',
    'draft',
    FALSE,
    3,
    NULL,
    '{
      "id": "11111111-1111-4111-8111-111111111103",
      "slug": "spk-bansos-saw",
      "name": "SPK Bansos SAW",
      "description": "Sistem Pendukung Keputusan Penerima Manfaat Bansos Menggunakan Metode SAW Studi Kasus Desa Panundaan.",
      "category": "Decision Support System",
      "technologies": ["PHP", "Laravel", "MySQL", "Simple Additive Weighting (SAW)"],
      "coverUrl": null,
      "githubUrl": null,
      "liveDemoUrl": null,
      "projectCompletionState": "Draft — Pending Owner Confirmation",
      "status": "draft",
      "isFeatured": false,
      "displayOrder": 3,
      "updatedAt": "2026-11-06T00:00:00.000Z",
      "screenshots": [],
      "caseStudySections": [
        {
          "id": "cs-spk-overview",
          "sectionType": "overview",
          "title": "Overview",
          "content": "Decision support system implementing the Simple Additive Weighting (SAW) method for social assistance beneficiary evaluation (Desa Panundaan case study), built with PHP, Laravel, and MySQL.",
          "displayOrder": 1,
          "isEnabled": true
        }
      ]
    }'::jsonb
  )
ON CONFLICT (slug) DO NOTHING;

-- 3. Indonesian Regional Boot Greetings
INSERT INTO public.boot_greetings (language, greeting, meaning, is_enabled, display_order, status)
VALUES
  ('Indonesian', 'Selamat Datang', 'Welcome', TRUE, 1, 'published'),
  ('Sundanese', 'Wilujeng Sumping', 'Welcome', TRUE, 2, 'published'),
  ('Javanese', 'Sugeng Rawuh', 'Welcome', TRUE, 3, 'published'),
  ('Balinese', 'Rahajeng Rauh', 'Welcome', TRUE, 4, 'published'),
  ('Minangkabau', 'Salamaik Datang', 'Welcome', TRUE, 5, 'published'),
  ('Batak Toba', 'Horas', 'Greeting', TRUE, 6, 'published'),
  ('Bugis', 'Tabe''', 'Greeting / Respect', TRUE, 7, 'published'),
  ('Acehnese', 'Peumulia Jamee', 'Welcoming guests', TRUE, 8, 'published'),
  ('Banjar', 'Salamat Datang', 'Welcome', TRUE, 9, 'published'),
  ('Malay', 'Selamat Datang', 'Welcome', TRUE, 10, 'published');
