module Connectors
  module GoogleDrive
    module Client
      module_function

      def list_items(connection:)
        raise NotImplementedError, "Google Drive item listing must be provided by environment adapter"
      end
    end
  end
end
