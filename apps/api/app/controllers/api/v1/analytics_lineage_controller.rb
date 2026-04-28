module Api
  module V1
    class AnalyticsLineageController < ApplicationController
      before_action :authenticate_request!

      def show
        job_id = params[:job_id].to_s.strip
        if job_id.blank?
          return render_api_error(
            code: "validation_failed",
            message: "job_id e obrigatorio para lineage.",
            status: :unprocessable_entity,
            details: [ { field: "job_id", reason: "blank" } ]
          )
        end

        job = Job.includes(:upload, :requested_by).find_by(id: job_id)
        return render_api_error(code: "not_found", message: "Job nao encontrado.", status: :not_found) if job.nil?
        return render_api_error(code: "access_denied", message: "Acesso negado para este recurso.", status: :forbidden) unless JobPolicy.new(current_actor, job).show?

        render_success(
          data: {
            job: JobSerializer.new(job).serializable_hash,
            upload: UploadSerializer.new(job.upload).serializable_hash,
            acquisition: acquisition_payload(job),
            batches: job.job_batches.order(:batch_number).map { |batch| batch_payload(batch) },
            attempts: job.processing_attempts.order(:attempt_number).map { |attempt| attempt_payload(attempt) },
            quarantine: job.quarantine_records.order(:created_at).limit(100).map { |record| quarantine_payload(record) },
            artifacts: job.job_artifacts.order(:created_at).map { |artifact| JobArtifactSerializer.new(artifact).serializable_hash },
            warnings: job.operational_warnings.order(created_at: :desc).map { |warning| OperationalWarningSerializer.new(warning).serializable_hash },
            audit_refs: audit_refs(job)
          }
        )
      end

      private

      def acquisition_payload(job)
        acquisition = job.upload_acquisition
        return nil if acquisition.nil?

        UploadAcquisitionSerializer.new(acquisition).serializable_hash
      end

      def batch_payload(batch)
        {
          id: batch.id,
          job_id: batch.job_id,
          batch_number: batch.batch_number,
          status: batch.status,
          input_rows: batch.input_rows,
          valid_rows: batch.valid_rows,
          invalid_rows: batch.invalid_rows,
          trace_id: batch.trace_id,
          created_at: batch.created_at&.iso8601,
          updated_at: batch.updated_at&.iso8601
        }
      end

      def attempt_payload(attempt)
        {
          id: attempt.id,
          attempt_number: attempt.attempt_number,
          operation: attempt.operation,
          status: attempt.status,
          retryable: attempt.retryable,
          error_code: attempt.error_code,
          started_at: attempt.started_at&.iso8601,
          finished_at: attempt.finished_at&.iso8601,
          trace_id: attempt.trace_id
        }
      end

      def quarantine_payload(record)
        {
          id: record.id,
          job_batch_id: record.job_batch_id,
          row_number: record.row_number,
          code: record.code,
          message: record.message,
          severity: record.severity,
          resolution_status: record.resolution_status,
          trace_id: record.trace_id,
          created_at: record.created_at&.iso8601
        }
      end

      def audit_refs(job)
        AuditEvent
          .where(auditable_type: "Job", auditable_id: job.id)
          .or(AuditEvent.where(auditable_type: "Upload", auditable_id: job.upload_id))
          .order(occurred_at: :desc)
          .limit(100)
          .map do |event|
            {
              id: event.id,
              action: event.action,
              auditable_type: event.auditable_type,
              auditable_id: event.auditable_id,
              trace_id: event.trace_id,
              occurred_at: event.occurred_at&.iso8601
            }
          end
      end
    end
  end
end
