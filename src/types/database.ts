export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ContentStatusDb = "draft" | "published" | "archived";

export type PublishableEntityType =
  | "profile"
  | "site_settings"
  | "hero_content"
  | "about_content"
  | "project"
  | "skill_category"
  | "skill"
  | "experience"
  | "education"
  | "certification"
  | "note"
  | "boot_greeting"
  | "resume_file";

export type StorageBucketName =
  | "profile"
  | "projects"
  | "certificates"
  | "resume"
  | "articles"
  | "og-images";

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          auth_user_id: string;
          email: string;
          role: "admin";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id: string;
          email: string;
          role?: "admin";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          auth_user_id?: string;
          email?: string;
          role?: "admin";
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      content_revisions: {
        Row: {
          id: string;
          entity_type: PublishableEntityType;
          entity_id: string;
          version_number: number;
          state: ContentStatusDb;
          snapshot: Json;
          change_summary: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: PublishableEntityType;
          entity_id: string;
          version_number: number;
          state: ContentStatusDb;
          snapshot: Json;
          change_summary?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          state?: ContentStatusDb;
          change_summary?: string;
        };
        Relationships: [];
      };
      content_publications: {
        Row: {
          id: string;
          entity_type: PublishableEntityType;
          entity_id: string;
          revision_id: string | null;
          action: "publish" | "unpublish" | "archive" | "restore";
          published_by: string | null;
          published_at: string;
        };
        Insert: {
          id?: string;
          entity_type: PublishableEntityType;
          entity_id: string;
          revision_id?: string | null;
          action: "publish" | "unpublish" | "archive" | "restore";
          published_by?: string | null;
          published_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_email: string;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_email: string;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      singleton_configs: {
        Row: {
          key: "profile" | "site_settings" | "hero_content" | "about_content";
          status: ContentStatusDb;
          published_data: Json | null;
          draft_data: Json;
          published_revision_id: string | null;
          draft_revision_id: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key: "profile" | "site_settings" | "hero_content" | "about_content";
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data: Json;
          published_revision_id?: string | null;
          draft_revision_id?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data?: Json;
          published_revision_id?: string | null;
          draft_revision_id?: string | null;
          published_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          professional_title: string;
          tagline: string;
          short_bio: string;
          location: string;
          email: string;
          github_url: string;
          linkedin_url: string;
          website_url: string;
          avatar_url: string | null;
          available_for_work: boolean;
          availability_note: string;
          status: ContentStatusDb;
          published_data: Json | null;
          draft_data: Json;
          published_revision_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          professional_title: string;
          tagline: string;
          short_bio: string;
          location?: string;
          email?: string;
          github_url?: string;
          linkedin_url?: string;
          website_url?: string;
          avatar_url?: string | null;
          available_for_work?: boolean;
          availability_note?: string;
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data: Json;
          published_revision_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string;
          professional_title?: string;
          tagline?: string;
          short_bio?: string;
          location?: string;
          email?: string;
          github_url?: string;
          linkedin_url?: string;
          website_url?: string;
          avatar_url?: string | null;
          available_for_work?: boolean;
          availability_note?: string;
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data?: Json;
          published_revision_id?: string | null;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          id: string;
          site_title: string;
          site_description: string;
          canonical_base_url: string;
          homepage_section_order: Json;
          boot_welcome: Json;
          status: ContentStatusDb;
          published_data: Json | null;
          draft_data: Json;
          published_revision_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_title: string;
          site_description: string;
          canonical_base_url: string;
          homepage_section_order?: Json;
          boot_welcome?: Json;
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data: Json;
          published_revision_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          site_title?: string;
          site_description?: string;
          canonical_base_url?: string;
          homepage_section_order?: Json;
          boot_welcome?: Json;
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data?: Json;
          published_revision_id?: string | null;
        };
        Relationships: [];
      };
      hero_contents: {
        Row: {
          id: string;
          eyebrow: string;
          headline: string;
          supporting_description: string;
          primary_cta_label: string;
          primary_cta_href: string;
          secondary_cta_label: string;
          secondary_cta_href: string;
          engineering_focus_areas: Json;
          status: ContentStatusDb;
          published_data: Json | null;
          draft_data: Json;
          published_revision_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          eyebrow: string;
          headline: string;
          supporting_description: string;
          primary_cta_label: string;
          primary_cta_href: string;
          secondary_cta_label: string;
          secondary_cta_href: string;
          engineering_focus_areas?: Json;
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data: Json;
          published_revision_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          eyebrow?: string;
          headline?: string;
          supporting_description?: string;
          primary_cta_label?: string;
          primary_cta_href?: string;
          secondary_cta_label?: string;
          secondary_cta_href?: string;
          engineering_focus_areas?: Json;
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data?: Json;
          published_revision_id?: string | null;
        };
        Relationships: [];
      };
      about_contents: {
        Row: {
          id: string;
          introduction: string;
          narrative_paragraphs: Json;
          engineering_philosophy_title: string;
          engineering_philosophy_subtitle: string;
          engineering_pillars: Json;
          core_domains: Json;
          status: ContentStatusDb;
          published_data: Json | null;
          draft_data: Json;
          published_revision_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          introduction: string;
          narrative_paragraphs?: Json;
          engineering_philosophy_title: string;
          engineering_philosophy_subtitle: string;
          engineering_pillars?: Json;
          core_domains?: Json;
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data: Json;
          published_revision_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          introduction?: string;
          narrative_paragraphs?: Json;
          engineering_philosophy_title?: string;
          engineering_philosophy_subtitle?: string;
          engineering_pillars?: Json;
          core_domains?: Json;
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data?: Json;
          published_revision_id?: string | null;
        };
        Relationships: [];
      };
      skill_categories: {
        Row: {
          id: string;
          name: string;
          name_id?: string;
          slug: string;
          description: string;
          description_id?: string;
          display_order: number;
          is_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          name_id?: string;
          slug: string;
          description?: string;
          description_id?: string;
          display_order?: number;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          name_id?: string;
          slug?: string;
          description?: string;
          description_id?: string;
          display_order?: number;
          is_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      skills: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          proficiency: "Core" | "Proficient" | "Working Knowledge" | "Exploring" | null;
          is_enabled: boolean;
          display_order: number;
          status: ContentStatusDb;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          proficiency?: "Core" | "Proficient" | "Working Knowledge" | "Exploring" | null;
          is_enabled?: boolean;
          display_order?: number;
          status?: ContentStatusDb;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          name?: string;
          proficiency?: "Core" | "Proficient" | "Working Knowledge" | "Exploring" | null;
          is_enabled?: boolean;
          display_order?: number;
          status?: ContentStatusDb;
          updated_at?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          slug: string;
          name: string;
          category: string;
          status: ContentStatusDb;
          is_featured: boolean;
          display_order: number;
          cover_media_id: string | null;
          published_data: Json | null;
          draft_data: Json;
          published_revision_id: string | null;
          draft_revision_id: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          category: string;
          status?: ContentStatusDb;
          is_featured?: boolean;
          display_order?: number;
          cover_media_id?: string | null;
          published_data?: Json | null;
          draft_data: Json;
          published_revision_id?: string | null;
          draft_revision_id?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          name?: string;
          category?: string;
          status?: ContentStatusDb;
          is_featured?: boolean;
          display_order?: number;
          cover_media_id?: string | null;
          published_data?: Json | null;
          draft_data?: Json;
          published_revision_id?: string | null;
          draft_revision_id?: string | null;
          published_at?: string | null;
        };
        Relationships: [];
      };
      project_technologies: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          category: string;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          category?: string;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          category?: string;
          display_order?: number;
        };
        Relationships: [];
      };
      project_sections: {
        Row: {
          id: string;
          project_id: string;
          section_type: string;
          title: string;
          content_mdx: string;
          display_order: number;
          is_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          section_type: string;
          title: string;
          content_mdx?: string;
          display_order?: number;
          is_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          section_type?: string;
          title?: string;
          content_mdx?: string;
          display_order?: number;
          is_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      experiences: {
        Row: {
          id: string;
          organization: string;
          role: string;
          employment_type: string;
          work_system: string;
          location: string;
          start_month: number;
          start_year: number;
          end_month: number | null;
          end_year: number | null;
          is_current: boolean;
          display_order: number;
          status: ContentStatusDb;
          published_data: Json | null;
          draft_data: Json;
          published_revision_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization: string;
          role: string;
          employment_type: string;
          work_system: string;
          location?: string;
          start_month: number;
          start_year: number;
          end_month?: number | null;
          end_year?: number | null;
          is_current?: boolean;
          display_order?: number;
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data: Json;
          published_revision_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization?: string;
          role?: string;
          employment_type?: string;
          work_system?: string;
          location?: string;
          start_month?: number;
          start_year?: number;
          end_month?: number | null;
          end_year?: number | null;
          is_current?: boolean;
          display_order?: number;
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data?: Json;
          published_revision_id?: string | null;
        };
        Relationships: [];
      };
      educations: {
        Row: {
          id: string;
          institution: string;
          degree: string;
          major: string;
          start_date: string;
          end_date: string | null;
          is_current: boolean;
          display_order: number;
          status: ContentStatusDb;
          published_data: Json | null;
          draft_data: Json;
          published_revision_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          institution: string;
          degree: string;
          major: string;
          start_date: string;
          end_date?: string | null;
          is_current?: boolean;
          display_order?: number;
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data: Json;
          published_revision_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          institution?: string;
          degree?: string;
          major?: string;
          start_date?: string;
          end_date?: string | null;
          is_current?: boolean;
          display_order?: number;
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data?: Json;
          published_revision_id?: string | null;
        };
        Relationships: [];
      };
      certifications: {
        Row: {
          id: string;
          name: string;
          issuing_organization: string;
          issue_month: number;
          issue_year: number;
          expiration_month: number | null;
          expiration_year: number | null;
          credential_id: string | null;
          credential_url: string | null;
          certificate_media_id: string | null;
          display_order: number;
          status: ContentStatusDb;
          published_data: Json | null;
          draft_data: Json;
          published_revision_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          issuing_organization: string;
          issue_month: number;
          issue_year: number;
          expiration_month?: number | null;
          expiration_year?: number | null;
          credential_id?: string | null;
          credential_url?: string | null;
          certificate_media_id?: string | null;
          display_order?: number;
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data: Json;
          published_revision_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          issuing_organization?: string;
          issue_month?: number;
          issue_year?: number;
          expiration_month?: number | null;
          expiration_year?: number | null;
          credential_id?: string | null;
          credential_url?: string | null;
          certificate_media_id?: string | null;
          display_order?: number;
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data?: Json;
          published_revision_id?: string | null;
        };
        Relationships: [];
      };
      notes: {
        Row: {
          id: string;
          slug: string;
          title: string;
          category: string;
          display_order: number;
          status: ContentStatusDb;
          cover_media_id: string | null;
          published_data: Json | null;
          draft_data: Json;
          published_revision_id: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          category?: string;
          display_order?: number;
          status?: ContentStatusDb;
          cover_media_id?: string | null;
          published_data?: Json | null;
          draft_data: Json;
          published_revision_id?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          category?: string;
          display_order?: number;
          status?: ContentStatusDb;
          cover_media_id?: string | null;
          published_data?: Json | null;
          draft_data?: Json;
          published_revision_id?: string | null;
          published_at?: string | null;
        };
        Relationships: [];
      };
      boot_greetings: {
        Row: {
          id: string;
          language: string;
          greeting: string;
          meaning: string;
          meaning_id?: string;
          region_note: string;
          region_note_id?: string;
          is_enabled: boolean;
          display_order: number;
          status: ContentStatusDb;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          language: string;
          greeting: string;
          meaning: string;
          meaning_id?: string;
          region_note?: string;
          region_note_id?: string;
          is_enabled?: boolean;
          display_order?: number;
          status?: ContentStatusDb;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          language?: string;
          greeting?: string;
          meaning?: string;
          meaning_id?: string;
          region_note?: string;
          region_note_id?: string;
          is_enabled?: boolean;
          display_order?: number;
          status?: ContentStatusDb;
        };
        Relationships: [];
      };
      media_assets: {
        Row: {
          id: string;
          bucket: StorageBucketName;
          storage_path: string;
          public_url: string | null;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          alt_text: string;
          is_public: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bucket: StorageBucketName;
          storage_path: string;
          public_url?: string | null;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          alt_text?: string;
          is_public?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          public_url?: string | null;
          file_name?: string;
          alt_text?: string;
          is_public?: boolean;
        };
        Relationships: [];
      };
      resume_files: {
        Row: {
          id: string;
          version_label: string;
          file_name: string;
          storage_path: string;
          file_url: string | null;
          size_bytes: number;
          summary_note: string;
          is_active: boolean;
          status: ContentStatusDb;
          published_revision_id: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          version_label: string;
          file_name: string;
          storage_path: string;
          file_url?: string | null;
          size_bytes: number;
          summary_note?: string;
          is_active?: boolean;
          status?: ContentStatusDb;
          published_revision_id?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          version_label?: string;
          file_url?: string | null;
          summary_note?: string;
          is_active?: boolean;
          status?: ContentStatusDb;
          published_revision_id?: string | null;
          published_at?: string | null;
        };
        Relationships: [];
      };
      visitor_counters: {
        Row: {
          id: string;
          count: number;
          updated_at: string;
        };
        Insert: {
          id: string;
          count?: number;
          updated_at?: string;
        };
        Update: {
          count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      visitor_daily_fingerprints: {
        Row: {
          fingerprint_hash: string;
          visit_date: string;
          created_at: string;
        };
        Insert: {
          fingerprint_hash: string;
          visit_date: string;
          created_at?: string;
        };
        Update: {
          visit_date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      record_portfolio_visit: {
        Args: {
          p_fingerprint: string;
          p_visit_date: string;
        };
        Returns: number;
      };
      publish_entity: {
        Args: {
          p_entity_type: string;
          p_entity_id: string;
          p_revision_id: string;
          p_version_number: number;
          p_snapshot: Json;
          p_change_summary?: string;
          p_actor_id?: string | null;
          p_actor_email?: string;
        };
        Returns: Json;
      };
      unpublish_entity: {
        Args: {
          p_entity_type: string;
          p_entity_id: string;
          p_target_state?: string;
          p_actor_id?: string | null;
          p_actor_email?: string;
        };
        Returns: Json;
      };
    };
  };
}
