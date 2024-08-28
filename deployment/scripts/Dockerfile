FROM golang:1.22.2-alpine3.18
WORKDIR /go/src/go.k6.io/xk6/

ENV K6_VERSION=v0.45.1

RUN apk update; apk add git

RUN go install go.k6.io/xk6/cmd/xk6@v0.9.2 && \
  xk6 build \
  --with github.com/grafana/xk6-output-timescaledb@v0.1.1 \
  --with github.com/thmshmm/xk6-opentelemetry@v0.4.0