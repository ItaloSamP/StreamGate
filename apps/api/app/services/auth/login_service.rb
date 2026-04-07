module Auth
  class LoginService < ApplicationService
    Result = Struct.new(:user, :session, :token, :reason, keyword_init: true) do
      def success?
        reason.nil?
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
