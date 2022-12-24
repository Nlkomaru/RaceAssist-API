import {basicAuth} from "hono/basic-auth";
import {Hono} from "hono";
import {cache} from "hono/cache"

const horseRouter = new Hono<{ Bindings: Env }>({strict: false});

const jsonHeader = {
    "Content-Type": "Application/Json",
};

horseRouter.get('*', cache({ cacheName: 'my-app', cacheControl: 'max-age=120' }))

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

    if (!object) {
        return new Response("Object Not Found", {status: 404});
    } else {
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
    return new Response("POST completed", {
        status: 200,
    });
});

horseRouter.get("/listAll", async (context) => {
    const r2 = context.env.BUCKET_HORSE;
    const list = await r2.list();
    const nameList = Array<HorseData>();
    for (const object of list.objects) {
        const data = await r2.get(object.key);
        if (data) {
            const horseData: HorseData = await data.json();
            nameList.push(horseData);
        }
    }
    return new Response(JSON.stringify(nameList), {
        headers: jsonHeader,
    });
});

export default horseRouter;
