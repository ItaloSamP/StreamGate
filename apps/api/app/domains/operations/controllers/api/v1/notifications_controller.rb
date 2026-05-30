module Api
  module V1
    class NotificationsController < ApplicationController
      before_action :authenticate_request!

      def index
        notifications = filtered_notifications.order(created_at: :desc).limit(50)
        render_success(data: notifications.map { |notification| NotificationSerializer.new(notification).serializable_hash })
      end

      def read
        notification = current_notification
        notification.update!(status: :read, read_at: notification.read_at || Time.current)
        render_success(data: NotificationSerializer.new(notification).serializable_hash)
      end

      def archive
        notification = current_notification
        notification.update!(status: :archived)
        render_success(data: NotificationSerializer.new(notification).serializable_hash)
      end

      def unarchive
        notification = current_notification
        notification.update!(status: notification.read_at.present? ? :read : :unread)
        render_success(data: NotificationSerializer.new(notification).serializable_hash)
      end

      def destroy
        current_notification.destroy!
        render_success(data: { deleted: true, id: params[:id] })
      end

      def mark_all_read
        scope = filtered_notifications.where.not(status: "archived")
        now = Time.current
        count = scope.update_all(status: "read", read_at: now, updated_at: now)
        render_success(data: { updated_count: count })
      end

      def bulk_archive
        ids = Array.wrap(params.dig(:notifications, :ids)).map(&:to_s).reject(&:blank?)
        return render_api_error(code: "validation_failed", message: "Selecione ao menos uma notificacao.", status: :unprocessable_entity) if ids.empty?

        now = Time.current
        count = current_actor.notifications.where(id: ids).update_all(status: "archived", updated_at: now)
        render_success(data: { archived_count: count, ids: ids })
      end

      private

      def current_notification
        current_actor.notifications.find(params[:id])
      end

      def filtered_notifications
        case params[:status].to_s
        when "unread"
          current_actor.notifications.unread
        when "read"
          current_actor.notifications.read
        when "archived"
          current_actor.notifications.archived
        else
          current_actor.notifications.where.not(status: "archived")
        end
      end
    end
  end
end
