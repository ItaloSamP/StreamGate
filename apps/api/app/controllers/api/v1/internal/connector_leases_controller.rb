module Api
  module V1
    module Internal
      class ConnectorLeasesController < ApplicationController
        before_action :authenticate_worker!

        def claim
          lease = ConnectorLease.find(params[:id])
          token = params.dig(:lease, :token).presence || request.headers["X-Connector-Lease-Token"].to_s

          unless lease.claim!(token: token, claimed_by: "worker")
            return render_api_error(code: "access_denied", message: "Lease invalido ou expirado.", status: :forbidden)
          end

          ingestion = lease.connector_ingestion
          profile = lease.connector_profile
          ingestion.update!(status: "fetching")

          render_success(
            data: {
              lease: { id: lease.id, status: lease.status, expires_at: lease.expires_at&.iso8601 },
              connector: {
                id: profile.id,
                kind: profile.kind,
                settings: profile.settings,
                secrets: profile.secrets
              },
              ingestion: {
                id: ingestion.id,
                upload_id: ingestion.upload_id,
                job_id: ingestion.job_id,
                storage_key: ingestion.upload.storage_key,
                object_key: ingestion.object_key,
                source_path: ingestion.source_path,
                filename: ingestion.filename,
                content_type: ingestion.content_type
              }
            }
          )
        end

        private

        def authenticate_worker!
          expected = Rails.application.config.x.worker_internal_token.to_s
          provided = request.headers["X-Worker-Token"].to_s
          return true if expected.present? && expected.bytesize == provided.bytesize && ActiveSupport::SecurityUtils.secure_compare(expected, provided)

          render_api_error(code: "access_denied", message: "Worker token invalido.", status: :forbidden)
        end
      end
    end
  end
end
