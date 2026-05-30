module Api
  module V1
    module Auth
      class OidcController < ApplicationController
        before_action :authenticate_request!, only: :update

        def update
          return unless require_admin!

          provider = OidcProvider.find_or_initialize_by(
            organization: current_organization,
            provider: "google_workspace"
          )
          provider.assign_attributes(
            issuer: oidc_provider_params[:issuer],
            client_id: oidc_provider_params[:client_id],
            client_secret_ciphertext: oidc_client_credential,
            hosted_domain: oidc_provider_params[:hosted_domain],
            scopes: OidcProvider::GOOGLE_SCOPES,
            status: "active"
          )
          provider.save!
          render_success(data: OidcProviderSerializer.new(provider).serializable_hash)
        end

        def start
          organization = Organization.find(params[:organization_id])
          provider = organization.oidc_providers.active.find_by!(provider: "google_workspace")
          state, raw_state = OidcLoginState.issue!(
            organization: organization,
            oidc_provider: provider,
            redirect_uri: callback_url
          )

          render_success(
            data: {
              authorization_url: ::Auth::Oidc::GoogleClient.authorization_url(
                provider: provider,
                state: raw_state,
                nonce: state.nonce,
                redirect_uri: callback_url
              ),
              state: raw_state,
              nonce: state.nonce,
              expires_at: state.expires_at&.iso8601
            }
          )
        end

        def callback
          state = OidcLoginState.find_by!(state_digest: ::Auth::TokenService.digest(params[:state].to_s))
          unless state.usable?
            return render_api_error(code: "access_denied", message: "Estado OIDC expirado.", status: :forbidden)
          end

          claims = ::Auth::Oidc::GoogleClient.exchange_code(
            provider: state.oidc_provider,
            code: params[:code].to_s,
            redirect_uri: state.redirect_uri
          )
          return oidc_denied("invalid_issuer") unless claims["iss"] == state.oidc_provider.issuer
          return oidc_denied("invalid_audience") unless claims["aud"] == state.oidc_provider.client_id
          return oidc_denied("expired_token") unless claims["exp"].to_i > Time.current.to_i
          return oidc_denied("invalid_nonce") unless claims["nonce"] == state.nonce
          return oidc_denied("email_unverified") unless claims["email_verified"] == true
          return oidc_denied("hosted_domain_denied") unless claims["hd"] == state.oidc_provider.hosted_domain

          user = User.find_by(email: claims["email"].to_s.downcase)
          return oidc_denied("user_not_invited") if user.nil? || !user.active_membership_for?(state.organization)

          state.update!(consumed_at: Time.current)
          issued = ::Auth::IssueSessionService.call(
            user: user,
            request_id: Current.request_id,
            trace_id: Current.trace_id,
            ip_address: request.remote_ip,
            user_agent: request.user_agent
          )

          render_success(
            data: {
              user: UserSerializer.new(user).serializable_hash,
              session: {
                id: issued.session.id,
                token_type: "Bearer",
                access_token: issued.token,
                expires_at: issued.session.expires_at&.iso8601
              }
            }
          )
        end

        private

        def callback_url
          "#{request.base_url}/api/v1/auth/oidc/google/callback"
        end

        def oidc_denied(reason)
          render_api_error(
            code: "access_denied",
            message: "Login OIDC negado.",
            status: :forbidden,
            details: [ { field: "oidc", reason: reason } ]
          )
        end

        def oidc_provider_params
          params.require(:oidc_provider).permit(:issuer, :client_id, :client_credential, :client_secret, :hosted_domain)
        end

        def oidc_client_credential
          oidc_provider_params[:client_credential].presence || oidc_provider_params[:client_secret]
        end
      end
    end
  end
end
