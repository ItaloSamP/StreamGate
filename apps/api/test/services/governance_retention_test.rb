require "test_helper"

class GovernanceRetentionTest < ActiveSupport::TestCase
  test "explicit disabled permission rule overrides role default" do
    actor = users(:operator)
    PermissionRule.create!(
      organization_id: actor.organization_id,
      role: actor.role,
      capability: "dashboard.export",
      enabled: false
    )

    assert_not Permissions::Matrix.allowed?(actor, "dashboard.export", organization_id: actor.organization_id)
  end

  test "retention prune deletes only expired records for the selected organization" do
    now = Time.zone.parse("2026-04-26 12:00:00")
    alpha = users(:operator).organization_id
    beta = users(:external_operator).organization_id
    RetentionPolicy.create!(
      organization_id: alpha,
      realtime_events_days: 1,
      dashboard_exports_days: 1,
      operational_warnings_days: 1,
      job_artifacts_days: 1,
      clickhouse_days: 1,
      operational_data_days: 1
    )

    old_alpha = RealtimeEvent.create!(
      event_type: "job.completed",
      organization_id: alpha,
      severity: "info",
      payload: {},
      occurred_at: now - 3.days,
      expires_at: now - 1.day,
      trace_id: "trace_retention_alpha"
    )
    old_beta = RealtimeEvent.create!(
      event_type: "job.completed",
      organization_id: beta,
      severity: "info",
      payload: {},
      occurred_at: now - 3.days,
      expires_at: now - 1.day,
      trace_id: "trace_retention_beta"
    )

    result = Operational::RetentionPruneService.call(organization_id: alpha, now: now)

    assert_equal 1, result.deleted.fetch(:realtime_events)
    assert_not RealtimeEvent.exists?(old_alpha.id)
    assert RealtimeEvent.exists?(old_beta.id)
  end
end
