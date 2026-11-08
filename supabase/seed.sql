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
      "location": "Bandung, Indonesia",
      "email": "vanz66hu@gmail.com",
      "githubUrl": "https://github.com/uzaannnnnn",
      "linkedinUrl": "https://linkedin.com/in/zanhoo",
      "websiteUrl": "https://muhamadfauzan.dev",
      "avatarUrl": null,
      "availableForWork": true,
      "availabilityNote": "Open to software engineering roles and technical collaborations."
    }'::jsonb,
    '{
      "fullName": "Muhamad Fauzan",
      "professionalTitle": "Software Engineer",
      "tagline": "Building software that solves real-world problems.",
      "shortBio": "Software Engineer focused on building reliable, scalable, and user-centered software systems across different engineering domains.",
      "location": "Bandung, Indonesia",
      "email": "vanz66hu@gmail.com",
      "githubUrl": "https://github.com/uzaannnnnn",
      "linkedinUrl": "https://linkedin.com/in/zanhoo",
      "websiteUrl": "https://muhamadfauzan.dev",
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
      "canonicalBaseUrl": "https://muhamadfauzan.dev",
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
      "canonicalBaseUrl": "https://muhamadfauzan.dev",
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
INSERT INTO public.boot_greetings (id, language, greeting, meaning, is_enabled, display_order, status)
VALUES
  ('10000000-0000-4000-8000-000000000001', 'Indonesian', 'Selamat Datang', 'Welcome', TRUE, 1, 'published'),
  ('10000000-0000-4000-8000-000000000002', 'Sundanese', 'Wilujeng Sumping', 'Welcome', TRUE, 2, 'published'),
  ('10000000-0000-4000-8000-000000000003', 'Javanese', 'Sugeng Rawuh', 'Welcome', TRUE, 3, 'published'),
  ('10000000-0000-4000-8000-000000000004', 'Balinese', 'Rahajeng Rauh', 'Welcome', TRUE, 4, 'published'),
  ('10000000-0000-4000-8000-000000000005', 'Minangkabau', 'Salamaik Datang', 'Welcome', TRUE, 5, 'published'),
  ('10000000-0000-4000-8000-000000000006', 'Batak Toba', 'Horas', 'Greeting', TRUE, 6, 'published'),
  ('10000000-0000-4000-8000-000000000007', 'Bugis', 'Tabe''', 'Greeting / Respect', TRUE, 7, 'published'),
  ('10000000-0000-4000-8000-000000000008', 'Acehnese', 'Peumulia Jamee', 'Welcoming guests', TRUE, 8, 'published'),
  ('10000000-0000-4000-8000-000000000009', 'Banjar', 'Salamat Datang', 'Welcome', TRUE, 9, 'published'),
  ('10000000-0000-4000-8000-000000000010', 'Malay', 'Selamat Datang', 'Welcome', TRUE, 10, 'published')
ON CONFLICT (id) DO NOTHING;

-- 4. Skill Categories & Skills
INSERT INTO public.skill_categories (id, name, slug, description, display_order, is_enabled)
VALUES
  ('20000000-0000-4000-8000-000000000001', 'Programming Languages', 'programming-languages', 'Languages used across backend services, web applications, and systems exercises.', 1, TRUE),
  ('20000000-0000-4000-8000-000000000002', 'Frontend Engineering', 'frontend', 'Modern component architectures, responsive layouts, and accessible interfaces.', 2, TRUE),
  ('20000000-0000-4000-8000-000000000003', 'Backend Engineering', 'backend', 'Server-side application logic, APIs, and service implementation.', 3, TRUE),
  ('20000000-0000-4000-8000-000000000004', 'Database Engineering', 'database', 'Relational and document data storage, schema design, and query optimization.', 4, TRUE),
  ('20000000-0000-4000-8000-000000000005', 'Infrastructure & Delivery', 'infrastructure', 'Containerization, automated workflows, and cloud deployment.', 5, TRUE),
  ('20000000-0000-4000-8000-000000000006', 'Software Engineering Practices', 'engineering', 'Core architectural, security, and verification disciplines.', 6, TRUE),
  ('20000000-0000-4000-8000-000000000007', 'AI Integration', 'ai-integration', 'Integrating language and machine learning models into application workflows.', 7, TRUE)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.skills (id, category_id, name, proficiency, is_enabled, display_order, status)
VALUES
  -- Languages
  ('21000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'TypeScript', 'Proficient', TRUE, 1, 'published'),
  ('21000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'JavaScript', 'Proficient', TRUE, 2, 'published'),
  ('21000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'Go', 'Working Knowledge', TRUE, 3, 'published'),
  ('21000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'PHP', 'Proficient', TRUE, 4, 'published'),
  ('21000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001', 'Python', 'Working Knowledge', TRUE, 5, 'published'),
  ('21000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001', 'Java', 'Working Knowledge', TRUE, 6, 'published'),
  ('21000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000001', 'C#', 'Working Knowledge', TRUE, 7, 'published'),
  ('21000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000001', 'C/C++', 'Working Knowledge', TRUE, 8, 'published'),
  -- Frontend
  ('21000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000002', 'React', 'Proficient', TRUE, 1, 'published'),
  ('21000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000002', 'Next.js', 'Proficient', TRUE, 2, 'published'),
  ('21000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000002', 'HTML', 'Core', TRUE, 3, 'published'),
  ('21000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000002', 'CSS', 'Core', TRUE, 4, 'published'),
  ('21000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000002', 'Tailwind CSS', 'Proficient', TRUE, 5, 'published'),
  -- Backend
  ('21000000-0000-4000-8000-000000000014', '20000000-0000-4000-8000-000000000003', 'Node.js', 'Proficient', TRUE, 1, 'published'),
  ('21000000-0000-4000-8000-000000000015', '20000000-0000-4000-8000-000000000003', 'Go', 'Working Knowledge', TRUE, 2, 'published'),
  ('21000000-0000-4000-8000-000000000016', '20000000-0000-4000-8000-000000000003', 'Laravel', 'Proficient', TRUE, 3, 'published'),
  -- Database
  ('21000000-0000-4000-8000-000000000017', '20000000-0000-4000-8000-000000000004', 'PostgreSQL', 'Proficient', TRUE, 1, 'published'),
  ('21000000-0000-4000-8000-000000000018', '20000000-0000-4000-8000-000000000004', 'MySQL', 'Proficient', TRUE, 2, 'published'),
  ('21000000-0000-4000-8000-000000000019', '20000000-0000-4000-8000-000000000004', 'MongoDB', 'Working Knowledge', TRUE, 3, 'published'),
  ('21000000-0000-4000-8000-000000000020', '20000000-0000-4000-8000-000000000004', 'SQLite', 'Working Knowledge', TRUE, 4, 'published'),
  -- Infrastructure
  ('21000000-0000-4000-8000-000000000021', '20000000-0000-4000-8000-000000000005', 'Docker', 'Working Knowledge', TRUE, 1, 'published'),
  ('21000000-0000-4000-8000-000000000022', '20000000-0000-4000-8000-000000000005', 'GitHub Actions', 'Working Knowledge', TRUE, 2, 'published'),
  ('21000000-0000-4000-8000-000000000023', '20000000-0000-4000-8000-000000000005', 'Vercel', 'Proficient', TRUE, 3, 'published'),
  -- Practices
  ('21000000-0000-4000-8000-000000000024', '20000000-0000-4000-8000-000000000006', 'REST API', 'Core', TRUE, 1, 'published'),
  ('21000000-0000-4000-8000-000000000025', '20000000-0000-4000-8000-000000000006', 'System Design', 'Working Knowledge', TRUE, 2, 'published'),
  ('21000000-0000-4000-8000-000000000026', '20000000-0000-4000-8000-000000000006', 'Authentication', 'Proficient', TRUE, 3, 'published'),
  ('21000000-0000-4000-8000-000000000027', '20000000-0000-4000-8000-000000000006', 'Authorization', 'Proficient', TRUE, 4, 'published'),
  ('21000000-0000-4000-8000-000000000028', '20000000-0000-4000-8000-000000000006', 'Database Design', 'Proficient', TRUE, 5, 'published'),
  ('21000000-0000-4000-8000-000000000029', '20000000-0000-4000-8000-000000000006', 'Software Testing', 'Proficient', TRUE, 6, 'published'),
  ('21000000-0000-4000-8000-000000000030', '20000000-0000-4000-8000-000000000006', 'CI/CD', 'Working Knowledge', TRUE, 7, 'published'),
  -- AI Integration
  ('21000000-0000-4000-8000-000000000031', '20000000-0000-4000-8000-000000000007', 'AI API Integration', 'Working Knowledge', TRUE, 1, 'published'),
  ('21000000-0000-4000-8000-000000000032', '20000000-0000-4000-8000-000000000007', 'Model Integration', 'Working Knowledge', TRUE, 2, 'published'),
  ('21000000-0000-4000-8000-000000000033', '20000000-0000-4000-8000-000000000007', 'Python AI Ecosystem', 'Working Knowledge', TRUE, 3, 'published')
ON CONFLICT (id) DO NOTHING;

-- 5. Published Engineering Notes
INSERT INTO public.notes (
  id,
  slug,
  title,
  category,
  display_order,
  status,
  published_at,
  published_data,
  draft_data
)
VALUES (
  '30000000-0000-4000-8000-000000000001',
  'explicit-draft-to-publish-content-workflows',
  'Designing Explicit Draft-to-Publish Content Workflows in Relational Systems',
  'System Architecture',
  1,
  'published',
  '2026-11-06T00:00:00.000Z',
  '{
    "id": "30000000-0000-4000-8000-000000000001",
    "title": "Designing Explicit Draft-to-Publish Content Workflows in Relational Systems",
    "slug": "explicit-draft-to-publish-content-workflows",
    "summary": "Architectural patterns for isolating editable working drafts from immutable published projections in PostgreSQL-backed content management systems.",
    "category": "System Architecture",
    "tags": ["PostgreSQL", "System Design", "Data Integrity", "Next.js"],
    "publishedAt": "2026-11-06",
    "coverImageUrl": null,
    "seoTitle": "Designing Explicit Draft-to-Publish Content Workflows | Muhamad Fauzan",
    "seoDescription": "Architectural notes on separating draft mutations from public read models using revision snapshots and server-side cache invalidation.",
    "status": "published",
    "contentMdx": "## Problem Context\\n\\nWhen building a content management system, mutating a single database row in place creates an immediate operational risk: incomplete edits, unverified metadata, or broken asset references become visible to anonymous visitors before review.\\n\\n### Core Requirements\\n\\n- **Strict Read Isolation:** Anonymous public queries must only ever read verified, explicitly published snapshots.\\n- **Transactional Publication:** Promoting a draft to published status must update the live projection atomically and record an immutable revision entry.\\n- **Selective Cache Revalidation:** Public pages should remain statically or incrementally cached until an explicit publish event triggers path or tag invalidation.\\n\\n## Revision Snapshot Pattern\\n\\nInstead of coupling public routes directly to mutable form columns, each logical entity maintains a separated `published_data` projection alongside its working `draft_data` state, backed by an append-only `content_revisions` table.\\n\\n```sql\\nSELECT slug, published_data\\nFROM projects\\nWHERE status = ''published''\\n  AND published_revision_id IS NOT NULL\\nORDER BY display_order ASC;\\n```\\n\\n## Verification Checklist\\n\\n1. Confirm anonymous queries reject rows where `status != ''published''`.\\n2. Verify sitemap and metadata generators exclude draft slugs.\\n3. Validate that failed publication transactions preserve the previous published revision."
  }'::jsonb,
  '{
    "id": "30000000-0000-4000-8000-000000000001",
    "title": "Designing Explicit Draft-to-Publish Content Workflows in Relational Systems",
    "slug": "explicit-draft-to-publish-content-workflows",
    "summary": "Architectural patterns for isolating editable working drafts from immutable published projections in PostgreSQL-backed content management systems.",
    "category": "System Architecture",
    "tags": ["PostgreSQL", "System Design", "Data Integrity", "Next.js"],
    "publishedAt": "2026-11-06",
    "coverImageUrl": null,
    "seoTitle": "Designing Explicit Draft-to-Publish Content Workflows | Muhamad Fauzan",
    "seoDescription": "Architectural notes on separating draft mutations from public read models using revision snapshots and server-side cache invalidation.",
    "status": "published",
    "contentMdx": "## Problem Context\\n\\nWhen building a content management system, mutating a single database row in place creates an immediate operational risk: incomplete edits, unverified metadata, or broken asset references become visible to anonymous visitors before review.\\n\\n### Core Requirements\\n\\n- **Strict Read Isolation:** Anonymous public queries must only ever read verified, explicitly published snapshots.\\n- **Transactional Publication:** Promoting a draft to published status must update the live projection atomically and record an immutable revision entry.\\n- **Selective Cache Revalidation:** Public pages should remain statically or incrementally cached until an explicit publish event triggers path or tag invalidation.\\n\\n## Revision Snapshot Pattern\\n\\nInstead of coupling public routes directly to mutable form columns, each logical entity maintains a separated `published_data` projection alongside its working `draft_data` state, backed by an append-only `content_revisions` table.\\n\\n```sql\\nSELECT slug, published_data\\nFROM projects\\nWHERE status = ''published''\\n  AND published_revision_id IS NOT NULL\\nORDER BY display_order ASC;\\n```\\n\\n## Verification Checklist\\n\\n1. Confirm anonymous queries reject rows where `status != ''published''`.\\n2. Verify sitemap and metadata generators exclude draft slugs.\\n3. Validate that failed publication transactions preserve the previous published revision."
  }'::jsonb
)
ON CONFLICT (slug) DO NOTHING;
