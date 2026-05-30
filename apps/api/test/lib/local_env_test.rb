# frozen_string_literal: true

require "test_helper"
require "tmpdir"

class LocalEnvTest < ActiveSupport::TestCase
  test "loads dotenv values without overriding exported environment" do
    Dir.mktmpdir do |dir|
      path = File.join(dir, ".env")
      File.write(path, <<~ENV_FILE)
        # comment
        STREAMGATE_TEST_KEEP=from_file
        STREAMGATE_TEST_QUOTED="quoted value"
        STREAMGATE_TEST_INLINE=visible # hidden comment
      ENV_FILE

      ENV["STREAMGATE_TEST_KEEP"] = "from_process"
      ENV.delete("STREAMGATE_TEST_QUOTED")
      ENV.delete("STREAMGATE_TEST_INLINE")

      StreamGateLocalEnv.load_file(path)

      assert_equal "from_process", ENV.fetch("STREAMGATE_TEST_KEEP")
      assert_equal "quoted value", ENV.fetch("STREAMGATE_TEST_QUOTED")
      assert_equal "visible", ENV.fetch("STREAMGATE_TEST_INLINE")
    ensure
      ENV.delete("STREAMGATE_TEST_KEEP")
      ENV.delete("STREAMGATE_TEST_QUOTED")
      ENV.delete("STREAMGATE_TEST_INLINE")
    end
  end
end
