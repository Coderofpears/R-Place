import { listen } from "@colyseus/tools";
import config from "./colyseusConfig";
import "./mockBackend";

listen(config, 7859);
