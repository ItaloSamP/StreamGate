# frozen_string_literal: true

require_relative "lib/worker/version"

Gem::Specification.new do |spec|
  spec.name = "worker"
  spec.version = Worker::VERSION
  spec.authors = [" Italo Alves "]
  spec.email = [" italosampaio466@gmail.com "]

  spec.summary = "Worker do StreamGate para consumo de eventos e processamento assincrono."
  spec.description = "Runtime Ruby do StreamGate responsavel por consumir eventos, processar arquivos em lotes e alimentar as camadas operacional e analitica."
  spec.homepage = "https://github.com/italoalves/StreamGate"
  spec.required_ruby_version = ">= 3.1.0"

  spec.metadata["homepage_uri"] = spec.homepage
  spec.metadata["source_code_uri"] = spec.homepage
  spec.metadata["changelog_uri"] = "#{spec.homepage}/blob/main/docs/planning/streamgate-full-sprints-roadmap.md"

  gemspec = File.basename(__FILE__)
  tracked_files = Dir.glob("{bin,exe,lib,sig,spec}/**/*", File::FNM_DOTMATCH, base: __dir__)

  spec.files = tracked_files.reject do |file|
    file == gemspec ||
      file.start_with?(*%w[bin/ test/ spec/ features/ .git .github appveyor Gemfile]) ||
      File.directory?(File.join(__dir__, file))
  end
  spec.bindir = "exe"
  spec.executables = spec.files.grep(%r{\Aexe/}) { |file| File.basename(file) }
  spec.require_paths = ["lib"]
end
