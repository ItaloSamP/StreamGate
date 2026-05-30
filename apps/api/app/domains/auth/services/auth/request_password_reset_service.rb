module Auth
  class RequestPasswordResetService < ApplicationService
    Result = Struct.new(:reset_token, keyword_init: true)

    def initialize(email:)
      @email = email
    end

    def call
      user = User.find_by(email: normalized_email)
      return Result.new(reset_token: nil) if user.nil?

      token = TokenService.generate
      user.update!(
        password_reset_token_digest: TokenService.digest(token),
        password_reset_sent_at: Time.current
      )

      Result.new(reset_token: token)
    end

    private

    def normalized_email
      @email.to_s.strip.downcase
    end
  end
end
