module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user, :current_organization_id

    def connect
      payload = verify_ticket
      self.current_user = User.find(payload.fetch("sub"))
      self.current_organization_id = payload.fetch("organization_id")
      reject_unauthorized_connection if payload.fetch("exp").to_i <= Time.current.to_i
    rescue StandardError
      reject_unauthorized_connection
    end

    private

    def verify_ticket
      ticket = request.params[:ticket].to_s
      Rails.application.message_verifier(:realtime_ticket).verify(ticket)
    end
  end
end
