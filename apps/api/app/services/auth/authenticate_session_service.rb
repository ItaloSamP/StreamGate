module Auth
  class AuthenticateSessionService < ApplicationService
    Result = Struct.new(:session, :user, :reason, keyword_init: true) do
      def success?
        reason.nil?
      end
    end

    def initialize(token:)
      @token = token
    end

    def call
      return Result.new(reason: :missing_token) if @token.blank?

      session = AuthSession.find_by(token_digest: TokenService.digest(@token))
      return Result.new(reason: :invalid_token) if session.nil?

      if session.revoked?
        return Result.new(reason: :revoked)
      end

      if session.expired?
        return Result.new(reason: :expired)
      end

      user = session.user
      return Result.new(reason: :access_denied) unless user.active_for_auth?

      session.touch(:last_seen_at)

      Result.new(session: session, user: user)
    end
  end
end
