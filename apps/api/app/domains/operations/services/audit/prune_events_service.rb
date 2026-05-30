module Audit
  class PruneEventsService < ApplicationService
    def initialize(retention_days: Rails.application.config.x.audit_retention_days)
      @retention_days = retention_days
    end

    def call
      cutoff = retention_days.days.ago
      AuditEvent.where("occurred_at < ?", cutoff).delete_all
    end

    private

    attr_reader :retention_days
  end
end
