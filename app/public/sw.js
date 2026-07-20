// Deliberately does nothing beyond existing — a fetch handler is part of Chrome/Android's
// "installable" criteria for the home-screen prompt, but this app has no offline-caching story
// (and no wish to build the staleness/versioning machinery that comes with one, especially given
// how often this app redeploys). Every request just passes straight through to the network,
// exactly as if there were no service worker at all.
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
