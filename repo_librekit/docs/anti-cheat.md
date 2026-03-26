# Anti cheat notes

## Anti-cheat measures in Gimkit which matters for librekit

- The API server checks the Origin header. It must be set to `https://www.gimkit.com`.
- The API server uses invisible unicode characters to make it harder for custom clients to exist. See: https://youtu.be/pFAZ4dnLzGQ
- The Blueboat servers block clients which have the Origin header set to anything on `localhost`.

## Anti-cheat measures in librekit

We don't have any specific client-side checks in place, but we do have the client-side code needed to flag and kick clients which are most likely using cheats.
