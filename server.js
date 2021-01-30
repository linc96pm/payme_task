const cluster = require("cluster");
const Service = require("./service");

const options = {
  cluster: cluster, // cluster can be set and/or not based on the need
};

const start = new Service(options);

start.start();
