import { logger } from "serwist/internal";
import type { PrecacheEntry, RuntimeCaching } from "serwist";
import { ExpirationPlugin } from "serwist/plugins";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from "serwist/strategies";

import {
  base as basePath,
  build as immutableAssets,
  files as staticAssets,
  prerendered as prerenderedRoutes,
  version as serviceWorkerVersion,
} from "$service-worker";

export { basePath, immutableAssets, staticAssets, prerenderedRoutes, serviceWorkerVersion };

export type StaticRevisions = string | { [url: string]: string | null };

export type ManifestTransform = (manifest: PrecacheEntry[]) => {
  manifest: PrecacheEntry[];
  warnings?: string[] | undefined;
};

export interface GetPrecacheManifestOptions {
  /**
   * Whether immutable assets, as in assets that are generated by
   * Vite, should be precached.
   *
   * @default true
   */
  precacheImmutable?: boolean;
  /**
   * Whether static assets should be precached.
   *
   * @default true
   */
  precacheStatic?: boolean;
  /**
   * Whether prerendered routes should be precached. This
   * includes their __data.json files.
   *
   * @default true
   */
  precachePrerendered?: boolean;
  /**
   * A string revision used for all static assets or an object that maps
   * URLs of static assets to custom revisions.
   * If an URL doesn't exist in the object, `serviceWorkerVersion`
   * will be used instead.
   *
   * This helps prevent such assets, which are unlikely to change, from
   * being invalidated every time the service worker is rebuilt and updated.
   *
   * Note: you should prefix these URLs with `basePath`.
   */
  staticRevisions?: StaticRevisions;
  /**
   * One or more functions which will be applied sequentially against the
   * generated manifest.
   */
  manifestTransforms?: ManifestTransform[];
}

/**
 * Retrieves the precache manifest generated by SvelteKit. A simple
 * wrapper around SvelteKit's built-in service worker support. For more
 * complex use cases, seek [the `@serwist/vite` recipe for SvelteKit](https://serwist.pages.dev/docs/vite/recipes/svelte-kit).
 *
 * @param options
 * @returns
 */
export const getPrecacheManifest = ({
  precacheImmutable = true,
  precacheStatic = true,
  precachePrerendered = true,
  staticRevisions,
  manifestTransforms,
}: GetPrecacheManifestOptions = {}): PrecacheEntry[] | undefined => {
  const staticMapper = (url: string): PrecacheEntry => ({
    url,
    revision:
      typeof staticRevisions === "string"
        ? staticRevisions
        : typeof staticRevisions === "object"
          ? url in staticRevisions
            ? staticRevisions[url]
            : serviceWorkerVersion
          : serviceWorkerVersion,
  });
  let precacheManifest: PrecacheEntry[] = [
    // Immutable files generated by Vite.
    ...(precacheImmutable ? immutableAssets.map((url) => <PrecacheEntry>{ url, revision: null }) : []),
    // Files in the static directory.
    ...(precacheStatic ? staticAssets.map(staticMapper) : []),
    // Prerendered routes.
    ...(precachePrerendered ? prerenderedRoutes.map((url) => <PrecacheEntry>{ url, revision: serviceWorkerVersion }) : []),
  ];
  if (manifestTransforms) {
    const allWarnings: string[] = [];
    for (const transform of manifestTransforms) {
      const result = transform(precacheManifest);
      if (!("manifest" in result)) {
        if (process.env.NODE_ENV !== "production") {
          logger.error("The return value from a manifestTransform should be an object with 'manifest' and optionally 'warnings' properties.");
        }
        return undefined;
      }
      precacheManifest = result.manifest;
      allWarnings.push(...(result.warnings || []));
    }
    if (process.env.NODE_ENV !== "production" && allWarnings.length > 0) {
      logger.warn("Received warnings while transforming the precache manifest.");
      logger.groupCollapsed("View details here.");
      for (const warning of allWarnings) {
        logger.warn(warning);
      }
      logger.groupEnd();
    }
  }
  return precacheManifest;
};

export const defaultIgnoreUrlParameters = [/^x-sveltekit-invalidated$/];

/**
 * The default, recommended list of caching strategies for applications
 * built with SvelteKit.
 *
 * @see https://serwist.pages.dev/docs/svelte/worker-exports#default-cache
 */
export const defaultCache: RuntimeCaching[] = import.meta.env.DEV
  ? []
  : [
      {
        matcher: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: new CacheFirst({
          cacheName: "google-fonts",
          plugins: [
            new ExpirationPlugin({
              maxEntries: 4,
              maxAgeSeconds: 365 * 24 * 60 * 60, // 365 days
              maxAgeFrom: "last-used",
            }),
          ],
        }),
      },
      {
        matcher: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
        handler: new StaleWhileRevalidate({
          cacheName: "static-font-assets",
          plugins: [
            new ExpirationPlugin({
              maxEntries: 4,
              maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
              maxAgeFrom: "last-used",
            }),
          ],
        }),
      },
      {
        matcher: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
        handler: new StaleWhileRevalidate({
          cacheName: "static-image-assets",
          plugins: [
            new ExpirationPlugin({
              maxEntries: 64,
              maxAgeSeconds: 24 * 60 * 60, // 24 hours
              maxAgeFrom: "last-used",
            }),
          ],
        }),
      },
      {
        matcher: /\.(?:js)$/i,
        handler: new StaleWhileRevalidate({
          cacheName: "static-js-assets",
          plugins: [
            new ExpirationPlugin({
              maxEntries: 32,
              maxAgeSeconds: 24 * 60 * 60, // 24 hours
              maxAgeFrom: "last-used",
            }),
          ],
        }),
      },
      {
        matcher: /\.(?:css|less)$/i,
        handler: new StaleWhileRevalidate({
          cacheName: "static-style-assets",
          plugins: [
            new ExpirationPlugin({
              maxEntries: 32,
              maxAgeSeconds: 24 * 60 * 60, // 24 hours
              maxAgeFrom: "last-used",
            }),
          ],
        }),
      },
      {
        matcher: /\.(?:json|xml|csv)$/i,
        handler: new NetworkFirst({
          cacheName: "static-data-assets",
          plugins: [
            new ExpirationPlugin({
              maxEntries: 32,
              maxAgeSeconds: 24 * 60 * 60, // 24 hours
              maxAgeFrom: "last-used",
            }),
          ],
        }),
      },
      {
        matcher: /\/api\/.*$/i,
        method: "GET",
        handler: new NetworkFirst({
          cacheName: "apis",
          plugins: [
            new ExpirationPlugin({
              maxEntries: 16,
              maxAgeSeconds: 24 * 60 * 60, // 24 hours
              maxAgeFrom: "last-used",
            }),
          ],
          networkTimeoutSeconds: 10, // fallback to cache if API does not response within 10 seconds
        }),
      },
      {
        matcher: /.*/i,
        handler: new NetworkFirst({
          cacheName: "others",
          plugins: [
            new ExpirationPlugin({
              maxEntries: 32,
              maxAgeSeconds: 24 * 60 * 60, // 24 hours
              maxAgeFrom: "last-used",
            }),
          ],
          networkTimeoutSeconds: 10,
        }),
      },
    ];
