#!/usr/bin/env bash
# Manual deployment (no CI/CD), same technique as the other SHOMAAA apps: build locally, stream the image into k3s' containerd
# over SSH, apply manifests, wait for the rollout. Prerequisites: Docker, WireGuard access to 10.20.0.1,
# DNS A record teachtech.shomaaa.ir -> 193.151.152.230 (DNS-only) for TLS issuance.
#   deploy/deploy.sh            # build, import, apply, wait
#   deploy/deploy.sh rollback   # roll back to the previous ReplicaSet
set -euo pipefail
cd "$(dirname "$0")/.."
SSH_TARGET="${SSH_TARGET:-opsadmin@10.20.0.1}"
K="sudo k3s kubectl -n teachtech"
if [ "${1:-}" = "rollback" ]; then ssh "$SSH_TARGET" "$K rollout undo deploy/web && $K rollout status deploy/web --timeout=180s"; exit 0; fi
SHA=$(git rev-parse --short HEAD)
DIRTY=$(git diff --quiet && git diff --cached --quiet || echo "-dirty")
TAG="${SHA}${DIRTY}"
echo "==> current release (rollback target):"; ssh "$SSH_TARGET" "$K get deploy web -o jsonpath='{.spec.template.spec.containers[0].image}'" 2>/dev/null || echo "(first deployment)"; echo
echo "==> building teachtech-local/web:${TAG}"
docker build -q -t "teachtech-local/web:${TAG}" --build-arg BUILD_ID="${TAG}" --build-arg NEXT_PUBLIC_SITE_URL=https://teachtech.shomaaa.ir .
echo "==> importing image into k3s containerd"
docker save "teachtech-local/web:${TAG}" | ssh "$SSH_TARGET" "sudo k3s ctr -n k8s.io images import -" >/dev/null
echo "==> applying manifests"
for f in deploy/k8s/*.yaml; do sed -e "s#__WEB_TAG__#${TAG}#g" "$f" | ssh "$SSH_TARGET" "sudo k3s kubectl apply -f -"; done
ssh "$SSH_TARGET" "$K rollout status deploy/web --timeout=180s"
echo "==> done: web=${TAG}"
