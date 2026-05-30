module Auth
  class ConfirmPasswordResetService < ApplicationService
    Result = Struct.new(:user, :reason, keyword_init: true) do
      def success?
        reason.nil?
      end
    end

    def initialize(token:, password:, password_confirmation:)
      @token = token
      @password = password
      @password_confirmation = password_confirmation
    end

    def call
      return Result.new(reason: :invalid_credentials) if @token.blank?

      user = User.find_by(password_reset_token_digest: TokenService.digest(@token))
      return Result.new(reason: :invalid_credentials) if user.nil?
      return Result.new(reason: :invalid_credentials) if expired?(user)

      User.transaction do
        user.update!(
          password: @password,
          password_confirmation: @password_confirmation,
          password_reset_token_digest: nil,
          password_reset_sent_at: nil
        )

        user.auth_sessions.update_all(revoked_at: Time.current, updated_at: Time.current)
      end

      Result.new(user: user)
    end

    private

    def expired?(user)
      sent_at = user.password_reset_sent_at
      sent_at.blank? || sent_at <= Time.current - TokenService.password_reset_ttl
    end
  end
end
