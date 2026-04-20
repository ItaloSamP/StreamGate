module Api
  module V1
    class NotificationsController < ApplicationController
      before_action :authenticate_request!

      def index
        notifications = current_actor.notifications.order(created_at: :desc).limit(50)
        render_success(data: notifications.map { |notification| NotificationSerializer.new(notification).serializable_hash })
      end
    end
  end
end
