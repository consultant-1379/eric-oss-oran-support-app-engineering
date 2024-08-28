FROM python:3.9-alpine

COPY . /src
WORKDIR /src

RUN pip install mkdocs mkdocs-material mkdocs-build-plantuml-plugin mkdocs-glightbox
RUN mkdir -p /site/docs

CMD mkdocs build