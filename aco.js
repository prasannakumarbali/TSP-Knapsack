const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

document.onload = () => {
  canvas.width = ctx.clientWidth;
  canvas.height = ctx.clientHeight;
};

const generatePoints = (count) => {
  const points = [];
  for (let i = 0; i < count; i++) {
    points.push({
      x: Math.round(Math.random() * canvas.width),
      y: Math.round(Math.random() * canvas.height),
      id: i,
      enjoyment: Math.round(Math.random() * 100),
    });
  }

  return points;
};

const distance = (a, b) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
};

const pathDistance = (path) => {
  let sum = 0;
  for (let i = 0; i < path.length - 1; i++) {
    sum += distance(path[i], path[i + 1]);
  }
  // return sum in 0 - 100 scale
  return Math.round((sum / (canvas.width + canvas.height)) * 100);
};

let points = [];
const rewardMatrix = [];

const getPath = ({ startX, startY, startId, points }) => {
  // console.log(startX, startY, startId, points);
  //get sum of distances from start to any other point
  const path = [];
  // console.log(rewardMatrix);

  //initialise reward matrix
  while (points.length > 0) {
    // console.log(points);
    let sum = 0;
    points.forEach((point) => {
      if (point.id != startId) {
        //add reward matrix value to sum
        sum +=
          (1 / distance({ x: startX, y: startY }, point)) *
          rewardMatrix[startId][point.id];
      }
    });

    // console.log(sum);

    //get probability of choosing any other point
    const probability = points.map((point) => {
      if (point.id != startId) {
        return {
          point,
          probability:
            //use reward matrix along with distance to calculate probability
            (((1 / distance({ x: startX, y: startY }, point)) *
              rewardMatrix[startId][point.id]) /
              sum /
              100) *
            100,
        };
      }
      return { point, probability: 0 };
    });

    // console.log(probability);

    let cumulativeProbability = 0;
    const cumulativeProbabilities = probability.map((prob) => {
      cumulativeProbability += prob.probability;
      // if (cumulativeProbability > 100) cumulativeProbability = 100;
      return { point: prob.point, cumulativeProbability };
    });

    // console.log(cumulativeProbabilities);

    //get random number between cumulative probability and 0
    const random = Math.random() * cumulativeProbability;

    const chosenPoint = cumulativeProbabilities.find((prob) => {
      return random <= prob.cumulativeProbability;
    }).point;

    points = points.filter((point) => point.id != chosenPoint.id);
    startX = chosenPoint.x;
    startY = chosenPoint.y;
    startId = chosenPoint.id;
    path.push(chosenPoint);
  }

  return path;
};

//initialise reward matrix

//plot on the canvas

function draw(path, c = "gray") {
  //   ctx.fillStyle = "white";
  //   ctx.fillRect(0, 0, canvas.width, canvas.height);
  //get a random color

  //clear the canvas
  // ctx.clearRect(0, 0, canvas.width, canvas.height);

  //generate dark colors
  const color = c;

  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  path.forEach((point, idx) => {
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.beginPath();

    ctx.moveTo(point.x, point.y);
  });
  ctx.lineTo(path[0].x, path[0].y); 

  ctx.stroke();
  ctx.beginPath();
  ctx.arc(path[0].x, path[0].y, 3, 0, 2 * Math.PI);
  ctx.fill();
  ctx.moveTo(path[0].x, path[0].y);
}

// draw(path);

//get a path for each ant

const ants = [];

const calculate = (antCount) => {
  for (let i = 0; i < antCount; i++) {
    //start at a random point
    const start = points[Math.floor(Math.random() * points.length)];
    //remove the start point from the points array
    // points = points.filter((point) => point.id != start.id);
    const path = getPath({
      startX: start.x,
      startY: start.y,
      startId: start.id,
      points,
    });
    //add the start point to the path
    // console.log("start", start);

    ants.push(path);
    // console.log(path);
    //update reward matrix
    for (let i = 0; i < path.length - 1; i++) {
      rewardMatrix[path[i].id][path[i + 1].id] +=
        Math.round((1 / distance(path[i], path[i + 1])) * 100) / 100;
      rewardMatrix[path[i + 1].id][path[i].id] +=
        Math.round((1 / distance(path[i], path[i + 1])) * 100) / 100;
    }

    // console.table(rewardMatrix);
  }
};

const knapsack = (capacity, path, res = [], index = 0) => {
  //base case
  if (index >= path.length) {
    return res;
  }

  console.log("checking" + index);

  //if the weight is greater than the capacity, we will not include it
  // if (pathDistance(res) > capacity) {
  //   return res;
  // }

  //if the weight is less than the capacity, we will include it
  const lastPoint = res[res.length - 1];
  const currentPoint = path[index];

  let cost = 0;
  if (lastPoint) {
    console.log(distance(lastPoint, currentPoint));
    if (distance(lastPoint, currentPoint) <= capacity) {
      cost = distance(lastPoint, currentPoint)  + currentPoint.time_spent;
      res.push(currentPoint);
      
    }
  } else {
    res.push(currentPoint);
  }

  return knapsack(capacity - cost, path, res, index + 1);
};

//slider for time
const slider = document.getElementById("time");
const time = document.getElementsByClassName("time-value");
const antCount = document.getElementById("ants");
slider.oninput = function () {
  time[0].innerHTML = `Total time available : ${this.value} hrs`;
};

const start = document.getElementById("start");
let isPathDrawn = false;

let shortestPath = [];
let secondShortestPath = [];
let thirdShortestPath = [];

start.addEventListener("click", () => {
  // ctx.clearRect(0, 0, canvas.width, canvas.height);

  const antCountValue = parseInt(antCount.value);

  if (isNaN(antCountValue)) {
    antCount.value = 100;
  }

  //initialise reward matrix
  for (let i = 0; i < points.length; i++) {
    rewardMatrix[i] = [];
    for (let j = 0; j < points.length; j++) {
      rewardMatrix[i][j] = 1;
    }
  }

  //get a path for each ant
  console.log(antCount.value);
  calculate(antCount.value);
  // console.log(ants);

  //display the 3 best paths on the canvas
  // make a new canvas

  const resdiv = document.createElement("div");
  resdiv.classList.add("result");
  //top 3 paths

  //sort the ants

  //get the path distance for each ant
  const pathDistances = ants.map((ant) => {
    return Math.round(pathDistance(ant) * 100) / 100;
  });

  shortestPath = ants[pathDistances.indexOf(Math.min(...pathDistances))];
  secondShortestPath =
    ants[
      pathDistances.indexOf(
        Math.min(
          ...pathDistances.filter((dist) => dist != Math.min(...pathDistances))
        )
      )
    ];
  thirdShortestPath =
    ants[
      pathDistances.indexOf(
        Math.min(
          ...pathDistances.filter(
            (dist) =>
              dist != Math.min(...pathDistances) &&
              dist !=
                Math.min(
                  ...pathDistances.filter(
                    (dist) => dist != Math.min(...pathDistances)
                  )
                )
          )
        )
      )
    ];

  // draw(secondShortestPath);
  draw(shortestPath);
  //add shortest path , second shortest path and third shortest path to the result div
  //clear result div
  resdiv.innerHTML = "";
  const shortestPathDiv = document.createElement("div");
  shortestPathDiv.classList.add("shortest-path");
  shortestPathDiv.innerHTML = `Shortest path: ${shortestPath
    .map((point) => point.id)
    .join("->")}  (${Math.round(pathDistance(shortestPath) * 100) / 100})`;
  resdiv.appendChild(shortestPathDiv);

  const secondShortestPathDiv = document.createElement("div");
  secondShortestPathDiv.classList.add("shortest-path");
  secondShortestPathDiv.innerHTML = `Second shortest path: ${secondShortestPath
    .map((point) => point.id)
    .join("->")}`;

  resdiv.appendChild(secondShortestPathDiv);
  document.body.appendChild(resdiv);
});

//get points from user click on canvas, alerts user and avoids insertion of duplicate points
canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = Math.round(e.clientY - rect.top);

  // Check if a point with the same coordinates already exists
  const duplicatePoint = points.find((point) => point.x === x && point.y === y);
  if (duplicatePoint) {
    alert("A point with the same coordinates already exists.");
    return;
  }

  // Mark the point on the canvas and put digit inside
  ctx.beginPath();
  ctx.arc(x, y, 20, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.font = "20px Arial";
  ctx.fillText(points.length, x - 5, y + 5);

  // Add the point to the points array

  const newPoint = {
    x,
    y,
    id: points.length,
    enjoyment: Math.floor(Math.random() * 100) + 1,
    time_spent: Math.floor(Math.random() * 10) + 1,
  };

  //draw enjoyment
  ctx.font = "20px Arial";
  ctx.fillText(
    `E: ${newPoint.enjoyment} , T: ${newPoint.time_spent}`,
    x - 5,
    y - 25
  );

  points.push(newPoint);

  // Update the reward matrix without duplicating entries
  rewardMatrix.forEach((row) => {
    row.push(1);
  });
  rewardMatrix.push(new Array(points.length).fill(1));
  console.log(points);
});

const clearButton = document.getElementById("clear");
clearButton.addEventListener("click", clearCanvas);

const rotate = (path) => {
  const index = path.findIndex((point) => point.id === 0);
  const firstPart = path.slice(0, index);
  const secondPart = path.slice(index);
  return secondPart.concat(firstPart);
};
const findButton = document.getElementById("find");
const final = document.createElement("div");
final.classList.add("final");
findButton.addEventListener("click", () => {
  //rotate the path such that point with id 0 is the first point
  shortestPath = rotate(shortestPath);
  const path = knapsack(slider.value, shortestPath);
  console.log(path);
  draw(path, "red");

  final.innerHTML = `Final path: ${path.map((point) => point.id).join("->")} (${
    Math.round(pathDistance(path) * 100) / 100
  } hrs)`;
  document.body.appendChild(final);
});

function clearCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  points = [];
  rewardMatrix.length = 0;
  ants.length = 0;
  isPathDrawn = false;
}