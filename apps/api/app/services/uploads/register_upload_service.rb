module Uploads
  class RegisterUploadService < ApplicationService
    Result = Struct.new(:upload, :job, keyword_init: true)

    def initialize(user:, filename:, content_type:, byte_size:, checksum_sha256:, storage_key:, metadata: {}, request_id: nil, trace_id: nil)
      @user = user
      @attributes = {
        filename: filename,
        content_type: content_type,
        byte_size: byte_size,
        checksum_sha256: checksum_sha256,
        storage_key: storage_key,
        metadata: metadata,
        request_id: request_id,
        trace_id: trace_id || StreamGate::Id.generate("trace")
      }
    end

    def call
      ApplicationRecord.transaction do
        upload = user.uploads.create!(upload_attributes)
        job = upload.jobs.create!(job_attributes)

        AuditEvent.create!(
          actor: user,
          auditable: upload,
          action: "upload.registered",
          request_id: upload.request_id || upload.trace_id,
          trace_id: upload.trace_id,
          occurred_at: Time.current,
          metadata: {
            upload_id: upload.id,
            job_id: job.id,
            filename: upload.filename
          }
        )

        Result.new(upload: upload, job: job)
      end
    end

    private

    attr_reader :user, :attributes

    def upload_attributes
      attributes.slice(:filename, :content_type, :byte_size, :checksum_sha256, :storage_key, :metadata, :request_id, :trace_id)
    end

    def job_attributes
      {
        requested_by: user,
        source_type: "upload",
        request_id: attributes[:request_id],
        trace_id: attributes[:trace_id]
      }
    end
  end
end
