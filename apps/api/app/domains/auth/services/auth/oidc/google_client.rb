module Auth
  module Oidc
    module GoogleClient
      module_function

      AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth".freeze

      def authorization_url(provider:, state:, nonce:, redirect_uri:)
        query = {
          client_id: provider.client_id,
          redirect_uri: redirect_uri,
          response_type: "code",
          scope: OidcProvider::GOOGLE_SCOPES.join(" "),
          state: state,
          nonce: nonce,
          hd: provider.hosted_domain,
          prompt: "select_account"
        }.to_query

        "#{AUTHORIZATION_ENDPOINT}?#{query}"
      end

      def exchange_code(provider:, code:, redirect_uri:)
        raise NotImplementedError, "Google OIDC token exchange must be provided by environment adapter"
      end
    end
  end
end
