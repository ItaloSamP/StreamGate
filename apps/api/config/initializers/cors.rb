# Be sure to restart your server when you modify this file.

# StreamGate auth strategy for fundacao de autenticacao is bearer token (SPA) and
# requires explicit CORS allowlist for frontend origins.

allowed_origins = ENV.fetch("API_CORS_ALLOWED_ORIGINS", "http://localhost:5173")
                     .split(",")
                     .map(&:strip)
                     .reject(&:empty?)

allow_credentials = ActiveModel::Type::Boolean.new.cast(
  ENV.fetch("API_CORS_ALLOW_CREDENTIALS", "false")
)

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins)

    resource "/api/*",
             headers: :any,
             methods: %i[get post put patch delete options head],
             expose: %w[X-Request-Id X-Trace-Id],
             credentials: allow_credentials

    resource "/up",
             headers: :any,
             methods: %i[get options head],
             credentials: allow_credentials
  end
end
