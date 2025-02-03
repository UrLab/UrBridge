FROM node

WORKDIR /urbridge

COPY package.json .
RUN npm install
COPY . .
