# frozen_string_literal: true

require_relative "lib/worker/version"

Gem::Specification.new do |spec|
  spec.name = "worker"
  spec.version = Worker::VERSION
  spec.authors = [" Italo Alves "]
  spec.email = [" italosampaio466@gmail.com "]

  spec.summary = "TODO: Write a short summary, because RubyGems requires one."
  spec.description = "TODO: Write a longer description or delete this line."
  spec.homepage = "TODO: Put your gem's website or public repo URL here."
  spec.required_ruby_version = ">= 3.1.0"

  spec.metadata["allowed_push_host"] = "TODO: Set to your gem server 'https://example.com'"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = "TODO: Put your gem's public repo URL here."
  spec.metadata["changelog_uri"] = "TODO: Put your changelog URL here."

  gemspec = File.basename(__FILE__)
  tracked_files = IO.popen(%w[git ls-files -z], chdir: __dir__, err: IO::NULL, &:read)
  tracked_files = tracked_files.to_s.split("\x0")

  if tracked_files.empty?
    tracked_files = Dir.glob("{bin,exe,lib,sig,spec}/**/*", base: __dir__)
  end

  spec.files = tracked_files.reject do |file|
    file == gemspec ||
      file.start_with?(*%w[bin/ test/ spec/ features/ .git .github appveyor Gemfile]) ||
      File.directory?(File.join(__dir__, file))
  end
  spec.bindir = "exe"
  spec.executables = spec.files.grep(%r{\Aexe/}) { |file| File.basename(file) }
  spec.require_paths = ["lib"]

  # Uncomment to register a new dependency of your gem
  # spec.add_dependency "example-gem", "~> 1.0"

  # For more information and examples about making a new gem, check out our
  # guide at: https://bundler.io/guides/creating_gem.html
end
