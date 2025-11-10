FROM golang:1.25-alpine AS builder

WORKDIR /app

RUN apk add --no-cache upx

COPY go.mod ./
RUN go mod tidy

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server .

RUN upx --best --lzma /app/server

FROM scratch

COPY --from=builder /app/server /server

EXPOSE 8080
ENTRYPOINT ["/server"]
