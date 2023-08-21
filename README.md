# uuid-ui
Quick uuid conversion. Test Assistant

### Usage

It is recommended to use github pages, but it may not suit everyone. Run locally
```sh
git clone --depth 1 https://github.com/bavix/uuid-ui.git
cd uuid-ui
npm ci && npm run build && npm run serve
```

Service start (default port `8080`).

It is possible to run the project in docker.
```sh
docker run -p 8080:8080 -d bavix/uuid-ui

or 

docker run -p 8080:8080 -d ghcr.io/bavix/uuid-ui
```

---
Supported by

[![Supported by JetBrains](https://cdn.rawgit.com/bavix/development-through/46475b4b/jetbrains.svg)](https://www.jetbrains.com/)
