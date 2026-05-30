module Artifacts
  class DownloadUrlService < ApplicationService
    Result = Struct.new(:artifact, :download_url, :expires_at, :reason, keyword_init: true) do
      def success?
        reason.nil?
      end
    end

    def initialize(artifact:, actor:)
      @artifact = artifact
      @actor = actor
    end

    def call
      return Result.new(reason: :invalid_state) unless artifact.available?

      expires_in = Rails.application.config.x.artifact_download_url_ttl_seconds
      result = Uploads::StorageClient.new.presigned_get_for_object(storage_key: artifact.storage_key, expires_in: expires_in)
      return Result.new(reason: result.reason || :dependency_unavailable) unless result.success?

      AuditEvent.create!(
        actor: actor,
        auditable: artifact,
        action: "artifact.download_url_created",
        metadata: { job_id: artifact.job_id, artifact_type: artifact.artifact_type },
        occurred_at: Time.current,
        request_id: Current.request_id || artifact.request_id || artifact.trace_id,
        trace_id: Current.trace_id || artifact.trace_id
      )

      Result.new(artifact: artifact, download_url: result.upload_url, expires_at: result.expires_at)
    end

    private

    attr_reader :artifact, :actor
  end
end
