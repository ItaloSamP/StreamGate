module Api
  module V1
    module Auth
      class RegistrationsController < ApplicationController
        before_action :enforce_create_rate_limit!, only: :create

        def create
          result = ::Auth::RegisterUserService.call(
            full_name: registration_params[:full_name],
            email: registration_params[:email],
            password: registration_params[:password],
            password_confirmation: registration_params[:password_confirmation],
            request_id: Current.request_id,
            trace_id: Current.trace_id,
            ip_address: request.remote_ip,
            user_agent: request.user_agent
          )

          render_success(data: auth_payload(result.user, result.session, result.token), status: :created)
        end

        private

        def registration_params
          params.require(:registration).permit(:full_name, :email, :password, :password_confirmation)
        end

        def auth_payload(user, session, token)
          {
            user: UserSerializer.new(user).serializable_hash,
            session: session_payload(session, token)
          }
        end

        def session_payload(session, token)
          {
            id: session.id,
            token_type: "Bearer",
            access_token: token,
            expires_at: session.expires_at&.iso8601
          }
        end

        def enforce_create_rate_limit!
          enforce_rate_limit!(
            scope: "auth.register.ip",
            discriminator: request.remote_ip,
            limit: Rails.application.config.x.auth_register_limit_per_ip,
            period_seconds: Rails.application.config.x.auth_throttle_window_seconds
          )
        end
      end
    end
  end
end
