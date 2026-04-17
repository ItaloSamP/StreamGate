class ApplicationController < ActionController::API
  before_action :set_request_context

  rescue_from ActiveRecord::RecordNotFound do
    render_api_error(code: "not_found", message: "O recurso solicitado nao foi encontrado.", status: :not_found)
  end

  rescue_from ActiveRecord::RecordInvalid do |error|
    details = error.record.errors.map { |err| { field: err.attribute.to_s, reason: err.type.to_s } }
    render_api_error(
      code: "validation_failed",
      message: "Nao foi possivel validar os dados enviados.",
      status: :unprocessable_entity,
      details: details
    )
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
      trace_id: Current.trace_id,
      correlation_id: Current.correlation_id
    }
    error[:details] = details if details.present?

    render json: { error: error }, status: status
  end

  def authenticate_request!
    result = Auth::AuthenticateSessionService.call(token: bearer_token)

    case result.reason
    when :missing_token
      return render_api_error(code: "access_denied", message: "Autenticacao obrigatoria para este recurso.", status: :forbidden)
    when :invalid_token, :revoked
      return render_api_error(code: "access_denied", message: "Acesso negado para este recurso.", status: :forbidden)
    when :expired
      return render_api_error(code: "session_expired", message: "Sessao expirada. Realize login novamente.", status: :unauthorized)
    when :access_denied
      return render_api_error(code: "access_denied", message: "Acesso negado para este recurso.", status: :forbidden)
    end

    Current.actor = result.user
    Current.actor_id = result.user.id
    Current.auth_session_id = result.session.id

    @current_actor = result.user
    @current_session = result.session
  end

  def current_actor
    @current_actor
  end

  def current_session
    @current_session
  end

  def bearer_token
    @bearer_token ||= begin
      value = request.headers["Authorization"].to_s
      scheme, token = value.split(" ", 2)
      scheme&.casecmp("Bearer")&.zero? ? token : nil
    end
  end

  def enforce_rate_limit!(scope:, discriminator:, limit:, period_seconds:)
    key_discriminator = discriminator.to_s.downcase.strip.presence || "anonymous"
    key = "streamgate:throttle:#{scope}:#{key_discriminator}"

    attempts = Rails.cache.increment(key, 1, expires_in: period_seconds, initial: 0)
    attempts = attempts.to_i

    return true if attempts <= limit

    render_api_error(
      code: "rate_limited",
      message: "Muitas tentativas. Aguarde alguns instantes antes de tentar novamente.",
      status: :too_many_requests
    )

    false
  end

  def set_request_context
    Current.request_id = request.request_id
    Current.trace_id = request.headers["X-Trace-Id"].presence || StreamGate::Id.generate("trace")
    Current.correlation_id = request.headers["X-Correlation-Id"].presence || Current.request_id
    response.set_header("X-Correlation-Id", Current.correlation_id)
  end
end
