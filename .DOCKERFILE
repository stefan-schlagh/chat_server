FROM node:14

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm ci
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

# move docker.env into the right position
RUN mv test_templates/docker.env .env

# create ssl certificate
RUN mkdir cert && \
    cd cert && \
    apt-get update && \
    apt-get upgrade -y && \
    apt-get install openssl -y && \
    openssl genrsa -out jwtPrivate.pem 1024 && \
    openssl req  -nodes -new -x509  -keyout key.pem -out cert.pem -subj "/C=AT/ST=Vienna/L=Vienna/O=/CN="

# create directory for userFiles
RUN mkdir userFiles

EXPOSE 80
EXPOSE 443

CMD [ "npm", "start" ]