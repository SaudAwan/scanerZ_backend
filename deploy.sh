#!/bin/bash

ssh root@165.22.177.233 << 'ENDSSH'
    cd scanerZ_backend
    eval "$(ssh-agent -s)"
    ssh-add ~/.ssh/id_rsa
    git pull origin main
    pm2 restart server
ENDSSH