module Api
  module V1
    class SaasReadinessController < ApplicationController
      before_action :authenticate_request!

      def show
        return forbidden unless current_actor.admin? && current_actor.active_membership_for?(current_organization)

        render_success(data: readiness_payload)
      end

      private

      def readiness_payload
        organization_id = current_organization.id
        member_counts = current_organization.organization_memberships.group(:status).count
        profiles = ConnectorProfile.where(organization_id: organization_id)

        {
          generated_at: Time.current.iso8601,
          organization: {
            id: organization_id,
            members: {
              active: member_counts.fetch("active", 0),
              invited: member_counts.fetch("invited", 0),
              suspended: member_counts.fetch("suspended", 0)
            }
          },
          access: {
            role: current_actor.role,
            admin: current_actor.admin?
          },
          identity: {
            mfa: {
              mode: "totp",
              status: "required_for_release",
              recovery_codes: "required_for_rollout"
            },
            sso: {
              protocol: "oidc",
              validated_provider: "google_workspace",
              status: "external_credentials_required"
            },
            saml: {
              enabled: false,
              status: "out_of_scope"
            }
          },
          billing: {
            status: "out_of_scope",
            reason: "Sem billing nesta release"
          },
          quotas: {
            status: "required_for_release",
            defaults: {
              upload_gb_per_month: 500,
              connector_runs_per_day: 1_000,
              retention_days: 180
            }
          },
          connectors: {
            configured_count: profiles.count,
            active_profiles: profiles.where(status: "active").count,
            supported: %w[s3 http google_drive oauth_delegated],
            google_drive: {
              status: "external_credentials_required",
              acquisition_modes: %w[file folder]
            },
            oauth_delegated: {
              status: "external_credentials_required",
              provider: "google_workspace"
            },
            clear_lease_credentials_circulate: false
          },
          security: {
            controls: %w[
              malware_scanning
              parser_fuzzing
              ssrf_egress_policy
              organization_quotas
              credential_scanning
              container_scanning
              dast_smoke
            ],
            sensitive_surface: {
              signed_urls_in_ui: false,
              raw_payloads_in_events: false,
              connector_credentials_in_events: false
            }
          },
          infrastructure: {
            runtime: "aws_eks",
            ingress_tls: true,
            credential_store: "aws_secrets_manager_external_secrets_irsa",
            data_services: %w[rds_postgres s3 elasticache_redis amazon_mq clickhouse_cloud]
          },
          observability: {
            stack: "open_source",
            telemetry: "opentelemetry",
            metrics: "prometheus",
            logs: "loki",
            dashboards: "grafana",
            alerts: "alertmanager"
          },
          compliance: {
            target: "soc2_type_i",
            status: "design_evidence_ready",
            evidence_sections: %w[
              access_control
              change_management
              vulnerability_management
              incident_response
              backup_restore
              logging_monitoring
              retention
              vendor_cloud
            ]
          },
          external_blockers: %w[
            aws_account
            google_oauth_client
            clickhouse_cloud_workspace
            soc2_auditor
            production_dns_tls
          ]
        }
      end

      def forbidden
        render_api_error(code: "access_denied", message: "Acesso negado para prontidao SaaS.", status: :forbidden)
      end
    end
  end
end
