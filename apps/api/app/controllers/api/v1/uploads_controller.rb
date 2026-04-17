module Api
  module V1
    class UploadsController < ApplicationController
      MAX_PER_PAGE = 100
      DEFAULT_PER_PAGE = 20
      CHECKSUM_PATTERN = /\A[a-f0-9]{64}\z/

      before_action :authenticate_request!
      before_action :enforce_signed_url_rate_limit!, only: :signed_url
      before_action :enforce_register_rate_limit!, only: :create

      def signed_url
        payload = signed_url_params
        return if invalid_upload_payload?(payload, require_storage_key: false)

        result = ::Uploads::GenerateSignedUrlService.call(
          user: current_actor,
          filename: payload[:filename],
          content_type: normalized_content_type(payload[:content_type]),
          byte_size: payload[:byte_size],
          checksum_sha256: payload[:checksum_sha256],
          request_id: Current.request_id,
          trace_id: Current.trace_id
        )

        unless result.success?
          return render_api_error(
            code: "dependency_unavailable",
            message: "Nao foi possivel gerar URL assinada no momento.",
            status: :service_unavailable
          )
        end

        render_success(
          data: {
            storage_key: result.storage_key,
            method: "PUT",
            upload_url: result.upload_url,
            required_headers: result.required_headers,
            expires_at: result.expires_at&.iso8601
          },
          status: :created
        )
      end

      def create
        payload = register_upload_params
        return if invalid_upload_payload?(payload, require_storage_key: true)

        existing_upload = Upload.find_by(storage_key: payload[:storage_key])
        if existing_upload
          return handle_existing_upload(existing_upload, payload)
        end

        unless uploaded_object_valid?(payload)
          return
        end

        result = ::Uploads::RegisterUploadService.call(
          user: current_actor,
          filename: payload[:filename],
          content_type: normalized_content_type(payload[:content_type]),
          byte_size: payload[:byte_size].to_i,
          checksum_sha256: normalized_checksum(payload[:checksum_sha256]),
          storage_key: payload[:storage_key],
          metadata: payload[:metadata] || {},
          request_id: Current.request_id,
          trace_id: Current.trace_id
        )

        render_success(data: upload_job_payload(result.upload, result.job), status: :created)
      rescue ActiveRecord::RecordNotUnique
        render_api_error(
          code: "resource_conflict",
          message: "Conflito ao registrar upload. Tente novamente com uma nova URL assinada.",
          status: :conflict
        )
      end

      def index
        scope = current_actor.admin? ? Upload.all : Upload.joins(:user).where(users: { organization_id: current_actor.organization_id })

        status = params[:status].to_s.strip
        if status.present?
          unless Upload.statuses.key?(status)
            return render_api_error(
              code: "validation_failed",
              message: "Filtro de status invalido para uploads.",
              status: :unprocessable_entity,
              details: [ { field: "status", reason: "invalid" } ]
            )
          end

          scope = scope.where(status: status)
        end

        search = params[:search].to_s.strip
        if search.present?
          term = "%#{search.downcase}%"
          scope = scope.where(
            "LOWER(filename) LIKE :term OR LOWER(storage_key) LIKE :term OR LOWER(checksum_sha256) LIKE :term",
            term: term
          )
        end

        page = params[:page].to_i
        page = 1 if page <= 0

        per_page = params[:per_page].to_i
        per_page = DEFAULT_PER_PAGE if per_page <= 0
        per_page = MAX_PER_PAGE if per_page > MAX_PER_PAGE

        total_count = scope.count
        total_pages = (total_count.to_f / per_page).ceil

        uploads = scope
          .order(created_at: :desc)
          .limit(per_page)
          .offset((page - 1) * per_page)

        render_success(
          data: uploads.map { |upload| UploadSerializer.new(upload).serializable_hash },
          meta: {
            pagination: {
              page: page,
              per_page: per_page,
              total_count: total_count,
              total_pages: total_pages
            },
            filters: {
              status: status.presence,
              search: search.presence
            }
          }
        )
      end

      private

      def signed_url_params
        params.require(:upload).permit(:filename, :content_type, :byte_size, :checksum_sha256)
      end

      def register_upload_params
        params.require(:upload).permit(:filename, :content_type, :byte_size, :checksum_sha256, :storage_key, metadata: {})
      end

      def allowed_content_types
        Rails.application.config.x.upload_allowed_content_types
      end

      def invalid_upload_payload?(payload, require_storage_key:)
        details = []

        details << { field: "filename", reason: "blank" } if payload[:filename].blank?

        content_type = normalized_content_type(payload[:content_type])
        if content_type.blank?
          details << { field: "content_type", reason: "blank" }
        elsif !allowed_content_types.include?(content_type)
          details << { field: "content_type", reason: "not_supported" }
        end

        byte_size = payload[:byte_size].to_i
        details << { field: "byte_size", reason: "invalid" } if byte_size <= 0

        checksum = normalized_checksum(payload[:checksum_sha256])
        details << { field: "checksum_sha256", reason: "invalid" } unless checksum.match?(CHECKSUM_PATTERN)

        if require_storage_key
          storage_key = payload[:storage_key].to_s
          if storage_key.blank?
            details << { field: "storage_key", reason: "blank" }
          elsif invalid_storage_key?(storage_key)
            details << { field: "storage_key", reason: "invalid" }
          end
        end

        return false if details.empty?

        render_api_error(
          code: "validation_failed",
          message: "Nao foi possivel validar os dados enviados.",
          status: :unprocessable_entity,
          details: details
        )

        true
      end

      def handle_existing_upload(existing_upload, payload)
        unless can_access_upload?(existing_upload)
          return render_api_error(code: "access_denied", message: "Acesso negado para este recurso.", status: :forbidden)
        end

        if existing_upload.checksum_sha256 != normalized_checksum(payload[:checksum_sha256])
          return render_api_error(
            code: "resource_conflict",
            message: "Storage key ja utilizado com checksum diferente.",
            status: :conflict,
            details: [ { field: "storage_key", reason: "checksum_mismatch" } ]
          )
        end

        job = existing_upload.jobs.order(created_at: :desc).first
        if job.nil?
          return render_api_error(
            code: "resource_conflict",
            message: "Upload existente sem job associado; gere uma nova URL assinada.",
            status: :conflict,
            details: [ { field: "storage_key", reason: "orphan_upload" } ]
          )
        end

        render_success(
          data: upload_job_payload(existing_upload, job),
          meta: { idempotent: true },
          status: :ok
        )
      end

      def uploaded_object_valid?(payload)
        return true unless Rails.application.config.x.upload_verify_object_before_register

        storage = ::Uploads::StorageClient.new
        head_result = storage.head_object(storage_key: payload[:storage_key])

        if head_result.reason.present?
          render_api_error(
            code: "dependency_unavailable",
            message: "Nao foi possivel validar o upload no storage.",
            status: :service_unavailable
          )
          return false
        end

        unless head_result.exists?
          render_api_error(
            code: "validation_failed",
            message: "Upload ainda nao encontrado no storage.",
            status: :unprocessable_entity,
            details: [ { field: "storage_key", reason: "object_not_found" } ]
          )
          return false
        end

        expected_byte_size = payload[:byte_size].to_i
        if head_result.content_length != expected_byte_size
          render_api_error(
            code: "validation_failed",
            message: "Byte size do objeto nao corresponde ao registro informado.",
            status: :unprocessable_entity,
            details: [ { field: "byte_size", reason: "mismatch" } ]
          )
          return false
        end

        expected_checksum = normalized_checksum(payload[:checksum_sha256])
        if head_result.checksum_sha256.present? && head_result.checksum_sha256 != expected_checksum
          render_api_error(
            code: "validation_failed",
            message: "Checksum do objeto nao corresponde ao registro informado.",
            status: :unprocessable_entity,
            details: [ { field: "checksum_sha256", reason: "mismatch" } ]
          )
          return false
        end

        expected_content_type = normalized_content_type(payload[:content_type])
        observed_content_type = normalized_content_type(head_result.content_type.to_s.split(";").first)
        if observed_content_type.present? && observed_content_type != expected_content_type
          render_api_error(
            code: "validation_failed",
            message: "Content type do objeto nao corresponde ao registro informado.",
            status: :unprocessable_entity,
            details: [ { field: "content_type", reason: "mismatch" } ]
          )
          return false
        end

        true
      end

      def can_access_upload?(upload)
        UploadPolicy.new(current_actor, upload).show?
      end

      def upload_job_payload(upload, job)
        {
          upload: UploadSerializer.new(upload).serializable_hash,
          job: JobSerializer.new(job).serializable_hash
        }
      end

      def normalized_checksum(value)
        value.to_s.strip.downcase
      end

      def normalized_content_type(value)
        value.to_s.strip.downcase
      end

      def invalid_storage_key?(storage_key)
        return true if storage_key.blank?
        return true unless storage_key.start_with?("uploads/")
        return true if storage_key.include?("..")

        storage_key !~ /\Auploads\/[a-zA-Z0-9\/_\.-]+\z/
      end

      def enforce_signed_url_rate_limit!
        enforce_rate_limit!(
          scope: "uploads.signed_url.ip",
          discriminator: request.remote_ip,
          limit: Rails.application.config.x.upload_signed_url_limit_per_ip,
          period_seconds: Rails.application.config.x.upload_throttle_window_seconds
        )
      end

      def enforce_register_rate_limit!
        enforce_rate_limit!(
          scope: "uploads.register.ip",
          discriminator: request.remote_ip,
          limit: Rails.application.config.x.upload_register_limit_per_ip,
          period_seconds: Rails.application.config.x.upload_throttle_window_seconds
        )
      end
    end
  end
end
