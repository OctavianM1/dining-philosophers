import { Worker, isMainThread } from "worker_threads";

const PHILOSOPHERS = 6;
const sharedBuffer = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT * PHILOSOPHERS);
const forks = new Int32Array(sharedBuffer);

const workers = [];
const handlers = {
  log: console.log,
  put_down: () => notifyWorkers({ type: "forks_available", data: {} }),
  put_down_left_fork: (forkIdx) => notifyWorkers({ type: "forks_available", data: { leftForkAvailable: forkIdx } }),
};

for (let i = 0; i < PHILOSOPHERS; i++) {
  const worker = new Worker("./worker.js", { workerData: { init: `Init worker ${i}`, forks, workerNumber: i } });
  workers.push(worker);
  worker.on("message", handleMessage);
}

notifyWorkers({ type: "forks_available" });

function handleMessage(msg) {
  handlers[msg.type](msg.data);
}

function notifyWorkers(msg) {
  workers.forEach((w) => w.postMessage(msg));
}
