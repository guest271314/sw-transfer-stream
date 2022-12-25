const start = new Date();

self.addEventListener('install', (event) => {
  skipWaiting();
});

self.addEventListener('activate', (event) => {
  skipWaiting();
});

chrome.action.onClicked.addListener(async (tab) => {
  const [{ result }] = await chrome.scripting.executeScript({
    target: {
      tabId: tab.id,
      allFrames: false,
    },
    world: 'MAIN',
    args: [chrome.runtime.getURL('index.html') + '?' + new Date().getTime()],
    func: async (src) => {
      return new Promise((resolve) => {
        const handleMessage = (e) => {
          if (src.includes(e.origin)) {
            let bytesWritten = 0;
            // e.ports[0].onmessage = (event) => {
            e.data.pipeTo(
              new WritableStream({
                write(v) {
                  // bytesWritten += v.byteLength;
                  console.log(v.length);
                  // e.source.postMessage(bytesWritten, '*');
                },
                close() {
                  console.log('closed');
                  e.source.postMessage('close', '*');
                },
              })
            );
            // };
          }
          removeEventListener('message', handleMessage);
        };
        addEventListener('message', handleMessage, {
          once: true,
        });
        open(
          src,
          location.href,
          `popup,left=0,top=0,width=1,height=1,location=0,resizable=1,scrollbars=0,toolbar=0,menubar=0,status=0,titlebar=0`
        );
        resolve(w);
      });
    },
  });
});

chrome.windows.onCreated.addListener(async (window) => {
  console.log(window);
  if (window.type === 'popup') {
    await chrome.windows.update(window.id, {
      focused: false,
      width: 0,
      height: 0,
      drawAttention: false,
    });
  }
});

let promise, resolve;

const stream = async (id) => {
  console.log(id);
  promise = new Promise((_) => (resolve = _));
  let url =
    'https://ia800301.us.archive.org/10/items/DELTAnine2013-12-11.WAV/Deltanine121113Pt3Wav.wav';
  let buffer = new Uint8Array(
    new ArrayBuffer(65536 * 10, { maxByteLength: 65536 * 10 })
  );
  let i = 0;
  const readable = new ReadableStream({
    pull(c) {
      if (i < buffer.byteLength) {
        c.enqueue(buffer.subarray(i, (i += 1024)));
      } else {
        c.close();
        resolve(buffer);
      }
    },
  });
  // const reabable = (await fetch(url, { cache: 'no-store' })).body;
  const client = await clients.get(id);
  console.log(client);
  // ({ port1, port2 } = new MessageChannel());
  client.postMessage(readable, [readable]);
  // port2.postMessage(readable, [readable]);
  return;
};
let id; // port1, port2
onfetch = async (e) => {
  console.log(e);
  if (e.request.url.includes('index.html')) {
    id = e.resultingClientId;
    e.respondWith(
      fetch(e.request.url, {
        cache: 'no-store',
      })
    );
  }
  if (e.request.url.includes('test.html')) {
    id = e.resultingClientId;
    e.respondWith(
      fetch(e.request.url, {
        cache: 'no-store'
      })
    );
  }
  if (e.request.url.includes('script.js')) {
    e.respondWith(
      fetch(e.request.url, {
        cache: 'no-store',
      })
    );
    stream(id);
  }
  // Keep ServiceWorker active during stream
  if (e.request.url.includes('persistentServiceWorker')) {
    const message =
      `event: persistentServiceWorker\n` +
      `retry: 15000\n` +
      `id: ${id++}\n` +
      `data: \n\n`;
    const blob = new Blob([message], {
      type: 'text/event-stream',
    });
    e.respondWith(
      new Response(blob, {
        headers: {
          'Content-Type': 'text/event-stream',
        },
      })
    );
  }
};

onmessage = async (e) => {
  // Wait for ReadableStreamDefaultWriter to complete stream
  if (e.data === 'close') {
    const buffer = await promise;
    buffer.buffer.resize(0);
    console.log(buffer);
    promise = resolve = null;
    return;
  }
  e.source.postMessage(null);
};
