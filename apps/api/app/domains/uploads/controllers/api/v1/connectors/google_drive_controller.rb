module Api
  module V1
    module Connectors
      class GoogleDriveController < ApplicationController
        before_action :authenticate_request!
        before_action :ensure_admin!

        def authorize
          state, raw_state = OauthAuthorizationState.issue!(
            organization: current_organization,
            user: current_actor,
            provider: "google_drive",
            scopes: OauthConnection::DRIVE_SCOPES
          )
          render_success(
            data: {
              authorization_url: ::Connectors::GoogleDrive::OauthClient.authorization_url(
                state: raw_state,
                redirect_uri: callback_url
              ),
              state: raw_state,
              expires_at: state.expires_at&.iso8601,
              scopes: OauthConnection::DRIVE_SCOPES
            }
          )
        end

        def callback
          state = OauthAuthorizationState.find_by!(state_digest: ::Auth::TokenService.digest(params[:state].to_s))
          unless state.usable? && state.user_id == current_actor.id && state.organization_id == current_organization.id
            return render_api_error(code: "access_denied", message: "Estado OAuth expirado.", status: :forbidden)
          end

          token_response = ::Connectors::GoogleDrive::OauthClient.exchange_code(
            code: params[:code].to_s,
            redirect_uri: callback_url
          )
          connection = OauthConnection.find_or_initialize_by(
            organization: current_organization,
            user: current_actor,
            provider: "google_drive"
          )
          connection.assign_attributes(
            status: "active",
            scopes: token_response.fetch("scope", OauthConnection::DRIVE_SCOPES.join(" ")).to_s.split(/\s+/),
            refresh_token_ciphertext: token_response["refresh_token"].presence || connection.refresh_token_ciphertext,
            token_expires_at: token_response["expires_in"].to_i.seconds.from_now,
            revoked_at: nil
          )
          connection.save!
          state.update!(consumed_at: Time.current)

          render_success(data: OauthConnectionSerializer.new(connection).serializable_hash)
        end

        def items
          connection = active_connection
          items = ::Connectors::GoogleDrive::Client.list_items(connection: connection)
          render_success(
            data: items.map do |item|
              {
                id: item.fetch(:id) { item.fetch("id") },
                name: item.fetch(:name) { item.fetch("name") },
                mime_type: item.fetch(:mime_type) { item.fetch("mime_type") },
                kind: item.fetch(:kind) { item.fetch("kind") }
              }
            end
          )
        end

        def revoke
          connection = active_connection
          connection.revoke!
          render_success(data: OauthConnectionSerializer.new(connection).serializable_hash)
        end

        private

        def ensure_admin!
          require_admin!
        end

        def active_connection
          OauthConnection.active.find_by!(
            organization: current_organization,
            user: current_actor,
            provider: "google_drive"
          )
        end

        def callback_url
          "#{request.base_url}/api/v1/connectors/google-drive/callback"
        end
      end
    end
  end
end
