# Custom GKC Client

Custom GKC Client is a local mirror/host for the Gimkit web client that rewrites tracked bundle assets to run through a local server, proxies missing resources, and can route custom map room flows into a local game server.

## Start

```bash
python3 start.py
```

The site runs on `http://localhost:4173` by default.

## Credits

- Gimkit for the original client, assets, and API surface this project mirrors.
- Gimloader and the original `bundle-tracker` project for the normalized tracked bundle data this project builds on.
- LibreKit for room and API behavior reference while wiring local room flows.

