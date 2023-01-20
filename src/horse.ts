import {basicAuth} from "hono/basic-auth";
import {Context, Hono} from "hono";
import {cache} from "hono/cache"

const horseRouter = new Hono<{ Bindings: Env }>({strict: false});

const jsonHeader = {
    "Content-Type": "Application/Json",
};
const notFoundResponse = () => new Response("Object Not Found", {status: 404})

horseRouter.get('*', cache({ cacheName: 'my-app', cacheControl: 'max-age=120' }));

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
        return notFoundResponse();
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
horseRouter.post("/push/:key", async (context: Context<string, {Bindings: Env}>) => {
    const key = context.req.param("key");
    let name = key + ".json";
    const r2 = context.env.BUCKET_HORSE;
    await r2.put(name, JSON.stringify(await context.req.json()), {
        httpMetadata: {contentType: "application/json"},
    });

    context.text("POST completed")
    await onChange(context)
});

horseRouter.get("/listAll", async (context) => {
    const kv = context.env.RACE_ASSIST;
    const json = await kv.get("horse-list")
    if (!json) {
        return notFoundResponse()
    }
    return new Response(JSON.parse(json), {
        headers: jsonHeader,
    });
});
horseRouter.get("/rewrite", async (context, next) => {
    const auth = basicAuth({
        username: context.env.USERNAME,
        password: context.env.PASSWORD,
    });
    await auth(context, next);
});

horseRouter.get("/rewrite", async (context) => {
    await rewrite(context)
    context.text("rewrite complete")
});


async function onChange(context: Context<string, { Bindings: Env }>) {
    await rewrite(context)

}

async function reRender(){
    //TODO
}

async function rewrite(context: Context<string, { Bindings: Env }>) {
    const r2 = context.env.BUCKET_HORSE;
    const list = await r2.list();
    const dataList = Array<HorseData>();
    for (const object of list.objects) {
        const data = await r2.get(object.key);
        if (data) {
            const horseData: HorseData = await data.json();
            dataList.push(horseData);
        }
    }
    console.log("data put complete")

    const kv = context.env.RACE_ASSIST;
    console.log("kv access complete")
    await kv.put("horse-list", JSON.stringify(dataList))
    console.log("put complete")
}


export default horseRouter;
