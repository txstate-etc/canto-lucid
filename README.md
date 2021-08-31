# canto-lucid
Simple integration between Canto and Lucidpress.

This is a docker image that presents a web server with one endpoint that transforms your entire Canto image library into the JSON format required by Lucidpress' DAM integration API.

Configure it with environment variables:
* `CANTO_DOMAIN` This is the first portion of your canto subdomain, e.g. "YourCantoName" if your URL is YourCantoName.canto.com
* `CANTO_APP_ID` You can find this in your Canto admin UI under Settings -> Configuration Options -> API
* `CANTO_APP_SECRET` Find in same place as APP_ID - be sure the "Support Client Credentials Mode" checkbox is checked
* `BASIC_AUTH_USER` If you want to secure this service against DDOS attacks, it's best to have Lucidpress access it with authentication. If you leave this blank, requests will not require authentication.
* `BASIC_AUTH_SECRET` Give this and the user to Lucidpress support and they will configure your integration to use authentication.

As a best practice, the node instance runs as non-root and so it runs on port 3000. You can have docker map that back to 80 or 443 as needed (see below for info about SSL support).

## SSL
SSL support is enabled automatically if you mount a key and cert into the docker container at `/securekeys/private.key` and `/securekeys/cert.pem`, respectively. If you provide certs, port 3000 will expect https connections only.

See the docker docs for more information about mounting volumes.

## To run a developer instance
Create a `docker-compose.override.yml` file and add the CANTO_ prefixed environment variables to it. Then run `docker compose up --build`. This will start the server. Visit http://localhost in your browser to see the output. It may take several minutes as Canto is a little slow to serve up its entire database.

Here is an example `docker-compose.override.yml` file:
```yaml
version: '3.5'
services:
  cantobridge:
    environment:
      CANTO_DOMAIN: yourname
      CANTO_APP_ID: 077c38d67fddeed92825ae5660539879
      CANTO_APP_SECRET: e562a0db414c9bd506d75ebe4296b04e620237eb7475ffc88e7718f8e2fbc26c
```
