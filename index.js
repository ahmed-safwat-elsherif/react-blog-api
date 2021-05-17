const express = require("express");
const app = express();
const methodOverride = require("method-override");
const dotenv = require("dotenv");
dotenv.config();

const users = require("./routes/users");
const blogs = require("./routes/blogs");
const images = require("./routes/images");
const config = require("./config/config");

DatabaseConnection: {
  require("./db-connection");
}

app.use(
  express.json({
    limit: "50mb",
  })
);

app.use(
  express.urlencoded({
    limit: "50mb",
    parameterLimit: 100000,
    extended: true,
  })
);

app.use(methodOverride("_method"));

const cors = require("cors");
app.use(cors());

app.use(express.json());

IntialRoute: {
  app.get("/", (req, res) => {
    res.status(200).send({ message: "server is responding well" });
  });
}

Logging: {
  app.use((req, res, next) => {
    try {
      ({ time: new Date(), url: req.url, method: req.method });
      next();
    } catch (error) {
      ({ error: "Logging error" });
      next(error);
    }
  });
}

Routes: {
  app.use("/api/users", users);
  app.use("/api/blogs", blogs);
  app.use("/api/images", images);
}

ErrorHandler: {
  app.use((req, res, next, err) => {
    res.status(500).send({ success: false, message: "Server Error occured" });
  });
}

const port = config.port;

app.listen(port, () => {
  `server is listening on port: ${port}`;
});
