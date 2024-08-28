# K6 Quick Start Sample

## Introduction

This repository was created to be used as a sample on how to write and structure your application or product staging code.

Before continue please make sure you are familiarized with the [K6 Guidelines published by EPT](https://confluence-oss.seli.wh.rnd.internal.ericsson.com/pages/viewpage.action?spaceKey=IDUN&title=K6+Tests+Guidelines).

Top know more about K6 visit:

https://k6.io/docs/

## This Documentation

This documentation is provided in markdown format and is used to generate the HTML published docuemntation.

It is expected that each staging repository to provide basic documentation on the scope of their tests and how to contribute and run these tests.

The documentation source is located at **src/documentation**.

## Quick Start Commands

> **Pre Requisites:** You need to have a JDK (at least 11) and Docker engine installed to run the build.

This repository is managed by a Gradle build. This is fully documented at **TODO**. But you can use the following quick commands to get started:

### Build the Documentation

```shell
./gradlew buildDocumentation
```

### Build the Testware images

```shell
./gradlew package
```

### Run the tests

```shell
./gradlew run
```