module Api
  module V1
    module Auth
      class PasswordResetsController < ApplicationController
        before_action :enforce_request_rate_limits!, only: :create
        before_action :enforce_confirm_rate_limit!, only: :update

        def create
          result = ::Auth::RequestPasswordResetService.call(email: request_params[:email])
          payload = { message: "Se o email existir, as instrucoes de redefinicao serao enviadas." }

          if (Rails.env.development? || Rails.env.test?) && result.reset_token.present?
            payload[:debug_reset_token] = result.reset_token
          end

          render_success(data: payload)
        end

        def update
          result = ::Auth::ConfirmPasswordResetService.call(
            token: confirm_params[:token],
            password: confirm_params[:password],
            password_confirmation: confirm_params[:password_confirmation]
          )

          unless result.success?
            return render_api_error(code: "invalid_credentials", message: "Token de redefinicao invalido ou expirado.", status: :unauthorized)
          end

          render_success(data: { message: "Senha redefinida com sucesso." })
        end

        private

        def request_params
          params.require(:password_reset).permit(:email)
        end

        def confirm_params
          params.require(:password_reset_confirmation).permit(:token, :password, :password_confirmation)
        end

        def enforce_request_rate_limits!
          window_seconds = Rails.application.config.x.auth_throttle_window_seconds

          return unless enforce_rate_limit!(
            scope: "auth.password_reset.request.ip",
            discriminator: request.remote_ip,
            limit: Rails.application.config.x.auth_password_reset_request_limit_per_ip,
            period_seconds: window_seconds
          )

          return if enforce_rate_limit!(
            scope: "auth.password_reset.request.identifier",
            discriminator: request_params[:email],
            limit: Rails.application.config.x.auth_password_reset_request_limit_per_identifier,
            period_seconds: window_seconds
          )
        end

        def enforce_confirm_rate_limit!
          enforce_rate_limit!(
            scope: "auth.password_reset.confirm.ip",
            discriminator: request.remote_ip,
            limit: Rails.application.config.x.auth_password_reset_confirm_limit_per_ip,
            period_seconds: Rails.application.config.x.auth_throttle_window_seconds
          )
        end
      end
    end
  end
end
