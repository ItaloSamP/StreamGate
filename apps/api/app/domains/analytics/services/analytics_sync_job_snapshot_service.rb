class AnalyticsSyncJobSnapshotService < ApplicationService
  def initialize(job:)
    @job = job
  end

  def call
    attrs = {
      upload_id: job.upload_id,
      actor_id: job.requested_by_id,
      organization_id: job.requested_by.organization_id,
      source_type: job.source_type,
      status: job.status,
      quarantined_records_count: job.quarantined_records_count,
      job_created_at: job.created_at,
      last_synced_at: Time.current
    }

    snapshot = AnalyticsJobSnapshot.find_or_initialize_by(job_id: job.id)
    snapshot.assign_attributes(attrs)
    snapshot.save!
    snapshot
  end

  private

  attr_reader :job
end

module Analytics
  SyncJobSnapshotService = AnalyticsSyncJobSnapshotService
end
