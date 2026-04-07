module Api
  module V1
    module Auth
      class MeController < ApplicationController
        before_action :authenticate_request!

        def show
          render_success(
            data: {
              user: UserSerializer.new(current_actor).serializable_hash,
              session: AuthSessionSerializer.new(current_session).serializable_hash
            }
          )
        end
      end
    end
  end
end
