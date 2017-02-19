From node:6.5.0

WORKDIR /app

RUN npm install nodemon -g

COPY package.json /app/package.json
RUN npm install

COPY Server.js /app

EXPOSE 8080
