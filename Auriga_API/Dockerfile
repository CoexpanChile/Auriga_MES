#build stage
FROM golang:1.24.0-alpine3.21 AS builder
RUN apk add --no-cache git upx
WORKDIR /app
COPY ["go.mod", "go.sum", "./"]
RUN go mod download -x
COPY . .
RUN go get -d -v ./...
RUN go build \
    -ldflags "-s -w" \
    -o app -v .
RUN upx app
# upx es un compresor de binarios no funciona en mac

#final stage
FROM alpine:3.21
LABEL Name=aurigapi Version=0.0.01
RUN apk update
RUN apk --no-cache add ca-certificates bash

WORKDIR /app
COPY --from=builder /app .

ENTRYPOINT ["./app"]


# docker build -t auriga-api:0.0.01 .
# docker run --name auriga-api -p 8081:8081 auriga-api:0.0.01

# docker save -o auriga-api_0.0.01.tar auriga-api:0.0.01
# scp auriga-api_0.0.01.tar jr@172.21.99.1:/home/jr/FSP/FSP_config/cx_api

# scp -i "AurigaPassword.pem" -r ./auriga-api_0.0.01.tar au@18.232.248.24:/home/au/CX_config/auriga_api


# scp -i "AurigaPassword.pem" -r ./docker-compose.yml au@18.232.248.24:/home/au/CX_config/auriga_api
# sudo docker load -i auriga-api_0.0.01.tar

# Copiar certificado en VM
#        scp AurigaPassword.pem jr@18.213.58.26:/home/jr/projects/Auriga_API

# Carga al servidor
##  En el PC de desarrollo
#        docker build -t auriga-api:0.0.01 .
#        docker save -o auriga-api_0.0.01.tar auriga-api:0.0.01
#         scp -i "AurigaPassword.pem" -r ./auriga-api_0.0.01.tar au@ec2-34-234-175-185.compute-1.amazonaws.com:/home/au/CX_config/auriga_api

##  En el Server cx-auriga
#        sudo docker load -i auriga-api_0.0.01.tar
#        sudo docker compose -f docker-compose.yml up -d



#         scp -i "AurigaPassword.pem" -r ./auriga-api_0.0.01.tar au@18.232.248.24:/home/au/CX_config/auriga_api
