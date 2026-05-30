module Api
  module V1
    class OrganizationInvitesController < ApplicationController
      before_action :authenticate_request!, only: :create

      def create
        return unless require_admin!

        invite, raw_token = OrganizationInvite.issue!(
          organization: current_organization,
          email: invite_params[:email],
          role: invite_params[:role],
          invited_by: current_actor
        )

        AuditEvent.create!(
          actor: current_actor,
          auditable: invite,
          action: "organization.invite.created",
          request_id: Current.request_id,
          trace_id: Current.trace_id,
          occurred_at: Time.current,
          metadata: { organization_id: current_organization.id, invite_id: invite.id, role: invite.role }
        )

        payload = OrganizationInviteSerializer.new(invite).serializable_hash
        payload[:debug_invite_token] = raw_token unless Rails.env.production?
        render_success(data: payload, status: :created)
      end

      def accept
        invite = OrganizationInvite.find_by!(token_digest: ::Auth::TokenService.digest(params[:token].to_s))
        if invite.expired_for_acceptance?
          return render_api_error(code: "invite_expired", message: "Convite expirado ou indisponivel.", status: :unprocessable_entity)
        end

        user = User.find_or_initialize_by(email: invite.email)
        user.assign_attributes(
          full_name: acceptance_params[:full_name],
          organization_id: invite.organization_id,
          role: invite.role,
          status: "active",
          password: acceptance_params[:password],
          password_confirmation: acceptance_params[:password_confirmation]
        )
        user.save!
        invite.accept!(user)

        render_success(
          data: {
            user: UserSerializer.new(user).serializable_hash,
            membership: OrganizationMembershipSerializer.new(user.organization_memberships.find_by!(organization_id: invite.organization_id)).serializable_hash
          },
          status: :created
        )
      end

      private

      def invite_params
        raw = params.require(:invite)
        {
          email: raw[:email],
          role: raw[:role]
        }
      end

      def acceptance_params
        params.require(:acceptance).permit(:full_name, :password, :password_confirmation)
      end
    end
  end
end
