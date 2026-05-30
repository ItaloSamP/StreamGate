require "csv"
require "digest"

module DashboardExports
  class CreateService < ApplicationService
    Result = Struct.new(:export, :content, keyword_init: true)

    HEADERS = {
      "snapshot" => %w[label value source],
      "series" => %w[label records jobs failed],
      "heatmap" => %w[range day value],
      "event_log" => %w[timestamp type severity message job_id upload_id]
    }.freeze

    def initialize(actor:, kind:, format:, window:)
      @actor = actor
      @kind = kind.to_s
      @format = format.to_s
      @window = window
    end

    def call
      rows = export_rows
      content = format == "json" ? JSON.pretty_generate(rows) : to_csv(rows)
      export = DashboardExport.create!(
        actor: actor,
        organization_id: actor.organization_id,
        kind: kind,
        format: format,
        filename: filename,
        content_type: content_type,
        byte_size: content.bytesize,
        checksum_sha256: Digest::SHA256.hexdigest(content),
        metadata: { rows: rows.size, source: "server" },
        request_id: Current.request_id,
        trace_id: Current.trace_id
      )
      AuditEvent.create!(
        actor: actor,
        auditable: export,
        action: "dashboard.export.created",
        request_id: Current.request_id,
        trace_id: Current.trace_id,
        occurred_at: Time.current,
        metadata: { action: "dashboard.export.created", source: "dashboard", status: "created" }
      )
      Result.new(export: export, content: content)
    end

    private

    attr_reader :actor, :kind, :format, :window

    def export_rows
      case kind
      when "snapshot"
        snapshot_rows
      when "series"
        snapshot_rows.map { |row| row.merge("label" => "window") }
      when "heatmap"
        [ { "range" => "window", "day" => window[:timezone], "value" => scoped_snapshots.count } ]
      when "event_log"
        event_rows
      else
        []
      end.map { |row| Operational::PayloadMasker.call(row) }
    end

    def snapshot_rows
      snapshots = scoped_snapshots
      [
        { "label" => "jobs_total", "value" => snapshots.count, "source" => "postgres_derived" },
        { "label" => "completed", "value" => snapshots.where(status: "completed").count, "source" => "postgres_derived" },
        { "label" => "failed", "value" => snapshots.where(status: "failed").count, "source" => "postgres_derived" }
      ]
    end

    def event_rows
      events = AuditEvent
        .where(occurred_at: window[:from]..window[:to])
      events = scope_audit_events(events) unless actor.admin?

      events.order(occurred_at: :desc).limit(100).map do |event|
        {
          "timestamp" => event.occurred_at&.iso8601,
          "type" => event.action,
          "severity" => "info",
          "message" => "Audit event #{event.action}.",
          "job_id" => event.auditable_type == "Job" ? event.auditable_id : nil,
          "upload_id" => event.metadata&.fetch("upload_id", nil)
        }
      end
    end

    def scope_audit_events(events)
      job_ids = scoped_snapshots.pluck(:job_id)
      upload_ids = scoped_snapshots.pluck(:upload_id)
      return events.none if job_ids.empty? && upload_ids.empty?

      events.where(
        "(auditable_type = 'Job' AND auditable_id IN (:job_ids)) OR (auditable_type = 'Upload' AND auditable_id IN (:upload_ids))",
        job_ids: job_ids,
        upload_ids: upload_ids
      )
    end

    def scoped_snapshots
      scope = AnalyticsJobSnapshot.where(job_created_at: window[:from]..window[:to])
      actor.admin? ? scope : scope.where(organization_id: actor.organization_id)
    end

    def to_csv(rows)
      headers = HEADERS.fetch(kind, rows.flat_map(&:keys).uniq)
      CSV.generate(headers: true) do |csv|
        csv << headers
        rows.each { |row| csv << headers.map { |header| row[header] } }
      end
    end

    def filename
      "streamgate-dashboard-#{kind}.#{format}"
    end

    def content_type
      format == "json" ? "application/json" : "text/csv"
    end
  end
end
