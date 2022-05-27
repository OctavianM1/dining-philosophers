import { strict as assert } from "assert";
import { workerData, parentPort, isMainThread } from "worker_threads";
parentPort.postMessage({ type: "log", data: { init: workerData.init } });

await sleep(); // getting hungry
let isHungry = true;

const { forks, workerNumber } = workerData;
let leftForkToEat = workerNumber;
let rightForkToEat = forks.length === workerNumber + 1 ? 0 : workerNumber + 1;

const handlers = {
  forks_available: onForksAvailable,
};

parentPort.on("message", (msg) => {
  handlers[msg.type](msg.data || {});
});

async function onForksAvailable({ leftForkAvailable }) {
  // ignore for himself when worker notified that he put down left fork
  if (leftForkAvailable === leftForkToEat) {
    return;
  }
  if (!isHungry) {
    log(`Worker ${workerNumber} is not hungry`);
    return;
  }
  let isLeftForkTaken = false;
  let isRightForkTaken = false;
  if (!forks[leftForkToEat]) {
    forks[leftForkToEat] = 1;
    isLeftForkTaken = true;
    log(`Worker ${workerNumber} is taking left fork`);
  }
  if (!forks[rightForkToEat] && isLeftForkTaken) {
    forks[rightForkToEat] = 1;
    isRightForkTaken = true;
    log(`Worker ${workerNumber} is taking right fork`);
  } else if (isLeftForkTaken) {
    forks[leftForkToEat] = 0;
    log(`Worker ${workerNumber} is putting down left fork`);
    putLeftForkDown(leftForkToEat);
  }
  if (isRightForkTaken) {
    await sleep(); // finish to eat
    isHungry = false;
    assert(isLeftForkTaken, `Error, left fork is not taken by current worker ${workerNumber}`);
    forks[rightForkToEat] = 0;
    forks[leftForkToEat] = 0;
    log(`Worker ${workerNumber} has finished to eat and putting down the forks`);
    putForksDown();
    setTimeout(() => {
      isHungry = true;
    }, Math.floor(Math.random() * 1000));
  }
}

function putLeftForkDown(forkIdx) {
  parentPort.postMessage({ type: "put_down_left_fork", data: forkIdx });
}

function putForksDown() {
  parentPort.postMessage({ type: "put_down", data: {} });
}

function log(msg) {
  parentPort.postMessage({
    type: "log",
    data: { msg, forks: [...forks] },
  });
}

function sleep(ms = Math.floor(Math.random() * 1000)) {
  return new Promise((r) => setTimeout(r, ms));
}
