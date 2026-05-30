module Operational
  class RetentionPruneService < ApplicationService
    Result = Struct.new(:deleted, keyword_init: true)

    def initialize(organization_id:, now: Time.current)
      @organization_id = organization_id
      @now = now
    end

    def call
      policy = RetentionPolicy.for_organization(organization_id)
      Result.new(
        deleted: {
          realtime_events: prune_realtime_events(policy),
          dashboard_exports: prune_dashboard_exports(policy),
          operational_warnings: prune_operational_warnings(policy),
          job_artifacts: prune_job_artifacts(policy)
        }
      )
    end

    private

    attr_reader :organization_id, :now

    def prune_realtime_events(policy)
      RealtimeEvent
        .where(organization_id: organization_id)
        .where("expires_at < ? OR occurred_at < ?", now, now - policy.realtime_events_days.days)
        .delete_all
    end

    def prune_dashboard_exports(policy)
      DashboardExport
        .where(organization_id: organization_id)
        .where("expires_at < ? OR generated_at < ?", now, now - policy.dashboard_exports_days.days)
        .delete_all
    end

    def prune_operational_warnings(policy)
      OperationalWarning
        .where(organization_id: organization_id)
        .where("expires_at < ? OR created_at < ?", now, now - policy.operational_warnings_days.days)
        .delete_all
    end

    def prune_job_artifacts(policy)
      JobArtifact
        .joins(job: :requested_by)
        .where(users: { organization_id: organization_id })
        .where("job_artifacts.expires_at < ? OR job_artifacts.created_at < ?", now, now - policy.job_artifacts_days.days)
        .delete_all
    end
  end
end
