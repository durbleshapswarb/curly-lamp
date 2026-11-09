// sw.js
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Intercept the fake request from index.html
    if (url.pathname.endsWith('stream-game.unx')) {
        event.respondWith((async () => {
            const streams = [];
            
            // Fetch all 12 parts
            for (let i = 1; i <= 12; i++) {
                // Make sure this path matches your repo structure!
                const partUrl = new URL(`game.unx.part${i}`, self.location.origin).href;
                const response = await fetch(partUrl);
                if (!response.ok) return new Response('Part missing', { status: 404 });
                streams.push(response.body);
            }

            // Stream them directly to the engine
            const combinedStream = new ReadableStream({
                async start(controller) {
                    for (const stream of streams) {
                        const reader = stream.getReader();
                        while (true) {
                            const { done, value } = await reader.read();
                            if (done) break;
                            controller.enqueue(value);
                        }
                    }
                    controller.close();
                }
            });

            return new Response(combinedStream, {
                headers: { 'Content-Type': 'application/octet-stream' }
            });
        })());
    }
});
