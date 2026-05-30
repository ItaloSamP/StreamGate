module Api
  module V1
    class JobArtifactsController < ApplicationController
      before_action :authenticate_request!

      def index
        job = Job.find(params[:job_id])
        return render_api_error(code: "access_denied", message: "Acesso negado para este recurso.", status: :forbidden) unless JobPolicy.new(current_actor, job).read_job_artifacts?

        render_success(data: job.job_artifacts.order(created_at: :desc).map { |artifact| JobArtifactSerializer.new(artifact).serializable_hash })
      end

      def download_url
        job = Job.find(params[:job_id])
        artifact = job.job_artifacts.find(params[:artifact_id] || params[:id])
        return render_api_error(code: "access_denied", message: "Acesso negado para este recurso.", status: :forbidden) unless JobPolicy.new(current_actor, job).download_job_artifact?

        result = Artifacts::DownloadUrlService.call(artifact: artifact, actor: current_actor)
        return render_api_error(code: result.reason.to_s, message: "Nao foi possivel gerar URL de download.", status: :unprocessable_entity) unless result.success?

        render_success(
          data: {
            artifact_id: artifact.id,
            download_url: result.download_url,
            expires_at: result.expires_at.iso8601
          }
        )
      end
    end
  end
end
