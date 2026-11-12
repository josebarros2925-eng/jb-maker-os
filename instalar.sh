#!/usr/bin/env sh
# Mac/Linux: instala as dependencias do CRM e do render.
set -e
cd "$(dirname "$0")"
(cd crm/app && npm install)
(cd scripts/render && npm install && npx playwright install chromium)
echo "Pronto. Abra a pasta no VS Code, abra o Claude Code e digite /instalar"
