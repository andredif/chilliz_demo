FROM node:14

WORKDIR /app

COPY ./package.json /
COPY ./src/ /src/

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]