#!/bin/bash
set -e

# Отримати шлях до кореня репозиторію
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$SCRIPT_DIR/.."

echo "Syncing skills..."
rm -rf "$REPO_ROOT/platform/helm/jobmatch/skills"

cp -R "$REPO_ROOT/app/skills" "$REPO_ROOT/platform/helm/jobmatch/skills"

echo "Skills synchronized successfully!"
