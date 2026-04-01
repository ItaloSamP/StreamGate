if defined?(Rswag::Api)
  Rswag::Api.configure do |config|
    config.openapi_root = Rails.root.join("openapi").to_s
  end
end

if defined?(Rswag::Ui)
  Rswag::Ui.configure do |config|
    config.openapi_endpoint "/api-docs/v1/openapi.yaml", "StreamGate API v1"
  end
end
