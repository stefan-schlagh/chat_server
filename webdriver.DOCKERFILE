FROM selenium/node-chrome

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY webdriver/package*.json webdriver/

USER root
# install node, git
RUN apt-get update --fix-missing && \
    apt-get upgrade -y && \
    curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash - && \
    apt-get install nodejs -y && \
    apt-get install git -y

RUN npm ci && \
    cd webdriver && \
    npm ci

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

EXPOSE 80
EXPOSE 443

ENV NODE_ENV=test
CMD [ "npm", "start" ]