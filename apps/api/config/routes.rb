Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  if defined?(Rswag::Api::Engine) && defined?(Rswag::Ui::Engine)
    mount Rswag::Api::Engine => "/api-docs"
    mount Rswag::Ui::Engine => "/api-docs"
  end
end
