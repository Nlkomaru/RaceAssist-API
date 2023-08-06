import {basicAuth} from "hono/basic-auth";
import {Context, Hono} from "hono";
import {cache} from "hono/cache"

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


export default horseRouter;
