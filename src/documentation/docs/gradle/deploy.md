# Deploy your testware

If you want to deploy your testware on the target cluster (defined by your kubernetes client), you can run:

```shell
./gradlew deploy
```

## Deploy configuration

This repository has a sample deployment configuration. Please update the variables and names accordingly in your own repository.

The configuration can be found at gradle/modules/package.md

```yaml
helm {
    releases {
        main {
            from file("build/helm/charts/${rootProject.name}-${imageVersion}.tgz")

            // Update the values you want for this deployment
            values = [
                'env.APP_VERSION': '1.0.0',
                'env.BUILD_URL': 'http://localhost/your-jenkins-job/1',
                'env.PRODUCT': 'EIAP',
                'env.PRODUCT_VERSION': '1.0.1'
            ]
        }
    }
}
```