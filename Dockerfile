FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm install -g ts-node && npm cache clean --force

EXPOSE 443
CMD ["ts-node", "src/index.ts"]
