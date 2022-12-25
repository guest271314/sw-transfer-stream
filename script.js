// const data = document.querySelector('data');
blur();
let es;
navigator.serviceWorker.onmessage = async (e) => {
  // if (e.ports.length) {
  opener.postMessage(e.data, name, [e.data]);
  // }
  es = new EventSource('./?persistentServiceWorker');
  es.addEventListener('persistentServiceWorker', (e) => {
    console.log(e);
  });
};
onmessage = (e) => {
  if (e.data === 'close') {
    es.close();
    navigator.serviceWorker.controller.postMessage(e.data);
    close();
  }
  // data.textContent = `Streaming data\n${e.data} bytes written.`;
  navigator.serviceWorker.controller.postMessage(null);
};
