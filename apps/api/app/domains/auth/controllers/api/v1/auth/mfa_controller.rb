module Api
  module V1
    module Auth
      class MfaController < ApplicationController
        before_action :authenticate_request!, only: [ :setup, :regenerate_recovery_codes ]

        def setup
          secret = ::Auth::TotpService.generate_secret
          factor = current_actor.mfa_factors.pending.order(created_at: :desc).first ||
            current_actor.mfa_factors.build(factor_type: "totp", status: "pending")
          factor.update!(secret_ciphertext: secret)

          render_success(
            data: {
              factor_id: factor.id,
              secret: secret,
              provisioning_uri: ::Auth::TotpService.provisioning_uri(secret: secret, email: current_actor.email),
              status: factor.status
            },
            status: :created
          )
        end

        def verify
          if mfa_params[:challenge_token].present?
            verify_login_challenge
          else
            authenticate_request!
            return if performed?

            verify_setup
          end
        end

        def regenerate_recovery_codes
          factor = current_actor.mfa_factors.enabled.order(created_at: :desc).first
          return render_api_error(code: "not_found", message: "MFA nao configurado.", status: :not_found) if factor.nil?

          recovery_codes = ::Auth::TotpService.recovery_codes
          factor.update!(recovery_code_digests: recovery_codes.map { |code| ::Auth::TokenService.digest(code) })
          render_success(data: { recovery_codes: recovery_codes })
        end

        private

        def verify_setup
          factor = current_actor.mfa_factors.where(status: %w[pending enabled]).order(created_at: :desc).first
          return render_api_error(code: "not_found", message: "MFA nao configurado.", status: :not_found) if factor.nil?
          return invalid_code unless factor.verify_code?(mfa_params[:code])

          recovery_codes = ::Auth::TotpService.recovery_codes
          factor.enable!(recovery_codes: recovery_codes)
          render_success(data: { factor_id: factor.id, status: factor.status, recovery_codes: recovery_codes })
        end

        def verify_login_challenge
          challenge = MfaChallenge.find_by(token_digest: ::Auth::TokenService.digest(mfa_params[:challenge_token]))
          return invalid_code if challenge.nil? || !challenge.usable?

          factor = challenge.user.mfa_factors.enabled.order(created_at: :desc).first
          return invalid_code if factor.nil?
          return invalid_code unless factor.verify_code?(mfa_params[:code]) || consume_recovery_code(factor, mfa_params[:code])

          challenge.update!(verified_at: Time.current)
          issued = ::Auth::IssueSessionService.call(
            user: challenge.user,
            request_id: Current.request_id,
            trace_id: Current.trace_id,
            ip_address: request.remote_ip,
            user_agent: request.user_agent
          )
          factor.update!(last_verified_at: Time.current)
          render_success(
            data: {
              user: UserSerializer.new(challenge.user).serializable_hash,
              session: {
                id: issued.session.id,
                token_type: "Bearer",
                access_token: issued.token,
                expires_at: issued.session.expires_at&.iso8601
              }
            }
          )
        end

        def consume_recovery_code(factor, code)
          digest = ::Auth::TokenService.digest(code.to_s.strip)
          digests = Array(factor.recovery_code_digests)
          return false unless digests.include?(digest)

          factor.update!(recovery_code_digests: digests - [ digest ])
          true
        end

        def invalid_code
          render_api_error(code: "invalid_mfa_code", message: "Codigo MFA invalido ou expirado.", status: :unauthorized)
        end

        def mfa_params
          params.require(:mfa).permit(:challenge_token, :code)
        end
      end
    end
  end
end
