module Api
  module V1
    module Auth
      class PasswordResetsController < ApplicationController
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
      end
    end
  end
end
