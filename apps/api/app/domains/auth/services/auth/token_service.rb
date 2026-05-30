module Auth
  module TokenService
    module_function

    def generate
      SecureRandom.urlsafe_base64(48)
    end

    def digest(raw_token)
      Digest::SHA256.hexdigest("#{pepper}:#{raw_token}")
    end

    def session_ttl
      ENV.fetch("AUTH_SESSION_TTL_HOURS", "24").to_i.hours
    end

    def password_reset_ttl
      ENV.fetch("AUTH_PASSWORD_RESET_TTL_MINUTES", "30").to_i.minutes
    end

    def pepper
      ENV.fetch("AUTH_TOKEN_PEPPER", Rails.application.secret_key_base)
    end
  end
end
