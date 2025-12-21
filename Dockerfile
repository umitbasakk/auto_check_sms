FROM node:20.19.0-bullseye 

WORKDIR /app 

COPY package.json ./ 

RUN npm install 

COPY . .
CMD ["npx", "tsx","worker.ts"]