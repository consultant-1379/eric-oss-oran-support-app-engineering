#FROM armdocker.rnd.ericsson.se/dockerhub-ericsson-remote/loadimpact/k6 as k6base
FROM armdocker.rnd.ericsson.se/proj-eric-oss-dev-test/k6-base-image:latest
# Image details: https://hub.docker.com/r/loadimpact/k6/tags

ARG hostname

ENV hostname_url=$hostname

COPY /src/js .
COPY /deployment/scripts/runK6.sh .
RUN sleep 120
ENTRYPOINT ["/bin/sh", "/tests/runK6.sh"]