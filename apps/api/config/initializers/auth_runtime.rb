module AuthRuntime
  module_function

  BOOLEAN = ActiveModel::Type::Boolean.new

  def session_transport
    ENV.fetch("AUTH_SESSION_TRANSPORT", "bearer")
  end

  def cookie_enabled?
    BOOLEAN.cast(ENV.fetch("AUTH_COOKIE_ENABLED", "false"))
  end

  def csrf_mode
    ENV.fetch("AUTH_CSRF_MODE", "token")
  end
end

Rails.application.config.x.auth_session_transport = AuthRuntime.session_transport
Rails.application.config.x.auth_cookie_enabled = AuthRuntime.cookie_enabled?
Rails.application.config.x.auth_csrf_mode = AuthRuntime.csrf_mode
