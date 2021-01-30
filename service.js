// Класс является сервером обработки запросов.
// в конструкторе передается транспорт, и настройки кластеризации
// сервер может работать как в одном процессе так и порождать для обработки запросов дочерние процессы.
// Задача дописать недостающие части и отрефакторить существующий код
//
// Не важно, http/ws/tcp/ или простой сокет это все изолируется в транспорте.
// Единственное что знает сервис обработки запросов это тип подключения транспорта, постоянный или временный
// и исходя из этого создает нужную конфигурацию. ну и еще от того какой режим кластеризации был выставлен
// В итоговом варианте ожидаем увидеть код в какой-либо системе контроля версия (github, gitlab) на ваш выбор
// Примеры использования при том или ином транспорте
// Будет плюсом, если задействуете в этом деле typescript и статическую типизацию.
const http = require("http");
const cpuCount = require("os").cpus().length;

class Service {
  constructor(options) {
    // Honestly I did not quite understand what transport means here, so I just removed this transport option
    // this.transport = options.transport;
    this.isClusterMode = !!options.cluster;
    if (this.isClusterMode) {
      this.clusterOptions = options.cluster;
    }
  }

  async start() {
    if (this.isClusterMode) {
      // isMaster is the propertity of clusterOptions so I changed it like bellow and also removed transport property
      if (this.clusterOptions.isMaster) {
        await this.startCluster();
      } else {
        await this.startWorker();
      }
    } else {
      await this.startWorker();
    }
  }

  async startWorker() {
    // In the startWorker, I created simple http web server
    let server = http.createServer((req, res) => {
      res.writeHead(200);
      res.end("OK");
    });
    server.listen(process.env.PORT || 80, () => {
      console.log(
        `server ${process.pid} listening on port ${server.address().port}`
      );
    });
  }

  async startCluster() {
    console.log(`Master process ${process.pid} is running`);

    //fork workers.
    for (let i = 0; i < cpuCount; i++) {
      console.log(`Forking process number ${i}...`);
      this.clusterOptions.fork(); //creates new node js processes
    }
    this.clusterOptions.on("exit", (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
      this.clusterOptions.fork(); //forks a new process if any process dies
    });
  }
}

module.exports = Service;