FROM node:24

WORKDIR /urbridge

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --ignore-scripts

COPY . .

CMD ["node", "index.js"]
