import {Hono} from "hono";
import resultRouter from "./result";
import betRouter from "./bet";
import horseRouter from "./horse";
import {rewrite} from "./cron";

const router = new Hono<{ Bindings: Env }>({strict: false});
const v1 = new Hono<{ Bindings: Env }>({strict: false});

v1.get("/", (c) => c.text("Hello, world! This is the root page of your Worker template."));

v1.route("/result", resultRouter);
v1.route("/bet", betRouter);
v1.route("/horse", horseRouter);
router.route("/v1", v1);
router.fire();


export default {
    async scheduled(controller: ScheduledController,
                    environment: Env,
                    ctx: ExecutionContext
    ): Promise<void> {
        ctx.waitUntil(rewrite(environment))
    }
};
