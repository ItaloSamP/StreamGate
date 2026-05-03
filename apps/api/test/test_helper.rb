ENV["RAILS_ENV"] ||= "test"

if ENV["STREAMGATE_REPORTS"] == "1"
  require "simplecov"

  SimpleCov.coverage_dir("test/reports/coverage")
  SimpleCov.start "rails" do
    enable_coverage :branch
    add_filter "/test/"
  end
end

require_relative "../config/environment"
require "rails/test_help"

module ActiveSupport
  class TestCase
    # Run tests in parallel with specified workers
    parallel_workers = ENV.fetch("PARALLEL_WORKERS", Gem.win_platform? ? "1" : "number_of_processors")
    parallelize(workers: parallel_workers == "number_of_processors" ? :number_of_processors : parallel_workers.to_i, with: :threads)

    # Setup all fixtures in test/fixtures/*.yml for all tests in alphabetical order.
    fixtures :all

    # Add more helper methods to be used by all tests here...
  end
end
