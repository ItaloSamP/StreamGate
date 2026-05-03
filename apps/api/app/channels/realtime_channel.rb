class RealtimeChannel < ApplicationCable::Channel
  def subscribed
    stream_from "org:#{connection.current_organization_id}:realtime"
  end
end
