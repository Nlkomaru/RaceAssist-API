import {basicAuth} from "hono/basic-auth";
import {Hono} from "hono";

const betRouter = new Hono<{ Bindings: Env }>({ strict: false });
const jsonHeader = {
    "Content-Type": "Application/Json",
};

betRouter.all("*", async (context, next) => {
    const auth =  basicAuth({
        username: context.env.USERNAME,
        password: context.env.PASSWORD,
    });
    await auth(context, next);
});

betRouter.get("/result/:key", async (context) => {
    let key = context.req.param("key");

    const r2 = context.env.BUCKET_BET;

    let object = await r2.get(key);

    if (!object) {
        return new Response("Object Not Found", { status: 404 });
    } else {
        return new Response(object.body, {
            headers: jsonHeader,
            status : 200
        });
    }
});

betRouter.get("/list", async (context) => {
    const r2 = context.env.BUCKET_BET;
    const list = await r2.list();
    const nameList = Array<String>();
    list.objects.forEach((object) => {
        nameList.push(object.key);
    });

    return new Response(JSON.stringify(nameList), {
        headers: jsonHeader,
    });
});

//JSONの追加
betRouter.post("/push/:key", async (context) => {
    if (
        context.req.headers.get("Content-Type")?.toLowerCase() !==
        "application/json; charset=utf-8"
    ) {
        return;
    }

    const key = context.req.param("key");
    let name = key + ".json";

    const r2 = context.env.BUCKET_BET;

    await r2.put(name, JSON.stringify(await context.req.json()), {
        httpMetadata: { contentType: "application/json" },
    });
    return new Response("POST completed", {
        status: 200,
    });
});
export default betRouter;