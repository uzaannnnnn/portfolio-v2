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
        };
        Update: {
          state?: ContentStatusDb;
          change_summary?: string;
        };
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
        };
        Update: never;
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
        };
        Update: never;
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
        };
        Update: {
          status?: ContentStatusDb;
          published_data?: Json | null;
          draft_data?: Json;
          published_revision_id?: string | null;
          draft_revision_id?: string | null;
          published_at?: string | null;
        };
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
        };
        Update: {
          public_url?: string | null;
          file_name?: string;
          alt_text?: string;
          is_public?: boolean;
        };
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
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
  };
}
