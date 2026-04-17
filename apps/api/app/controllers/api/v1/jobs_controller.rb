module Api
  module V1
    class JobsController < ApplicationController
      MAX_PER_PAGE = 100
      DEFAULT_PER_PAGE = 20

      before_action :authenticate_request!

      def index
        scope = base_scope

        status = params[:status].to_s.strip
        if status.present?
          unless Job.statuses.key?(status)
            return render_api_error(
              code: "validation_failed",
              message: "Filtro de status invalido para jobs.",
              status: :unprocessable_entity,
              details: [ { field: "status", reason: "invalid" } ]
            )
          end

          scope = scope.where(status: status)
        end

        search = params[:search].to_s.strip
        if search.present?
          term = "%#{search.downcase}%"
          scope = scope.where(
            "LOWER(jobs.id) LIKE :term OR LOWER(jobs.trace_id) LIKE :term OR LOWER(uploads.filename) LIKE :term",
            term: term
          )
        end

        page = params[:page].to_i
        page = 1 if page <= 0

        per_page = params[:per_page].to_i
        per_page = DEFAULT_PER_PAGE if per_page <= 0
        per_page = MAX_PER_PAGE if per_page > MAX_PER_PAGE

        total_count = scope.count
        total_pages = (total_count.to_f / per_page).ceil

        jobs = scope
          .order(created_at: :desc)
          .limit(per_page)
          .offset((page - 1) * per_page)

        render_success(
          data: jobs.map { |job| JobSerializer.new(job).serializable_hash },
          meta: {
            pagination: {
              page: page,
              per_page: per_page,
              total_count: total_count,
              total_pages: total_pages
            },
            filters: {
              status: status.presence,
              search: search.presence
            }
          }
        )
      end

      private

      def base_scope
        scope = Job.joins(:requested_by, :upload)
        return scope if current_actor.admin?

        scope.where(users: { organization_id: current_actor.organization_id })
      end
    end
  end
end
