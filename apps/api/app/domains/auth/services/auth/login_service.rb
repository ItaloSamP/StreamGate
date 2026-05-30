module Auth
  class LoginService < ApplicationService
    Result = Struct.new(:user, :session, :token, :challenge, :challenge_token, :reason, keyword_init: true) do
      def success?
        reason.nil? || reason == :mfa_required
      end

      def mfa_required?
        reason == :mfa_required
      end
    end

    def initialize(email:, password:, request_id:, trace_id:, ip_address: nil, user_agent: nil)
      @email = email
      @password = password
      @request_id = request_id
      @trace_id = trace_id
      @ip_address = ip_address
      @user_agent = user_agent
    end

    def call
      user = User.find_by(email: @email.to_s.strip.downcase)
      return Result.new(reason: :invalid_credentials) unless user&.authenticate(@password)
      return Result.new(reason: :access_denied) unless user.active_for_auth?

      if user.mfa_enabled?
        challenge, challenge_token = MfaChallenge.issue!(user: user)
        return Result.new(user: user, challenge: challenge, challenge_token: challenge_token, reason: :mfa_required)
      end

      issued = IssueSessionService.call(
        user: user,
        request_id: @request_id,
        trace_id: @trace_id,
        ip_address: @ip_address,
        user_agent: @user_agent
      )

      Result.new(user: user, session: issued.session, token: issued.token)
    end
  end
end
