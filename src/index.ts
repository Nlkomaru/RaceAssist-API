import { Hono } from "hono";
import { basicAuth } from "hono/basic-auth";

interface Env {
  BUCKET_BET: R2Bucket;
  BUCKET_RESULT: R2Bucket;
  USERNAME: string;
  PASSWORD: string;
}

const router = new Hono<Env>({ strict: false });
const v1 = new Hono<Env>({ strict: false });
const resultRouter = new Hono<Env>({ strict: false });
const betRouter = new Hono<Env>({ strict: false });


const jsonHeader = {
  "Content-Type": "Application/Json",
};

v1.get("/", () => {
  return new Response(
    "Hello, world! This is the root page of your Worker template."
  );
});

resultRouter.post("*", async (context, next) => {
  const auth = basicAuth({
    username: context.env.USERNAME,
    password: context.env.PASSWORD,
  });
  await auth(context, next);
});

resultRouter.get("/record/:key", async (context) => {
  let key = context.req.param("key");

  const r2 = context.env.BUCKET_RESULT;

  let object = await r2.get(key);

  if (!object) {
    return new Response("Object Not Found", { status: 404 });
  } else {
    return new Response(object.body, {
      headers: jsonHeader,
    });
  }
});

resultRouter.get("/list", async (context) => {
  const r2 = context.env.BUCKET_RESULT;
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
resultRouter.post("/push/:key", async (context) => {
  if (
    context.req.headers.get("Content-Type")?.toLowerCase() !==
    "application/json; charset=utf-8"
  ) {
    return new Response("Content-Type is not Application/Json", {
      status: 400,
    });
  }

  const key = context.req.param("key");
  let name = key + ".json";

  const r2 = context.env.BUCKET_RESULT;

  await r2.put(name, JSON.stringify(await context.req.json()), {
    httpMetadata: { contentType: "application/json" },
  });
  return new Response("POST completed", {
    status: 400,
  });
});

betRouter.all("*", async (context, next) => {
   const auth =  basicAuth({
     username: context.env.USERNAME,
     password: context.env.PASSWORD,
   });
   await auth(context, next);
});

betRouter.get("/record/:key", async (context) => {
  let key = context.req.param("key");

  const r2 = context.env.BUCKET_BET;

  let object = await r2.get(key);

  if (!object) {
    return new Response("Object Not Found", { status: 404 });
  } else {
    return new Response(object.body, {
      headers: jsonHeader,
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
    status: 400,
  });
});

v1.route("/result", resultRouter);
v1.route("/bet", betRouter);
router.route("/v1", v1);

export default router;
