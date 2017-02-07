  import * as express from "express";

  import * as infoRouter from "./info/router";

  let router = express.Router();

  router.use('/', infoRouter);

  export = router;