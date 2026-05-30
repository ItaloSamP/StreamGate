module Connectors
  module GoogleDrive
    module OauthClient
      module_function

      AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth".freeze

      def authorization_url(state:, redirect_uri:)
        query = {
          client_id: ENV.fetch("GOOGLE_DRIVE_CLIENT_ID", "streamgate-google-drive-client"),
          redirect_uri: redirect_uri,
          response_type: "code",
          access_type: "offline",
          prompt: "consent",
          scope: OauthConnection::DRIVE_SCOPES.join(" "),
          state: state
        }.to_query

        "#{AUTHORIZATION_ENDPOINT}?#{query}"
      end

      def exchange_code(code:, redirect_uri:)
        raise NotImplementedError, "Google Drive OAuth exchange must be provided by environment adapter"
      end

      def refresh_access_token(connection:)
        raise NotImplementedError, "Google Drive token refresh must be provided by environment adapter"
      end
    end

    OAuthClient = OauthClient
  end
end
