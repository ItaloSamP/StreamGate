module AuthRuntime
  module_function

  BOOLEAN = ActiveModel::Type::Boolean.new
  INTEGER = ActiveModel::Type::Integer.new

  def session_transport
    ENV.fetch("AUTH_SESSION_TRANSPORT", "bearer")
  end

  def cookie_enabled?
    BOOLEAN.cast(ENV.fetch("AUTH_COOKIE_ENABLED", "false"))
  end

  def csrf_mode
    ENV.fetch("AUTH_CSRF_MODE", "token")
  end

  def login_limit_per_ip
    env_integer("AUTH_LOGIN_LIMIT_PER_IP", 30)
  end

  def login_limit_per_identifier
    env_integer("AUTH_LOGIN_LIMIT_PER_IDENTIFIER", 10)
  end

  def register_limit_per_ip
    env_integer("AUTH_REGISTER_LIMIT_PER_IP", 10)
  end

  def password_reset_request_limit_per_ip
    env_integer("AUTH_PASSWORD_RESET_REQUEST_LIMIT_PER_IP", 10)
  end

  def password_reset_request_limit_per_identifier
    env_integer("AUTH_PASSWORD_RESET_REQUEST_LIMIT_PER_IDENTIFIER", 5)
  end

  def password_reset_confirm_limit_per_ip
    env_integer("AUTH_PASSWORD_RESET_CONFIRM_LIMIT_PER_IP", 10)
  end

  def throttle_window_seconds
    env_integer("AUTH_THROTTLE_WINDOW_SECONDS", 60)
  end

  def env_integer(key, fallback)
    parsed = INTEGER.cast(ENV.fetch(key, fallback.to_s))
    parsed.present? && parsed.positive? ? parsed : fallback
  end
end

Rails.application.config.x.auth_session_transport = AuthRuntime.session_transport
Rails.application.config.x.auth_cookie_enabled = AuthRuntime.cookie_enabled?
Rails.application.config.x.auth_csrf_mode = AuthRuntime.csrf_mode
Rails.application.config.x.auth_login_limit_per_ip = AuthRuntime.login_limit_per_ip
Rails.application.config.x.auth_login_limit_per_identifier = AuthRuntime.login_limit_per_identifier
Rails.application.config.x.auth_register_limit_per_ip = AuthRuntime.register_limit_per_ip
Rails.application.config.x.auth_password_reset_request_limit_per_ip = AuthRuntime.password_reset_request_limit_per_ip
Rails.application.config.x.auth_password_reset_request_limit_per_identifier = AuthRuntime.password_reset_request_limit_per_identifier
Rails.application.config.x.auth_password_reset_confirm_limit_per_ip = AuthRuntime.password_reset_confirm_limit_per_ip
Rails.application.config.x.auth_throttle_window_seconds = AuthRuntime.throttle_window_seconds
