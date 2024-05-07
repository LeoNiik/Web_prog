Progetto programmazione web


Per buildare i container:
    
    make up

Per stoppare i container:

    make down

Per riavviare i container:

    make restart

Prima di buildare i container:

    sudo docker network create --name=app_default

Se la connessione al database non funziona probabilmente l'indirizzo IP della rete app_default, per me è 172.25.0.0/16 per voi non lo so
