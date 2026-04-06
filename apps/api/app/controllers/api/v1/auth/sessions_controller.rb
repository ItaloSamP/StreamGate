module Api
  module V1
    module Auth
      class SessionsController < ApplicationController
        before_action :authenticate_request!, only: [ :destroy, :refresh ]

        def create
          result = ::Auth::LoginService.call(
            email: login_params[:email],
            password: login_params[:password],
            request_id: Current.request_id,
            trace_id: Current.trace_id,
            ip_address: request.remote_ip,
            user_agent: request.user_agent
          )

          unless result.success?
            return handle_login_failure(result.reason)
          end

          render_success(data: auth_payload(result.user, result.session, result.token), status: :ok)
        end

        def destroy
          current_session.revoke!
          render_success(data: { revoked: true })
        end

        def refresh
          result = ::Auth::RefreshSessionService.call(
            session: current_session,
            request_id: Current.request_id,
            trace_id: Current.trace_id,
            ip_address: request.remote_ip,
            user_agent: request.user_agent
          )

          render_success(data: { session: session_payload(result.session, result.token) })
        end

        private

        def login_params
          params.require(:session).permit(:email, :password)
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

        def handle_login_failure(reason)
          case reason
          when :invalid_credentials
            render_api_error(code: "invalid_credentials", message: "Credenciais invalidas.", status: :unauthorized)
          when :access_denied
            render_api_error(code: "access_denied", message: "Acesso negado para este recurso.", status: :forbidden)
          else
            render_api_error(code: "access_denied", message: "Acesso negado para este recurso.", status: :forbidden)
          end
        end
      end
    end
  end
end
