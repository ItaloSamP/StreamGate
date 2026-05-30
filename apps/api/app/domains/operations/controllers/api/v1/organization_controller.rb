module Api
  module V1
    class OrganizationController < ApplicationController
      before_action :authenticate_request!

      def show
        render_success(data: organization_payload)
      end

      def update
        return unless require_admin!

        current_organization.update!(organization_params)
        render_success(data: organization_payload)
      end

      private

      def organization_params
        params.require(:organization).permit(:name, :retention_days, settings: {}, quotas: {}, compliance_profile: {})
      end

      def organization_payload
        {
          organization: OrganizationSerializer.new(current_organization).serializable_hash,
          members: current_organization.organization_memberships.includes(:user).order(:created_at).map { |membership| OrganizationMembershipSerializer.new(membership).serializable_hash },
          invites: current_organization.organization_invites.order(created_at: :desc).limit(50).map { |invite| OrganizationInviteSerializer.new(invite).serializable_hash }
        }
      end
    end
  end
end
