/*
  Copyright 2019 Google LLC

  Use of this source code is governed by an MIT-style
  license that can be found in the LICENSE file or at
  https://opensource.org/licenses/MIT.
*/

import type { PrecacheEntry, PrecacheRouteOptions } from "./_types.js";
import { addRoute } from "./addRoute.js";
import { precache } from "./precache.js";

/**
 * This method will add entries to the precache list and add a route to
 * respond to fetch events.
 *
 * This is a convenience method that will call
 * `@serwist/precaching.precache` and
 * `@serwist/precaching.addRoute` in a single call.
 *
 * @param entries Array of entries to precache.
 * @param options See the `@serwist/precaching.PrecacheRoute` options.
 */
export const precacheAndRoute = (entries: (PrecacheEntry | string)[], options?: PrecacheRouteOptions): void => {
  precache(entries);
  addRoute(options);
};
