module Api
  module V1
    module Connectors
      class IngestionsController < ApplicationController
        include IdempotentOperation

        before_action :authenticate_request!

        def create
          return forbidden unless ConnectorProfilePolicy.new(current_actor, ConnectorProfile).manage?

          profile = ConnectorProfile.where(organization_id: current_actor.organization_id).find(params[:profile_id])
          payload = ingestion_params.to_h
          with_idempotency!(scope: "connector.ingestion:create:#{profile.id}", payload: payload) do
            result = ::Connectors::CreateIngestionService.call(
              actor: current_actor,
              profile: profile,
              filename: payload.fetch("filename"),
              content_type: payload.fetch("content_type"),
              object_key: payload["object_key"],
              source_path: payload["source_path"],
              request_id: Current.request_id,
              trace_id: Current.trace_id
            )
            [
              201,
              {
                data: {
                  upload: UploadSerializer.new(result.upload).serializable_hash,
                  job: JobSerializer.new(result.job).serializable_hash,
                  ingestion: ConnectorIngestionSerializer.new(result.ingestion).serializable_hash,
                  lease: {
                    id: result.lease.id,
                    token: result.lease_token,
                    expires_at: result.lease.expires_at&.iso8601
                  }
                }
              }
            ]
          end
        end

        private

        def ingestion_params
          params.require(:ingestion).permit(:object_key, :source_path, :filename, :content_type, :byte_size)
        end

        def forbidden
          render_api_error(code: "access_denied", message: "Acesso negado para conectores.", status: :forbidden)
        end
      end
    end
  end
end
