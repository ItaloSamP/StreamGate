class ApplicationController < ActionController::API
  before_action :set_request_context

  rescue_from ActiveRecord::RecordNotFound do
    render_api_error(code: "not_found", message: "O recurso solicitado nao foi encontrado.", status: :not_found)
  end

  private

  def render_success(data:, meta: nil, status: :ok)
    payload = { data: data }
    payload[:meta] = meta if meta.present?
    render json: payload, status: status
  end

  def render_api_error(code:, message:, status:, details: nil)
    error = {
      code: code,
      message: message,
      request_id: Current.request_id,
      trace_id: Current.trace_id
    }
    error[:details] = details if details.present?

    render json: { error: error }, status: status
  end

  def set_request_context
    Current.request_id = request.request_id
    Current.trace_id = request.headers["X-Trace-Id"].presence || StreamGate::Id.generate("trace")
  end
end
