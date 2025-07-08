FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p data && chmod -R 777 data

EXPOSE 3000

CMD [ "node", "server.js" ]
