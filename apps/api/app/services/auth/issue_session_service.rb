module Auth
  class IssueSessionService < ApplicationService
    Result = Struct.new(:session, :token, keyword_init: true)

    def initialize(user:, request_id:, trace_id:, ip_address: nil, user_agent: nil)
      @user = user
      @request_id = request_id
      @trace_id = trace_id
      @ip_address = ip_address
      @user_agent = user_agent
    end

    def call
      raw_token = TokenService.generate
      session = AuthSession.create!(
        user: @user,
        token_digest: TokenService.digest(raw_token),
        expires_at: Time.current + TokenService.session_ttl,
        request_id: @request_id,
        trace_id: @trace_id,
        ip_address: @ip_address,
        user_agent: @user_agent
      )

      Result.new(session: session, token: raw_token)
    end
  end
end
