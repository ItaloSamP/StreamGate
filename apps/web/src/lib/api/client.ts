/* eslint-disable @typescript-eslint/no-unused-vars */
import { apiClient, type ApiSuccessEnvelope, type RequestOptions } from '@/lib/api-client';
import type { HealthResponse, ListQuery, PaginationMeta, OperationalQuery, AnalyticsKpis, AnalyticsBreakdowns, AnalyticsSnapshot, AnalyticsSectionStatus, AnalyticsDashboardSection, AnalyticsDashboardEvent, AnalyticsDashboardTimeseriesPoint, AnalyticsDashboardStatusDistributionItem, AnalyticsDashboardFormatItem, AnalyticsDashboardHeatmap, AnalyticsDashboardJobBoardItem, AnalyticsDashboardQueueItem, AnalyticsDashboardIngestion, AnalyticsDashboardWorkerLive, AnalyticsDashboardAlert, RealtimeTicketResponse, RealtimeEvent, AnalyticsDashboardSnapshot, AnalyticsWarehouseSnapshot, QuarantineRecord, DlqMessage, AuditEvent, QuarantineQuery, DlqQuery, AuditQuery, UploadContentType, JobSummary, UploadAcquisition, OperationActionInput, OperationActionResponse, QuarantineResolveResponse, DlqReplayRequest, JobArtifact, ArtifactDownloadUrlResponse, NotificationStatus, NotificationItem, NotificationSettings, NotificationSettingsInput, NotificationBulkResponse, WebhookDeliveryResponse, UploadSummary, UploadSignedUrlRequest, UploadSignedUrlResponse, UploadRegisterRequest, UploadRegisterResponse, PublicLinkUploadRequest, PublicLinkUploadResponse, DashboardExportKind, DashboardExportFormat, DashboardExportRequest, DashboardExportResponse, AlertActionResponse, ConnectorKind, ConnectorStatus, ConnectorProfile, ConnectorProfileInput, ConnectorProfileTestResponse, ConnectorIngestion, ConnectorIngestionRequest, ConnectorIngestionResponse, Organization, OrganizationMembership, OrganizationInvite, OrganizationPayload, OrganizationUpdateInput, OrganizationInviteInput, OrganizationMemberInput, MfaSetupResponse, MfaVerifyInput, MfaVerifyResponse, OidcProvider, GoogleOidcProviderInput, OidcStartResponse, GoogleDriveAuthorizeResponse, GoogleDriveConnection, GoogleDriveItem, SaasReadiness, AnalyticsLineage, AuthUser, AuthToken, AuthSession, AuthPayload, SessionRefreshPayload, PasswordResetRequestPayload, MessagePayload, RegisterInput, LoginInput, PasswordResetConfirmInput } from "./types";

type StreamgateHttpClientType = {
  get: <T>(path: string, options?: RequestOptions) => Promise<T>
  post: <T>(path: string, options?: RequestOptions) => Promise<T>
  patch?: <T>(path: string, options?: RequestOptions) => Promise<T>
  delete?: <T>(path: string, options?: RequestOptions) => Promise<T>
  getEnvelope?: <T>(path: string, options?: RequestOptions) => Promise<ApiSuccessEnvelope<T>>
  postEnvelope?: <T>(path: string, options?: RequestOptions) => Promise<ApiSuccessEnvelope<T>>
  patchEnvelope?: <T>(path: string, options?: RequestOptions) => Promise<ApiSuccessEnvelope<T>>
  deleteEnvelope?: <T>(path: string, options?: RequestOptions) => Promise<ApiSuccessEnvelope<T>>
}


export function createStreamgateApi(client: StreamgateHttpClientType = apiClient) {
  return {
    health: () => client.get<HealthResponse>('/up', undefined),

    requestUploadSignedUrl: async (input: UploadSignedUrlRequest): Promise<ApiSuccessEnvelope<UploadSignedUrlResponse>> => {
      const body = {
        upload: {
          filename: input.filename,
          content_type: input.contentType,
          byte_size: input.byteSize,
          checksum_sha256: input.checksumSha256,
        },
      }

      if (client.postEnvelope) {
        return client.postEnvelope<UploadSignedUrlResponse>(endpoints.uploadSignedUrl, { body })
      }

      const data = await client.post<UploadSignedUrlResponse>(endpoints.uploadSignedUrl, { body })
      return { data }
    },

    registerUpload: async (input: UploadRegisterRequest): Promise<ApiSuccessEnvelope<UploadRegisterResponse>> => {
      const body = {
        upload: {
          filename: input.filename,
          content_type: input.contentType,
          byte_size: input.byteSize,
          checksum_sha256: input.checksumSha256,
          storage_key: input.storageKey,
          metadata: input.metadata,
        },
      }

      if (client.postEnvelope) {
        return client.postEnvelope<UploadRegisterResponse>(endpoints.uploads, { body })
      }

      const data = await client.post<UploadRegisterResponse>(endpoints.uploads, { body })
      return { data }
    },

    createPublicLinkUpload: async (input: PublicLinkUploadRequest): Promise<ApiSuccessEnvelope<PublicLinkUploadResponse>> => {
      const options = {
        body: {
          public_link: {
            url: input.url,
            filename: input.filename,
            content_type: input.contentType,
            byte_size: input.byteSize,
          },
        },
        headers: idempotencyHeaders(input.idempotencyKey),
      }

      if (client.postEnvelope) {
        return client.postEnvelope<PublicLinkUploadResponse>(endpoints.uploadPublicLink, options)
      }

      const data = await client.post<PublicLinkUploadResponse>(endpoints.uploadPublicLink, options)
      return { data }
    },

    getSaasReadiness: async (): Promise<ApiSuccessEnvelope<SaasReadiness>> => {
      if (client.getEnvelope) {
        return client.getEnvelope<SaasReadiness>(endpoints.saasReadiness)
      }

      const data = await client.get<SaasReadiness>(endpoints.saasReadiness)
      return { data }
    },

    getOrganization: async (): Promise<ApiSuccessEnvelope<OrganizationPayload>> => {
      if (client.getEnvelope) return client.getEnvelope<OrganizationPayload>(endpoints.organization)
      const data = await client.get<OrganizationPayload>(endpoints.organization)
      return { data }
    },

    updateOrganization: (input: OrganizationUpdateInput) => {
      const payload: Record<string, unknown> = {}
      if (input.name !== undefined) payload.name = input.name
      if (input.retentionDays !== undefined) payload.retention_days = input.retentionDays
      if (input.quotas !== undefined) payload.quotas = input.quotas
      if (input.settings !== undefined) payload.settings = input.settings
      if (input.complianceProfile !== undefined) payload.compliance_profile = input.complianceProfile

      return patchEnvelope<OrganizationPayload>(client, endpoints.organization, {
        body: { organization: payload },
        headers: idempotencyHeaders(input.idempotencyKey ?? createIdempotencyKey('organization')),
      })
    },

    listOrganizationMembers: async (): Promise<ApiSuccessEnvelope<OrganizationMembership[]>> => {
      if (client.getEnvelope) return client.getEnvelope<OrganizationMembership[]>(endpoints.organizationMembers)
      const data = await client.get<OrganizationMembership[]>(endpoints.organizationMembers)
      return { data }
    },

    createOrganizationInvite: (input: OrganizationInviteInput) =>
      client.postEnvelope
        ? client.postEnvelope<OrganizationInvite>(endpoints.organizationInvites, {
            body: { invite: { email: input.email, role: input.role } },
            headers: idempotencyHeaders(input.idempotencyKey),
          })
        : client.post<OrganizationInvite>(endpoints.organizationInvites, {
            body: { invite: { email: input.email, role: input.role } },
            headers: idempotencyHeaders(input.idempotencyKey),
          }).then((data) => ({ data })),

    updateOrganizationMember: (memberId: string, input: OrganizationMemberInput) => {
      const payload: Record<string, unknown> = {}
      if (input.role !== undefined) payload.role = input.role
      if (input.status !== undefined) payload.status = input.status

      return patchEnvelope<OrganizationMembership>(client, `${endpoints.organizationMembers}/${memberId}`, {
        body: { membership: payload },
        headers: idempotencyHeaders(input.idempotencyKey),
      })
    },

    deleteOrganizationMember: (memberId: string, input?: { idempotencyKey?: string }) =>
      deleteEnvelope<OrganizationMembership>(client, `${endpoints.organizationMembers}/${memberId}`, {
        headers: idempotencyHeaders(input?.idempotencyKey),
      }),

    acceptOrganizationInvite: (token: string, input: { fullName: string; password: string; passwordConfirmation: string }) =>
      client.postEnvelope
        ? client.postEnvelope<{ user: AuthUser; membership: OrganizationMembership }>(`${endpoints.organizationInvites}/${token}/accept`, {
            body: { acceptance: { full_name: input.fullName, password: input.password, password_confirmation: input.passwordConfirmation } },
          })
        : client.post<{ user: AuthUser; membership: OrganizationMembership }>(`${endpoints.organizationInvites}/${token}/accept`, {
            body: { acceptance: { full_name: input.fullName, password: input.password, password_confirmation: input.passwordConfirmation } },
          }).then((data) => ({ data })),

    authorizeGoogleDrive: async (): Promise<ApiSuccessEnvelope<GoogleDriveAuthorizeResponse>> => {
      if (client.getEnvelope) return client.getEnvelope<GoogleDriveAuthorizeResponse>(endpoints.googleDriveAuthorize)
      const data = await client.get<GoogleDriveAuthorizeResponse>(endpoints.googleDriveAuthorize)
      return { data }
    },

    listGoogleDriveItems: async (): Promise<ApiSuccessEnvelope<GoogleDriveItem[]>> => {
      if (client.getEnvelope) return client.getEnvelope<GoogleDriveItem[]>(endpoints.googleDriveItems)
      const data = await client.get<GoogleDriveItem[]>(endpoints.googleDriveItems)
      return { data }
    },

    revokeGoogleDrive: () =>
      deleteEnvelope<GoogleDriveConnection>(client, endpoints.googleDriveRevoke),

    listConnectorProfiles: async (): Promise<ApiSuccessEnvelope<ConnectorProfile[]>> => {
      if (client.getEnvelope) {
        return client.getEnvelope<ConnectorProfile[]>(endpoints.connectorProfiles)
      }

      const data = await client.get<ConnectorProfile[]>(endpoints.connectorProfiles)
      return { data }
    },

    createConnectorProfile: async (input: ConnectorProfileInput): Promise<ApiSuccessEnvelope<ConnectorProfile>> => {
      const payload: Record<string, unknown> = {}
      if (input.name !== undefined) payload.name = input.name
      if (input.kind !== undefined) payload.kind = input.kind
      if (input.status !== undefined) payload.status = input.status
      if (input.settings !== undefined) payload.settings = input.settings
      if (input.secrets !== undefined) payload.secrets = input.secrets

      const options = {
        body: { connector_profile: payload },
        headers: idempotencyHeaders(input.idempotencyKey),
      }

      if (client.postEnvelope) {
        return client.postEnvelope<ConnectorProfile>(endpoints.connectorProfiles, options)
      }

      const data = await client.post<ConnectorProfile>(endpoints.connectorProfiles, options)
      return { data }
    },

    updateConnectorProfile: (profileId: string, input: ConnectorProfileInput) => {
      const payload: Record<string, unknown> = {}
      if (input.name !== undefined) payload.name = input.name
      if (input.kind !== undefined) payload.kind = input.kind
      if (input.status !== undefined) payload.status = input.status
      if (input.settings !== undefined) payload.settings = input.settings
      if (input.secrets !== undefined) payload.secrets = input.secrets

      return patchEnvelope<ConnectorProfile>(client, `${endpoints.connectorProfiles}/${profileId}`, {
        body: { connector_profile: payload },
        headers: idempotencyHeaders(input.idempotencyKey),
      })
    },

    testConnectorProfile: async (profileId: string): Promise<ApiSuccessEnvelope<ConnectorProfileTestResponse>> => {
      const path = `${endpoints.connectorProfiles}/${profileId}/test`

      if (client.postEnvelope) {
        return client.postEnvelope<ConnectorProfileTestResponse>(path)
      }

      const data = await client.post<ConnectorProfileTestResponse>(path)
      return { data }
    },

    createConnectorIngestion: async (profileId: string, input: ConnectorIngestionRequest): Promise<ApiSuccessEnvelope<ConnectorIngestionResponse>> => {
      const ingestion: Record<string, unknown> = {
        filename: input.filename,
        content_type: input.contentType,
      }
      if (input.objectKey) ingestion.object_key = input.objectKey
      if (input.sourcePath) ingestion.source_path = input.sourcePath
      if (input.driveFileId) ingestion.drive_file_id = input.driveFileId
      if (input.driveFolderId) ingestion.drive_folder_id = input.driveFolderId
      if (input.byteSize) ingestion.byte_size = input.byteSize

      const options = {
        body: { ingestion },
        headers: idempotencyHeaders(input.idempotencyKey),
      }

      const path = `${endpoints.connectorProfiles}/${profileId}/ingestions`
      if (client.postEnvelope) {
        return client.postEnvelope<ConnectorIngestionResponse>(path, options)
      }

      const data = await client.post<ConnectorIngestionResponse>(path, options)
      return { data }
    },

    listJobs: async (query?: ListQuery): Promise<ApiSuccessEnvelope<JobSummary[]>> => {
      const normalizedQuery = normalizeListQuery(query)

      if (client.getEnvelope) {
        return client.getEnvelope<JobSummary[]>(endpoints.jobs, { query: normalizedQuery })
      }

      const data = await client.get<JobSummary[]>(endpoints.jobs, { query: normalizedQuery })
      return { data }
    },

    listUploads: async (query?: ListQuery): Promise<ApiSuccessEnvelope<UploadSummary[]>> => {
      const normalizedQuery = normalizeListQuery(query)

      if (client.getEnvelope) {
        return client.getEnvelope<UploadSummary[]>(endpoints.uploads, { query: normalizedQuery })
      }

      const data = await client.get<UploadSummary[]>(endpoints.uploads, { query: normalizedQuery })
      return { data }
    },

    getAnalytics: async (query?: OperationalQuery): Promise<ApiSuccessEnvelope<AnalyticsSnapshot>> => {
      const normalizedQuery = normalizeOperationalQuery(query)

      if (client.getEnvelope) {
        return client.getEnvelope<AnalyticsSnapshot>(endpoints.analytics, { query: normalizedQuery })
      }

      const data = await client.get<AnalyticsSnapshot>(endpoints.analytics, { query: normalizedQuery })
      return { data }
    },

    getAnalyticsDashboard: async (query?: OperationalQuery): Promise<ApiSuccessEnvelope<AnalyticsDashboardSnapshot>> => {
      const normalizedQuery = normalizeOperationalQuery(query)
      const path = `${endpoints.analytics}/dashboard`

      if (client.getEnvelope) {
        return client.getEnvelope<AnalyticsDashboardSnapshot>(path, { query: normalizedQuery })
      }

      const data = await client.get<AnalyticsDashboardSnapshot>(path, { query: normalizedQuery })
      return { data }
    },

    createRealtimeTicket: async (): Promise<ApiSuccessEnvelope<RealtimeTicketResponse>> => {
      if (client.postEnvelope) {
        return client.postEnvelope<RealtimeTicketResponse>(endpoints.realtimeTickets)
      }

      const data = await client.post<RealtimeTicketResponse>(endpoints.realtimeTickets)
      return { data }
    },

    listRealtimeEvents: async (query?: { since?: string; limit?: number }): Promise<ApiSuccessEnvelope<RealtimeEvent[]>> => {
      if (client.getEnvelope) {
        return client.getEnvelope<RealtimeEvent[]>(endpoints.realtimeEvents, { query })
      }

      const data = await client.get<RealtimeEvent[]>(endpoints.realtimeEvents, { query })
      return { data }
    },

    createDashboardExport: async (input: DashboardExportRequest): Promise<ApiSuccessEnvelope<DashboardExportResponse>> => {
      const payload: Record<string, unknown> = {
        kind: input.kind,
        format: input.format,
      }
      if (input.preset !== undefined) payload.preset = input.preset
      if (input.from !== undefined) payload.from = input.from
      if (input.to !== undefined) payload.to = input.to
      if (input.timezone !== undefined) payload.timezone = input.timezone

      const body = {
        export: payload,
      }

      if (client.postEnvelope) {
        return client.postEnvelope<DashboardExportResponse>(endpoints.dashboardExports, {
          body,
          headers: idempotencyHeaders(input.idempotencyKey),
        })
      }

      const data = await client.post<DashboardExportResponse>(endpoints.dashboardExports, {
        body,
        headers: idempotencyHeaders(input.idempotencyKey),
      })
      return { data }
    },

    reviewAlert: (alertId: string, input: OperationActionInput) =>
      client.postEnvelope
        ? client.postEnvelope<AlertActionResponse>(`/api/v1/alerts/${alertId}/review`, {
            body: operationBody(input.reason),
            headers: idempotencyHeaders(input.idempotencyKey),
          })
        : client.post<AlertActionResponse>(`/api/v1/alerts/${alertId}/review`, {
            body: operationBody(input.reason),
            headers: idempotencyHeaders(input.idempotencyKey),
          }).then((data) => ({ data })),

    dismissAlert: (alertId: string, input: OperationActionInput) =>
      client.postEnvelope
        ? client.postEnvelope<AlertActionResponse>(`/api/v1/alerts/${alertId}/dismiss`, {
            body: operationBody(input.reason),
            headers: idempotencyHeaders(input.idempotencyKey),
          })
        : client.post<AlertActionResponse>(`/api/v1/alerts/${alertId}/dismiss`, {
            body: operationBody(input.reason),
            headers: idempotencyHeaders(input.idempotencyKey),
          }).then((data) => ({ data })),

    getAnalyticsWarehouse: async (query?: OperationalQuery): Promise<ApiSuccessEnvelope<AnalyticsWarehouseSnapshot>> => {
      const normalizedQuery = normalizeOperationalQuery(query)
      const path = `${endpoints.analytics}/warehouse`

      if (client.getEnvelope) {
        return client.getEnvelope<AnalyticsWarehouseSnapshot>(path, { query: normalizedQuery })
      }

      const data = await client.get<AnalyticsWarehouseSnapshot>(path, { query: normalizedQuery })
      return { data }
    },

    getAnalyticsLineage: async (jobId: string): Promise<ApiSuccessEnvelope<AnalyticsLineage>> => {
      const path = `${endpoints.analytics}/lineage`
      const query = { job_id: jobId }

      if (client.getEnvelope) {
        return client.getEnvelope<AnalyticsLineage>(path, { query })
      }

      const data = await client.get<AnalyticsLineage>(path, { query })
      return { data }
    },

    listQuarantine: async (query?: QuarantineQuery): Promise<ApiSuccessEnvelope<QuarantineRecord[]>> => {
      const normalizedQuery = normalizeQuarantineQuery(query)

      if (client.getEnvelope) {
        return client.getEnvelope<QuarantineRecord[]>(endpoints.quarantine, { query: normalizedQuery })
      }

      const data = await client.get<QuarantineRecord[]>(endpoints.quarantine, { query: normalizedQuery })
      return { data }
    },

    listQuarantineDlq: async (query?: DlqQuery): Promise<ApiSuccessEnvelope<DlqMessage[]>> => {
      const normalizedQuery = normalizeDlqQuery(query)

      if (client.getEnvelope) {
        return client.getEnvelope<DlqMessage[]>(endpoints.quarantineDlq, { query: normalizedQuery })
      }

      const data = await client.get<DlqMessage[]>(endpoints.quarantineDlq, { query: normalizedQuery })
      return { data }
    },

    retryJob: async (jobId: string, input: OperationActionInput): Promise<ApiSuccessEnvelope<OperationActionResponse>> => {
      const path = `${endpoints.jobs}/${jobId}/retry`

      if (client.postEnvelope) {
        return client.postEnvelope<OperationActionResponse>(path, {
          body: operationBody(input.reason),
          headers: idempotencyHeaders(input.idempotencyKey),
        })
      }

      const data = await client.post<OperationActionResponse>(path, {
        body: operationBody(input.reason),
        headers: idempotencyHeaders(input.idempotencyKey),
      })
      return { data }
    },

    resolveQuarantine: async (recordId: string, input: OperationActionInput): Promise<ApiSuccessEnvelope<QuarantineResolveResponse>> => {
      const path = `${endpoints.quarantine}/${recordId}/resolve`

      if (client.postEnvelope) {
        return client.postEnvelope<QuarantineResolveResponse>(path, {
          body: operationBody(input.reason),
          headers: idempotencyHeaders(input.idempotencyKey),
        })
      }

      const data = await client.post<QuarantineResolveResponse>(path, {
        body: operationBody(input.reason),
        headers: idempotencyHeaders(input.idempotencyKey),
      })
      return { data }
    },

    createDlqReplayRequest: async (messageId: string, input: OperationActionInput & { payload?: Record<string, unknown> }): Promise<ApiSuccessEnvelope<DlqReplayRequest>> => {
      const path = `${endpoints.quarantineDlq}/${messageId}/replay-requests`

      if (client.postEnvelope) {
        return client.postEnvelope<DlqReplayRequest>(path, {
          body: operationBody(input.reason, input.payload),
          headers: idempotencyHeaders(input.idempotencyKey),
        })
      }

      const data = await client.post<DlqReplayRequest>(path, {
        body: operationBody(input.reason, input.payload),
        headers: idempotencyHeaders(input.idempotencyKey),
      })
      return { data }
    },

    approveDlqReplayRequest: async (requestId: string, input: OperationActionInput): Promise<ApiSuccessEnvelope<DlqReplayRequest>> => {
      const path = `${endpoints.dlqReplayRequests}/${requestId}/approve`

      if (client.postEnvelope) {
        return client.postEnvelope<DlqReplayRequest>(path, {
          body: operationBody(input.reason),
          headers: idempotencyHeaders(input.idempotencyKey),
        })
      }

      const data = await client.post<DlqReplayRequest>(path, {
        body: operationBody(input.reason),
        headers: idempotencyHeaders(input.idempotencyKey),
      })
      return { data }
    },

    executeDlqReplayRequest: async (requestId: string, input: OperationActionInput): Promise<ApiSuccessEnvelope<DlqReplayRequest>> => {
      const path = `${endpoints.dlqReplayRequests}/${requestId}/execute`

      if (client.postEnvelope) {
        return client.postEnvelope<DlqReplayRequest>(path, {
          body: operationBody(input.reason),
          headers: idempotencyHeaders(input.idempotencyKey),
        })
      }

      const data = await client.post<DlqReplayRequest>(path, {
        body: operationBody(input.reason),
        headers: idempotencyHeaders(input.idempotencyKey),
      })
      return { data }
    },

    listJobArtifacts: async (jobId: string): Promise<ApiSuccessEnvelope<JobArtifact[]>> => {
      const path = `${endpoints.jobs}/${jobId}/artifacts`

      if (client.getEnvelope) {
        return client.getEnvelope<JobArtifact[]>(path)
      }

      const data = await client.get<JobArtifact[]>(path)
      return { data }
    },

    createArtifactDownloadUrl: async (jobId: string, artifactId: string): Promise<ApiSuccessEnvelope<ArtifactDownloadUrlResponse>> => {
      const path = `${endpoints.jobs}/${jobId}/artifacts/${artifactId}/download-url`

      if (client.postEnvelope) {
        return client.postEnvelope<ArtifactDownloadUrlResponse>(path)
      }

      const data = await client.post<ArtifactDownloadUrlResponse>(path)
      return { data }
    },

    listNotifications: async (query?: { status?: 'active' | NotificationStatus }): Promise<ApiSuccessEnvelope<NotificationItem[]>> => {
      if (client.getEnvelope) {
        return client.getEnvelope<NotificationItem[]>(endpoints.notifications, { query })
      }

      const data = await client.get<NotificationItem[]>(endpoints.notifications, { query })
      return { data }
    },

    markNotificationRead: (notificationId: string) =>
      patchEnvelope<NotificationItem>(client, `${endpoints.notifications}/${notificationId}/read`),

    archiveNotification: (notificationId: string) =>
      patchEnvelope<NotificationItem>(client, `${endpoints.notifications}/${notificationId}/archive`),

    unarchiveNotification: (notificationId: string) =>
      patchEnvelope<NotificationItem>(client, `${endpoints.notifications}/${notificationId}/unarchive`),

    deleteNotification: (notificationId: string) =>
      deleteEnvelope<{ deleted: boolean; id: string }>(client, `${endpoints.notifications}/${notificationId}`),

    markAllNotificationsRead: (status: 'active' | NotificationStatus = 'active') =>
      patchEnvelope<NotificationBulkResponse>(client, `${endpoints.notifications}/mark-all-read`, { query: { status } }),

    bulkArchiveNotifications: (ids: string[]) =>
      patchEnvelope<NotificationBulkResponse>(client, `${endpoints.notifications}/bulk-archive`, { body: { notifications: { ids } } }),

    getNotificationSettings: async (): Promise<ApiSuccessEnvelope<NotificationSettings>> => {
      if (client.getEnvelope) return client.getEnvelope<NotificationSettings>(endpoints.notificationSettings)
      const data = await client.get<NotificationSettings>(endpoints.notificationSettings)
      return { data }
    },

    updateNotificationSettings: (input: NotificationSettingsInput) =>
      patchEnvelope<NotificationSettings>(client, endpoints.notificationSettings, {
        body: {
          notification_setting: {
            in_app_enabled: input.inAppEnabled,
            email_enabled: input.emailEnabled,
            webhook_enabled: input.webhookEnabled,
            webhook_url: input.webhookUrl,
          },
        },
      }),

    testWebhookNotification: (input: OperationActionInput) => {
      const path = `${endpoints.notificationSettings}/webhook/test`

      if (client.postEnvelope) {
        return client.postEnvelope<WebhookDeliveryResponse>(path, {
          body: operationBody(input.reason),
          headers: idempotencyHeaders(input.idempotencyKey),
        })
      }

      return client.post<WebhookDeliveryResponse>(path, {
        body: operationBody(input.reason),
        headers: idempotencyHeaders(input.idempotencyKey),
      }).then((data) => ({ data }))
    },

    listAuditEvents: async (query?: AuditQuery): Promise<ApiSuccessEnvelope<AuditEvent[]>> => {
      const normalizedQuery = normalizeAuditQuery(query)

      if (client.getEnvelope) {
        return client.getEnvelope<AuditEvent[]>(endpoints.audit, { query: normalizedQuery })
      }

      const data = await client.get<AuditEvent[]>(endpoints.audit, { query: normalizedQuery })
      return { data }
    },

    auth: {
      register: (input: RegisterInput) =>
        client.post<AuthPayload>('/api/v1/auth/register', {
          body: {
            registration: {
              full_name: input.fullName,
              email: input.email,
              password: input.password,
              password_confirmation: input.passwordConfirmation,
            },
          },
        }),

      login: (input: LoginInput) =>
        client.post<AuthPayload>('/api/v1/auth/login', {
          body: {
            session: {
              email: input.email,
              password: input.password,
            },
          },
        }),

      logout: () => client.post<MessagePayload>('/api/v1/auth/logout', undefined),

      me: () => client.get<{ user: AuthUser; session: AuthSession }>('/api/v1/auth/me', undefined),

      refresh: () =>
        client.post<SessionRefreshPayload>('/api/v1/auth/session/refresh', undefined),

      requestPasswordReset: ({ email }: { email: string }) =>
        client.post<PasswordResetRequestPayload>('/api/v1/auth/password/reset/request', {
          body: {
            password_reset: {
              email,
            },
          },
        }),

      confirmPasswordReset: (input: PasswordResetConfirmInput) =>
        client.post<MessagePayload>('/api/v1/auth/password/reset/confirm', {
          body: {
            password_reset_confirmation: {
              token: input.token,
              password: input.password,
              password_confirmation: input.passwordConfirmation,
            },
          },
        }),

      setupMfa: () =>
        client.postEnvelope
          ? client.postEnvelope<MfaSetupResponse>(endpoints.mfaSetup)
          : client.post<MfaSetupResponse>(endpoints.mfaSetup).then((data) => ({ data })),

      verifyMfa: (input: MfaVerifyInput) => {
        const body: { mfa: { code: string; challenge_token?: string } } = {
          mfa: { code: input.code },
        }
        if (input.challengeToken) body.mfa.challenge_token = input.challengeToken

        return client.postEnvelope
          ? client.postEnvelope<MfaVerifyResponse>(endpoints.mfaVerify, { body })
          : client.post<MfaVerifyResponse>(endpoints.mfaVerify, { body }).then((data) => ({ data }))
      },

      regenerateMfaRecoveryCodes: () =>
        client.postEnvelope
          ? client.postEnvelope<{ recovery_codes: string[] }>(endpoints.mfaRecoveryCodes)
          : client.post<{ recovery_codes: string[] }>(endpoints.mfaRecoveryCodes).then((data) => ({ data })),

      updateGoogleOidcProvider: (input: GoogleOidcProviderInput) =>
        patchEnvelope<OidcProvider>(client, endpoints.oidcConfig, {
          body: {
            oidc_provider: {
              issuer: input.issuer,
              client_id: input.clientId,
              client_credential: input.clientSecret,
              hosted_domain: input.hostedDomain,
            },
          },
        }),

      startGoogleOidc: async ({ organizationId }: { organizationId: string }): Promise<ApiSuccessEnvelope<OidcStartResponse>> => {
        const query = { organization_id: organizationId }
        if (client.getEnvelope) return client.getEnvelope<OidcStartResponse>(endpoints.oidcStart, { query })
        const data = await client.get<OidcStartResponse>(endpoints.oidcStart, { query })
        return { data }
      },
    },
  }
}

export const streamgateApi = createStreamgateApi(apiClient)

