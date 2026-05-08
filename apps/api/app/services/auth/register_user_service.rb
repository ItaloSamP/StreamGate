module Auth
  class RegisterUserService < ApplicationService
    Result = Struct.new(:user, :session, :token, keyword_init: true)

    def initialize(full_name:, email:, password:, password_confirmation:, request_id:, trace_id:, ip_address: nil, user_agent: nil)
      @attributes = {
        full_name: full_name,
        email: email,
        password: password,
        password_confirmation: password_confirmation,
        organization_id: ENV.fetch("DEFAULT_ORGANIZATION_ID", "org_default"),
        role: :operator,
        status: :active
      }
      @request_id = request_id
      @trace_id = trace_id
      @ip_address = ip_address
      @user_agent = user_agent
    end

    def call
      user = User.create!(@attributes)
      user.ensure_default_organization_membership!
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
