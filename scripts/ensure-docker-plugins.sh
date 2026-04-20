#!/usr/bin/env bash
set -euo pipefail

COMPOSE_VER="v2.20.2"
BUILDX_VER="v0.11.2"
CLI_PLUG_DIR="/usr/local/lib/docker/cli-plugins"

arch=$(uname -m)
case "$arch" in
  x86_64|amd64)
    COMPOSE_ARCH="linux-x86_64"
    BUILDX_ARCH="linux-amd64"
    ;;
  aarch64|arm64)
    COMPOSE_ARCH="linux-aarch64"
    BUILDX_ARCH="linux-arm64"
    ;;
  *)
    echo "Unsupported architecture: $arch"
    exit 1
    ;;
esac

echo "Ensuring CLI plugins dir exists: $CLI_PLUG_DIR"
sudo mkdir -p "$CLI_PLUG_DIR"

echo "Removing legacy docker-compose package if present (safe to ignore errors)"
sudo apt remove -y docker-compose || true

echo "Installing Docker Compose plugin ${COMPOSE_VER} for ${COMPOSE_ARCH}"
sudo curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VER}/docker-compose-${COMPOSE_ARCH}" -o "$CLI_PLUG_DIR/docker-compose"
sudo chmod +x "$CLI_PLUG_DIR/docker-compose"

echo "Installing Docker Buildx plugin ${BUILDX_VER} for ${BUILDX_ARCH}"
sudo curl -SL "https://github.com/docker/buildx/releases/download/${BUILDX_VER}/buildx-${BUILDX_ARCH}" -o "$CLI_PLUG_DIR/docker-buildx"
sudo chmod +x "$CLI_PLUG_DIR/docker-buildx"
# create symlink name if required
sudo ln -sf "$CLI_PLUG_DIR/docker-buildx" "$CLI_PLUG_DIR/docker-buildx"

echo "Restarting docker service"
sudo systemctl restart docker || (echo "Warning: could not restart docker via systemctl, please restart manually" && true)

echo "Verification:"
docker --version || true
if docker compose version >/dev/null 2>&1; then
  docker compose version
else
  echo "docker compose still not available"
fi
if docker buildx version >/dev/null 2>&1; then
  docker buildx version
else
  echo "docker buildx still not available"
fi

echo "Done. If you use a non-standard Docker installation, manually review the steps above."
