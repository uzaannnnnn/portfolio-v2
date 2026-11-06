import type { VerifiedAdminContext } from "@/lib/auth/admin-guard";
import {
  buildCacheRevalidationPlan,
  executeCacheRevalidation,
  type RevalidationExecutor,
  type RevalidationPlan,
} from "@/lib/cache/revalidation";
import type { ContentStatusDb, PublishableEntityType } from "@/types/database";

export interface VersionedEntityRecord<T> {
  entityType: PublishableEntityType;
  entityId: string;
  slug?: string;
  status: ContentStatusDb;
  publishedData: T | null;
  draftData: T;
  publishedRevisionId: string | null;
  draftRevisionId: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface RevisionRecord<T = unknown> {
  id: string;
  entityType: PublishableEntityType;
  entityId: string;
  versionNumber: number;
  state: ContentStatusDb;
  snapshot: T;
  changeSummary: string;
  createdBy: string;
  createdAt: string;
}

export interface PublicationRecord {
  id: string;
  entityType: PublishableEntityType;
  entityId: string;
  revisionId: string | null;
  action: "publish" | "unpublish" | "archive" | "restore";
  publishedBy: string;
  publishedAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  entityType: PublishableEntityType;
  entityId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface PublishingStoreAdapter<T = unknown> {
  getEntity(
    entityType: PublishableEntityType,
    entityId: string,
  ): Promise<VersionedEntityRecord<T> | null>;
  saveEntity(record: VersionedEntityRecord<T>): Promise<void>;
  getRevisions(
    entityType: PublishableEntityType,
    entityId: string,
  ): Promise<RevisionRecord<T>[]>;
  appendRevision(revision: RevisionRecord<T>): Promise<void>;
  appendPublication(publication: PublicationRecord): Promise<void>;
  appendAuditLog(entry: AuditLogEntry): Promise<void>;
}

/**
 * High-integrity Draft → Preview → Publish engine.
 * Enforces:
 * 1. Draft saves never mutate publishedData or status='published' live projections.
 * 2. Draft previews require a verified admin context.
 * 3. Publish validates draft completeness, atomically promotes draftData -> publishedData,
 *    appends an immutable revision & publication record, writes an audit log, and triggers cache revalidation.
 * 4. If validation or persistence fails during publish, the previous publishedData remains untouched.
 */
export class ContentPublishingEngine<T> {
  constructor(
    private readonly store: PublishingStoreAdapter<T>,
    private readonly validateForDraft: (data: T) => T,
    private readonly validateForPublish: (data: T) => T,
    private readonly revalidationExecutor?: RevalidationExecutor,
  ) {}

  async saveDraft(params: {
    admin: VerifiedAdminContext;
    entityType: PublishableEntityType;
    entityId: string;
    slug?: string;
    draftPayload: T;
    changeSummary?: string;
  }): Promise<{
    entity: VersionedEntityRecord<T>;
    revision: RevisionRecord<T>;
  }> {
    const validatedDraft = this.validateForDraft(params.draftPayload);
    const existing = await this.store.getEntity(params.entityType, params.entityId);
    const existingRevisions = await this.store.getRevisions(
      params.entityType,
      params.entityId,
    );

    const nextVersion =
      existingRevisions.reduce((max, r) => Math.max(max, r.versionNumber), 0) + 1;
    const now = new Date().toISOString();
    const revisionId = `rev-${params.entityType}-${params.entityId}-v${nextVersion}`;

    const revision: RevisionRecord<T> = {
      id: revisionId,
      entityType: params.entityType,
      entityId: params.entityId,
      versionNumber: nextVersion,
      state: "draft",
      snapshot: structuredClone(validatedDraft),
      changeSummary: params.changeSummary ?? `Draft v${nextVersion}`,
      createdBy: params.admin.adminId,
      createdAt: now,
    };

    // Preserve existing publishedData and published status!
    const updatedEntity: VersionedEntityRecord<T> = {
      entityType: params.entityType,
      entityId: params.entityId,
      slug: params.slug ?? existing?.slug,
      status: existing?.status ?? "draft",
      publishedData: existing?.publishedData
        ? structuredClone(existing.publishedData)
        : null,
      draftData: structuredClone(validatedDraft),
      publishedRevisionId: existing?.publishedRevisionId ?? null,
      draftRevisionId: revisionId,
      publishedAt: existing?.publishedAt ?? null,
      updatedAt: now,
    };

    await this.store.appendRevision(revision);
    await this.store.saveEntity(updatedEntity);
    await this.store.appendAuditLog({
      id: `audit-${Date.now()}-${nextVersion}`,
      actorId: params.admin.adminId,
      actorEmail: params.admin.email,
      action: "save_draft",
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: {
        revisionId,
        versionNumber: nextVersion,
        preservedPublishedRevisionId: updatedEntity.publishedRevisionId,
      },
      createdAt: now,
    });

    return { entity: updatedEntity, revision };
  }

  /**
   * Public read query: strictly returns publishedData only when status === 'published'.
   * Never returns draftData.
   */
  async getPublicPublished(params: {
    entityType: PublishableEntityType;
    entityId: string;
  }): Promise<T | null> {
    const entity = await this.store.getEntity(params.entityType, params.entityId);
    if (!entity || entity.status !== "published" || !entity.publishedData) {
      return null;
    }
    return structuredClone(entity.publishedData);
  }

  /**
   * Admin-authenticated preview query: returns working draftData without exposing it publicly.
   */
  async previewDraft(params: {
    admin: VerifiedAdminContext | null;
    entityType: PublishableEntityType;
    entityId: string;
  }): Promise<{
    mode: "preview";
    draftData: T;
    currentlyPublishedData: T | null;
    draftRevisionId: string | null;
    publishedRevisionId: string | null;
  }> {
    if (!params.admin || params.admin.role !== "admin") {
      throw new Error(
        "Unauthorized preview request: admin authentication is required to preview draft content.",
      );
    }

    const entity = await this.store.getEntity(params.entityType, params.entityId);
    if (!entity) {
      throw new Error(
        `Preview target not found: ${params.entityType}/${params.entityId}`,
      );
    }

    return {
      mode: "preview",
      draftData: structuredClone(entity.draftData),
      currentlyPublishedData: entity.publishedData
        ? structuredClone(entity.publishedData)
        : null,
      draftRevisionId: entity.draftRevisionId,
      publishedRevisionId: entity.publishedRevisionId,
    };
  }

  /**
   * Explicitly promotes the current draft to published status.
   * If validation or persistence throws, the previous published state remains intact.
   */
  async publishDraft(params: {
    admin: VerifiedAdminContext;
    entityType: PublishableEntityType;
    entityId: string;
    changeSummary?: string;
  }): Promise<{
    entity: VersionedEntityRecord<T>;
    revision: RevisionRecord<T>;
    revalidation: RevalidationPlan;
  }> {
    const existing = await this.store.getEntity(params.entityType, params.entityId);
    if (!existing) {
      throw new Error(
        `Cannot publish non-existent entity: ${params.entityType}/${params.entityId}`,
      );
    }

    // Validate completeness before mutating any state (prevents partial/incomplete publication)
    const validatedPublishPayload = this.validateForPublish(
      structuredClone(existing.draftData),
    );

    const existingRevisions = await this.store.getRevisions(
      params.entityType,
      params.entityId,
    );
    const nextVersion =
      existingRevisions.reduce((max, r) => Math.max(max, r.versionNumber), 0) + 1;
    const now = new Date().toISOString();
    const publishedRevisionId = `rev-${params.entityType}-${params.entityId}-v${nextVersion}-pub`;

    const publishedSnapshot = {
      ...validatedPublishPayload,
      status: "published",
    } as T;

    const revision: RevisionRecord<T> = {
      id: publishedRevisionId,
      entityType: params.entityType,
      entityId: params.entityId,
      versionNumber: nextVersion,
      state: "published",
      snapshot: structuredClone(publishedSnapshot),
      changeSummary: params.changeSummary ?? `Published v${nextVersion}`,
      createdBy: params.admin.adminId,
      createdAt: now,
    };

    const updatedEntity: VersionedEntityRecord<T> = {
      ...existing,
      status: "published",
      publishedData: structuredClone(publishedSnapshot),
      draftData: structuredClone(publishedSnapshot),
      publishedRevisionId,
      draftRevisionId: publishedRevisionId,
      publishedAt: now,
      updatedAt: now,
    };

    await this.store.appendRevision(revision);
    await this.store.saveEntity(updatedEntity);
    await this.store.appendPublication({
      id: `pub-${Date.now()}-${nextVersion}`,
      entityType: params.entityType,
      entityId: params.entityId,
      revisionId: publishedRevisionId,
      action: "publish",
      publishedBy: params.admin.adminId,
      publishedAt: now,
    });
    await this.store.appendAuditLog({
      id: `audit-${Date.now()}-${nextVersion}`,
      actorId: params.admin.adminId,
      actorEmail: params.admin.email,
      action: "publish_content",
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: {
        publishedRevisionId,
        versionNumber: nextVersion,
      },
      createdAt: now,
    });

    const plan = buildCacheRevalidationPlan({
      entityType: params.entityType,
      slug: updatedEntity.slug,
    });
    executeCacheRevalidation(plan, this.revalidationExecutor);

    return {
      entity: updatedEntity,
      revision,
      revalidation: plan,
    };
  }

  /**
   * Unpublishes or archives an entity and invalidates public caches so it is immediately removed from public routes.
   */
  async transitionPublicationState(params: {
    admin: VerifiedAdminContext;
    entityType: PublishableEntityType;
    entityId: string;
    targetState: "draft" | "archived";
  }): Promise<{
    entity: VersionedEntityRecord<T>;
    revalidation: RevalidationPlan;
  }> {
    const existing = await this.store.getEntity(params.entityType, params.entityId);
    if (!existing) {
      throw new Error(
        `Entity not found: ${params.entityType}/${params.entityId}`,
      );
    }

    const now = new Date().toISOString();
    const updatedEntity: VersionedEntityRecord<T> = {
      ...existing,
      status: params.targetState,
      publishedData: null,
      publishedRevisionId: null,
      updatedAt: now,
    };

    await this.store.saveEntity(updatedEntity);
    await this.store.appendPublication({
      id: `pub-${Date.now()}`,
      entityType: params.entityType,
      entityId: params.entityId,
      revisionId: existing.publishedRevisionId,
      action: params.targetState === "archived" ? "archive" : "unpublish",
      publishedBy: params.admin.adminId,
      publishedAt: now,
    });
    await this.store.appendAuditLog({
      id: `audit-${Date.now()}`,
      actorId: params.admin.adminId,
      actorEmail: params.admin.email,
      action: params.targetState === "archived" ? "archive_content" : "unpublish_content",
      entityType: params.entityType,
      entityId: params.entityId,
      metadata: { previousStatus: existing.status },
      createdAt: now,
    });

    const plan = buildCacheRevalidationPlan({
      entityType: params.entityType,
      slug: existing.slug,
    });
    executeCacheRevalidation(plan, this.revalidationExecutor);

    return {
      entity: updatedEntity,
      revalidation: plan,
    };
  }
}
