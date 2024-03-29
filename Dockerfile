FROM node:16-alpine
WORKDIR /usr/app

COPY package.json ./
RUN npm install --production

COPY src src

USER node
CMD [ "node", "src/index.js" ]
