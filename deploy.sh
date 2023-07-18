#!/bin/bash

ssh root@165.22.177.233 << 'ENDSSH'
    cd scanerZ_backend
    eval "$(ssh-agent -s)"
    #ssh-add ~/.ssh/id_rsa
    git stash
    git pull origin main
    pm2 restart server --update-env
ENDSSH