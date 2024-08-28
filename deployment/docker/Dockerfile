FROM armdocker.rnd.ericsson.se/proj-eric-oss-dev/oss-testware/eric-oss-os-testware-k6-base:1.0.0

FROM armdocker.rnd.ericsson.se/proj-eric-oss-drop/k6/tooling/k6-base-image:latest

COPY --from=0 /go/src/go.k6.io/xk6/k6 /usr/local/bin/k6

ARG version

ENV TEST_VERSION=$version

ENV STAGING_TYPE="APPLICATION"

# The application under test. This shuld be immutable
ENV APP_NAME="eric-oss-oran-support"
ENV ADDITIONAL_ARGS="--insecure-skip-tls-verify --quiet"
ENV PRINT_K6_OUTPUT="true"
ENV A1_URL="http://eric-oss-a1-policy-mgmt-svc:9080/"

ADD js/ /tests
ADD resources/ /resources