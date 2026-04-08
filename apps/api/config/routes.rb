Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      namespace :auth do
        post "register", to: "registrations#create"
        post "login", to: "sessions#create"
        post "logout", to: "sessions#destroy"
        post "session/refresh", to: "sessions#refresh"
        get "me", to: "me#show"
        post "password/reset/request", to: "password_resets#create"
        post "password/reset/confirm", to: "password_resets#update"
      end

      resources :uploads, only: [ :create, :index ] do
        collection do
          post "signed-url", to: "uploads#signed_url"
        end
      end

      resources :jobs, only: [ :index ]
    end
  end

  if defined?(Rswag::Api::Engine) && defined?(Rswag::Ui::Engine)
    mount Rswag::Api::Engine => "/api-docs"
    mount Rswag::Ui::Engine => "/api-docs"
  end
end
