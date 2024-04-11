import { highlightCode } from "$lib/highlightCode";
import { encodeOpenGraphImage } from "$lib/og";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ locals }) => ({
  title: "Abstracting away the APIs - serwist",
  ogImage: encodeOpenGraphImage({
    title: "Abstracting away the APIs",
    desc: "serwist",
  }),
  toc: [
    {
      title: "Abstracting away the APIs",
      id: "abstractions",
      children: [
        {
          title: "Introduction",
          id: "introduction",
        },
        {
          title: "Usage",
          id: "usage",
          children: [
            {
              title: "Customizing the behaviour",
              id: "customizing-the-behaviour",
            },
          ],
        },
      ],
    },
  ],
  code: {
    basicUsage: {
      setup: highlightCode(
        locals.highlighter,
        {
          "sw.ts": {
            code: `import { Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist();

serwist.addEventListeners();`,
            lang: "typescript",
          },
        },
        { idPrefix: "basic-usage" },
      ),
      customizing: highlightCode(
        locals.highlighter,
        {
          "sw.ts": {
            code: `import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
// Where you import this depends on your stack
import { defaultCache } from "@serwist/vite/worker";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    // Change this attribute's name to your \`injectionPoint\`.
    // \`injectionPoint\` is an InjectManifest option.
    // See https://serwist.pages.dev/docs/build/inject-manifest/configuring
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  concurrentPrecaching: 10,
  // A list of URLs that should be cached. Usually, you don't generate
  // this list yourself; rather, you'd rely on a Serwist build tool/your framework
  // to do it for you. In this example, it is generated by \`@serwist/vite\`.
  precacheEntries: self.__SW_MANIFEST,
  // Options to customize how Serwist precaches the URLs.
  precacheOptions: {
    ignoreURLParametersMatching: [],
  },
  // Whether outdated caches should be removed.
  cleanupOutdatedCaches: true,
  // Whether the service worker should skip waiting and become the active one.
  skipWaiting: true,
  // Whether the service worker should claim any currently available clients.
  clientsClaim: true,
  // Whether navigation preloading should be used.
  navigationPreload: false,
  // Whether Serwist should log in development mode.
  disableDevLogs: true,
  // A list of runtime caching entries. When a request is made and its URL match
  // any of the entries, the response to it will be cached according to the matching
  // entry's \`handler\`. This does not apply to precached URLs.
  runtimeCaching: defaultCache,
  // Other options...
  // See https://serwist.pages.dev/docs/sw/abstractions/serwist
});

serwist.addEventListeners();`,
            lang: "typescript",
          },
        },
        { idPrefix: "customizing-the-behaviour" },
      ),
    },
  },
});
