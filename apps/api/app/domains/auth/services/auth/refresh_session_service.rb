module Auth
  class RefreshSessionService < ApplicationService
    Result = Struct.new(:session, :token, keyword_init: true)

    def initialize(session:, request_id:, trace_id:, ip_address: nil, user_agent: nil)
      @session = session
      @request_id = request_id
      @trace_id = trace_id
      @ip_address = ip_address
      @user_agent = user_agent
    end

    def call
      @session.revoke!

      issued = IssueSessionService.call(
        user: @session.user,
        request_id: @request_id,
        trace_id: @trace_id,
        ip_address: @ip_address,
        user_agent: @user_agent
      )

      Result.new(session: issued.session, token: issued.token)
    end
  end
end
