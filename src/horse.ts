import {basicAuth} from "hono/basic-auth";
import {Context, Hono} from "hono";
import {cache} from "hono/cache"
import {rewrite} from "./cron";
import {env} from "hono/dist/types/adapter";

const horseRouter = new Hono<{ Bindings: Env }>({strict: false});

const jsonHeader = {
    "Content-Type": "Application/Json",
};
const notFoundResponse = () => new Response("Object Not Found", {status: 404})

horseRouter.get('*', cache({cacheName: 'my-app', cacheControl: 'max-age=120'}));

horseRouter.post("*", async (context, next) => {
    const auth = basicAuth({
        username: context.env.USERNAME,
        password: context.env.PASSWORD,
    });
    await auth(context, next);
});

horseRouter.get("/record/:key", async (context) => {
    let key = context.req.param("key");

    const r2 = context.env.BUCKET_HORSE;

    let object = await r2.get(key);

    console.log("record is called. key is " + key + " by " + context.req.headers.get("User-Agent"))
    if (!object) {
        console.log("Not Found. That key is " + key)
        return notFoundResponse();
    } else {
        console.log("Found. That key is " + key)
        return new Response(object.body, {
            headers: jsonHeader,
        });
    }
});

horseRouter.get("/list", async (context) => {
    const r2 = context.env.BUCKET_HORSE;
    const list = await r2.list();
    const nameList = Array<String>();
    list.objects.forEach((object) => {
        nameList.push(object.key);
    });
    console.log("list is called by " + context.req.headers.get("User-Agent"))
    return new Response(JSON.stringify(nameList), {
        headers: jsonHeader,
    });
});

//JSONの追加
horseRouter.post("/push/:key", async (context) => {
    const key = context.req.param("key");
    let name = key + ".json";
    const r2 = context.env.BUCKET_HORSE;
    await r2.put(name, JSON.stringify(await context.req.json()), {
        httpMetadata: {contentType: "application/json"},
    });
    console.log("push is called. key is " + key + " by " + context.req.headers.get("User-Agent"))
    context.text("POST completed")
});

horseRouter.get("/listAll", async (context) => {
    const kv = context.env.RACE_ASSIST;
    const json = await kv.get("horse-list")
    if (!json) {
        return notFoundResponse()
    }
    console.log("lits all is called by " + context.req.headers.get("User-Agent"))
    return new Response(json, {
        headers: jsonHeader,
    });
});

horseRouter.get("/rewrite", async (context) => {
    await rewrite(context.env)
    context.text("rewrite complete")
});

horseRouter.get("/migration", async (context) => {
    let r2 = context.env.BUCKET_HORSE;
    let list = await r2.list();
    let count = 0;

    await context.env.DB.prepare(
        "DELETE FROM HORSE WHERE 1"
    ).run();

    console.log("migration is started")

    for (const object of list.objects) {
        count++;
        let objectBody = await r2.get(object.key);
        if (!objectBody) {
            continue;
        }
        let horseData = await objectBody.json<HorseData>();

        let lastRecordDate = horseData.lastRecordDate.toString();
        let birthDate = horseData.birthDate ? horseData.birthDate.toString() : null;
        let deathDate = horseData.deathDate ? horseData.deathDate.toString() : null;

        await context.env.DB.prepare(
            "INSERT INTO HORSE (HORSE , BREEDER , OWNER , MOTHER , FATHER , COLOR , STYLE , SPEED , JUMP , HEALTH , NAME , BIRTH_DATE , LAST_RECORD_DATE , DEATH_DATE) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14)"
        ).bind(horseData.horse, horseData.breeder, horseData.owner, horseData.mother, horseData.father, horseData.color, horseData.style, horseData.speed, horseData.jump, horseData.health, horseData.name, birthDate, lastRecordDate, deathDate)
            .run();
    }
    console.log("migration is called by " + context.req.headers.get("User-Agent"))
    console.log("migration complete " + count + " records")
    context.text("migration complete " + count + " records")
});


export default horseRouter;
