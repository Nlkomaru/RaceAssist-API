import {basicAuth} from "hono/basic-auth";
import {Hono} from "hono";
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
    let key = context.req.param("key").replace(".json", "");
    const db = context.env.DB;
    const stmt = db.prepare(
        "SELECT * FROM HORSE WHERE horse = ?1"
    );
    const result = await stmt.bind(key).first();

    console.log("record is called. key is " + key + " by " + context.req.headers.get("User-Agent"))
    if (!result) {
        console.log("Not Found. That key is " + key)
        return notFoundResponse();
    } else {
        console.log("Found. That key is " + key)
        return new Response(JSON.stringify(result), {
            headers: jsonHeader,
        });
    }
});

horseRouter.get("/list", async (context) => {
    const db = context.env.DB;
    const stmt = db.prepare(
        "SELECT * FROM HORSE"
    );

    const result = await stmt.all();
    const nameList = Array<string>();
    result.results.forEach((object) => {
        nameList.push((object.horseId as string));
    });

    return new Response(JSON.stringify(nameList), {
        headers: jsonHeader,
    });
});

horseRouter.get("/listTest", async (context) => {
    const db = context.env.DB;
    const stmt = db.prepare(
        "SELECT * FROM HORSE"
    );
    const list = await stmt.all<HorseData>();

    const dataList = list.results.map((result) => {
        return result;
    });

    return new Response(JSON.stringify(dataList), {
        headers: jsonHeader,
    });
});

//JSONの追加
horseRouter.post("/push/:key", async (context) => {
    const key = context.req.param("key");

    let horseData = await context.req.json<HorseData>();
    let lastRecordDate = horseData.lastRecordDate.toString();
    let birthDate = horseData.birthDate ? horseData.birthDate.toString() : null;
    let deathDate = horseData.deathDate ? horseData.deathDate.toString() : null;

    let db = context.env.DB;
    let stmt = db.prepare(
        "SELECT * FROM HORSE WHERE horse = ?"
    );

    let result = await stmt.bind(key).all();
    if (result.results.length > 0) {
        await context.env.DB.prepare(
            "UPDATE HORSE SET horse = ?1, breeder = ?2, owner = ?3, mother = ?4, father = ?5, color = ?6, style = ?7, speed = ?8, jump = ?9, health = ?10, name = ?11, birthDate = ?12, lastRecordDate = ?13, deathDate = ?14, history = ?15 WHERE horse = ?16"
        ).bind(horseData.horse, horseData.breeder, horseData.owner, horseData.mother, horseData.father, horseData.color, horseData.style, horseData.speed, horseData.jump, horseData.health, horseData.name, birthDate, lastRecordDate, deathDate, JSON.stringify(horseData.history), key)
            .run();
    } else {
        await context.env.DB.prepare(
            "INSERT INTO HORSE (horse , breeder , owner , mother , father , color , style , speed , jump , health , name , birthDate , lastRecordDate , deathDate, history) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)"
        ).bind(horseData.horse, horseData.breeder, horseData.owner, horseData.mother, horseData.father, horseData.color, horseData.style, horseData.speed, horseData.jump, horseData.health, horseData.name, birthDate, lastRecordDate, deathDate, JSON.stringify(horseData.history))
            .run();
    }
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
horseRouter.get("/migration", async (context) => {
    const kv = context.env.RACE_ASSIST;
    const json = await kv.get("horse-list")
    if (!json) {
        return notFoundResponse()
    }


    const list: Array<HorseData> = JSON.parse(json);

    let count = 0;

    context.env.DB.prepare(
        "CREATE TABLE IF NOT EXISTS HORSE (horse TEXT PRIMARY KEY, breeder TEXT, owner TEXT, mother TEXT, father TEXT, color TEXT, style TEXT, speed REAL, jump REAL, health REAL, name TEXT, birthDate TEXT, lastRecordDate TEXT, deathDate TEXT, history JSON)"
    )


    const stmt = context.env.DB.prepare(
        "INSERT INTO HORSE (horse , breeder , owner , mother , father , color , style , speed , jump , health , name , birthDate , lastRecordDate , deathDate, history) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15)"
    )

    for (const object of list) {
        count++;
        let horseData = object;
        let lastRecordDate = horseData.lastRecordDate.toString();
        let birthDate = horseData.birthDate ? horseData.birthDate.toString() : null;
        let deathDate = horseData.deathDate ? horseData.deathDate.toString() : null;

        await stmt.bind(horseData.horse, horseData.breeder, horseData.owner, horseData.mother, horseData.father, horseData.color, horseData.style,
            horseData.speed, horseData.jump, horseData.health, horseData.name, birthDate, lastRecordDate, deathDate, JSON.stringify(horseData.history))
            .run();
    }

    console.log("migration is called by " + context.req.headers.get("User-Agent"))
    console.log("migration complete " + count + " records")
    context.text("migration complete " + count + " records")
});


export default horseRouter;
