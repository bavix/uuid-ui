---
title: Self-hosted, offline UUID tool (Docker) | UUIDConv
description: Run a UUID converter and generator inside your own network: one static image, no backend, no telemetry on the identifiers, and the same tool works offline in the browser.
h1: A UUID tool you can host yourself
tldr: Every conversion on this site happens in the browser, and the whole site is a static bundle you can run yourself with one docker command. Identifiers never reach a server, because there is no server to reach.
lede: Production identifiers are production data. Pasting them into a site that converts them server-side means shipping them to somebody else, and most online UUID tools do exactly that. This one does not, and you do not have to take that on trust: the source is public and the whole thing runs on your own machine.
cta: uuid -
related: what-is-a-uuid, uuid-code-examples, reference
priority: 0.7
updated: 2026-08-21
---

## Run it

```shell
docker run --rm -p 8080:8080 bavix/uuid-ui

# or from the GitHub registry
docker run --rm -p 8080:8080 ghcr.io/bavix/uuid-ui
```

The image is a Go binary with the static site embedded in it: no database, no cache, no outbound connections, nothing to configure but the port. It serves the same files this site is built from, so the self-hosted copy and the public one are the same tool.

## What "client-side" means here

| Step | Where it happens |
| --- | --- |
| Parsing what you paste | your browser |
| Converting between formats | your browser |
| Generating v1, v4, v6, v7 and name-based identifiers | your browser |
| History of what you converted | your browser storage, until you clear it |
| Anything sent to a server | nothing |

::note Be precise about what "no outbound connections" covers. The Go server makes none. The converter page itself carries two analytics scripts for page views, and the image serves that same page, so a self-hosted copy will try to load them unless the machine cannot reach those hosts. They count visits; they never see an identifier, because nothing you paste leaves the tab. The reference pages you are reading now carry no analytics at all.

## Working offline

Because the conversion is local, the tool keeps working when the network does not: an air-gapped workstation, a VPN-only network, a plane. Load it once, or run the image on the machine itself, and it behaves identically. The reference pages behave the same way, with one extra file for the playground and nothing else.

## What it does that a one-off page does not

Conversion between UUID text, Base64, hex, byte arrays, a high/low 64-bit pair, four 32-bit words and ULIDs, in both directions and in bulk: paste a whole column of identifiers and every line is converted at once. Alongside that, generation of v1, v4, v6, v7, name-based v3 and v5, and the Nil and Max constants, plus a decoder that reads the version, the variant, the timestamp and the bit layout.

::rfc 9562 6.10 Why identifiers that embed a MAC address deserve care about where they are processed

## The source

The repository is public under the MIT licence, the site is a static bundle, and the server is 104 lines of Go whose only job is to serve embedded files with a few cache headers. There is not much room in it for a surprise, and you are welcome to check.

::faq
Q: Do the UUIDs I paste get sent anywhere?
A: No. Parsing, conversion and generation all run in the browser. The self-hosted image has no backend to send them to.
Q: Can I run this inside a private network?
A: Yes. docker run -p 8080:8080 bavix/uuid-ui serves the whole tool from a single static image with no outbound dependencies.
Q: Does it work without an internet connection?
A: Yes. Once the page is loaded, or once the image is running locally, every feature works offline.
::
