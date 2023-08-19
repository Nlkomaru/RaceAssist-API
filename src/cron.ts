export async function rewrite(env: Env) {
    const db = env.DB;
    const stmt = db.prepare(
        "SELECT * FROM HORSE"
    );
    const dataList  = await stmt.first() as HorseData[];

    const kv = env.RACE_ASSIST

    const json = JSON.stringify(dataList)
    console.log("rewrite data count is " + dataList.length)
    await kv.put("horse-list", json)

    console.log("cron processed. Current time is" + new Date().toString());
}

