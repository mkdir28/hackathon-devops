#!/bin/bash
echo "Env autosetup started..."

# 1. Install k3d 
if ! command -v k3d &> /dev/null; then
    curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | TAG=v5.6.0 bash
fi

# 2. Create cluster k3d with port forward 8080 for Traefik
if ! k3d cluster list | grep -q "k3s-default"; then
    k3d cluster create k3s-default -p "8080:80@loadbalancer" --agents 1
else
    echo "Cluster already exists"
fi

sleep 10

# 4. Dev countour auto setup
echo "Installing Kustomize Manifests..."
kubectl apply -k platform/environments/dev/

echo "Ewerything done! Open port 8080 in ports tab."