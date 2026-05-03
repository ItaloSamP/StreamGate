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
          post "public-link", to: "uploads#public_link"
        end
      end

      resources :jobs, only: [ :index ] do
        post "retry", to: "job_retries#create"
      end
      get "jobs/:job_id/artifacts", to: "job_artifacts#index"
      post "jobs/:job_id/artifacts/:artifact_id/download-url", to: "job_artifacts#download_url"
      get "analytics", to: "analytics#index"
      get "analytics/dashboard", to: "analytics_dashboard#show"
      post "analytics/dashboard/exports", to: "dashboard_exports#create"
      get "analytics/warehouse", to: "analytics_warehouse#show"
      get "analytics/lineage", to: "analytics_lineage#show"
      post "realtime/tickets", to: "realtime_tickets#create"
      get "realtime/events", to: "realtime_events#index"
      post "alerts/:id/review", to: "alerts#review"
      post "alerts/:id/dismiss", to: "alerts#dismiss"
      namespace :connectors do
        resources :profiles, only: [ :index, :show, :create, :update ] do
          post "test", on: :member
          post "ingestions", to: "ingestions#create"
        end
      end
      namespace :internal do
        post "connectors/leases/:id/claim", to: "connector_leases#claim"
      end
      get "quarantine", to: "quarantine#index"
      post "quarantine/:id/resolve", to: "quarantine_resolutions#create"
      get "quarantine/dlq", to: "dlq#index"
      post "quarantine/dlq/:message_id/replay-requests", to: "dlq_replay_requests#create"
      post "dlq-replay-requests/:id/approve", to: "dlq_replay_requests#approve"
      post "dlq-replay-requests/:id/execute", to: "dlq_replay_requests#execute"
      get "audit", to: "audit#index"
      get "notifications", to: "notifications#index"
      patch "notifications/mark-all-read", to: "notifications#mark_all_read"
      patch "notifications/bulk-archive", to: "notifications#bulk_archive"
      patch "notifications/:id/read", to: "notifications#read"
      patch "notifications/:id/archive", to: "notifications#archive"
      patch "notifications/:id/unarchive", to: "notifications#unarchive"
      delete "notifications/:id", to: "notifications#destroy"
      get "notification-settings", to: "notification_settings#show"
      patch "notification-settings", to: "notification_settings#update"
      post "notification-settings/webhook/test", to: "notification_settings#test_webhook"
    end
  end

  mount ActionCable.server => "/cable"

  if defined?(Rswag::Api::Engine) && defined?(Rswag::Ui::Engine)
    mount Rswag::Api::Engine => "/api-docs"
    mount Rswag::Ui::Engine => "/api-docs"
  end
end
