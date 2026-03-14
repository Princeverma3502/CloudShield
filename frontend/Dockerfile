FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN ls -R src/
EXPOSE 3000
CMD ["npm", "start"]
