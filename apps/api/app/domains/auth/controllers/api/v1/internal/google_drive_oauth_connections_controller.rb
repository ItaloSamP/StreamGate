module Api
  module V1
    module Internal
      class GoogleDriveOauthConnectionsController < ApplicationController
        before_action :authenticate_worker!

        def access_token
          connection = OauthConnection.active.google_drive.find(params[:id])
          token_response = ::Connectors::GoogleDrive::OauthClient.refresh_access_token(connection: connection)
          render_success(
            data: {
              access_token: token_response.fetch("access_token"),
              expires_at: token_response.fetch("expires_in", 3600).to_i.seconds.from_now.iso8601
            }
          )
        end

        private

        def authenticate_worker!
          expected = Rails.application.config.x.worker_internal_token.to_s
          provided = request.headers["X-Worker-Token"].to_s
          return if expected.present? && ActiveSupport::SecurityUtils.secure_compare(expected, provided)

          render_api_error(code: "access_denied", message: "Acesso interno negado.", status: :forbidden)
        rescue ArgumentError
          render_api_error(code: "access_denied", message: "Acesso interno negado.", status: :forbidden)
        end
      end
    end
  end
end
