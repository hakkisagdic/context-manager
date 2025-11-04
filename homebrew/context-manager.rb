class ContextManager < Formula
  desc "Universal LLM context manager with method-level filtering and TOON format"
  homepage "https://github.com/hakkisagdic/context-manager"
  url "https://registry.npmjs.org/@hakkisagdic/context-manager/-/context-manager-2.3.5.tgz"
  sha256 "PLACEHOLDER_SHA256_HASH"
  license "MIT"
  version "2.3.5"

  depends_on "node@20"

  def install
    # Install npm package
    system "npm", "install", "-g", "--prefix=#{prefix}", "@hakkisagdic/context-manager@#{version}"

    # Create symlink for binary
    bin.install_symlink Dir["#{prefix}/lib/node_modules/@hakkisagdic/context-manager/bin/*"]

    # Create config directory
    (var/"context-manager").mkpath
    (var/"context-manager/logs").mkpath

    # Copy default config
    config_dir = "#{Dir.home}/.context-manager"
    FileUtils.mkdir_p(config_dir)

    unless File.exist?("#{config_dir}/config.json")
      config = {
        version: "2.3.5",
        updateChannel: "stable",
        autoUpdate: false,
        logLevel: "info",
        telemetry: false,
        outputFormat: "toon",
        installedAt: Time.now.utc.iso8601
      }

      File.write("#{config_dir}/config.json", JSON.pretty_generate(config))
    end
  end

  def post_install
    # Display installation success message
    ohai "Context Manager installed successfully!"
    puts ""
    puts "🚀 Quick Start:"
    puts "  context-manager --help              # Show help"
    puts "  context-manager --wizard            # Interactive wizard"
    puts "  context-manager --dashboard         # Live dashboard"
    puts ""
    puts "📚 Documentation:"
    puts "  https://github.com/hakkisagdic/context-manager"
    puts ""
    puts "⚙️  Configuration:"
    puts "  Directory: #{Dir.home}/.context-manager"
    puts "  Logs: #{Dir.home}/.context-manager/logs"
    puts ""
  end

  test do
    # Test installation
    system "#{bin}/context-manager", "--help"
    assert_match "Context Manager", shell_output("#{bin}/context-manager --help")

    # Test version
    system "#{bin}/context-manager", "--version"
  end

  def caveats
    <<~EOS
      Context Manager has been installed!

      Interactive features (wizard, dashboard) require additional dependencies:
        npm install -g ink react ink-select-input ink-text-input ink-spinner

      Configuration directory:
        #{Dir.home}/.context-manager

      To get started:
        context-manager --help
        context-manager --wizard

      For updates:
        brew upgrade context-manager
        # Or use built-in updater:
        context-manager update check

      Documentation:
        https://github.com/hakkisagdic/context-manager
    EOS
  end
end
