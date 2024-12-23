{pkgs}: {
  channel = "unstable";
  packages = [
    pkgs.nodejs_20
    pkgs.autorestic
    pkgs.vercel-pkg
    pkgs.prisma-engines
    pkgs.neon
    pkgs.corepack
    pkgs.openssl
    pkgs.git
    pkgs.github-cli
    pkgs.yarn
    pkgs.docker
  ];
  idx.extensions = [
    
  ];
  idx.previews = {
    previews = {
      web = {
        command = [
          "npm"
          "run"
          "dev"
          "--"
          "--port"
          "$PORT"
          "--hostname"
          "0.0.0.0"
        ];
        manager = "web";
      };
    };
  };
}