export async function rewrite(env: Env) {
    const r2 = env.BUCKET_HORSE;
    const list = await r2.list();
    const dataList = Array<HorseData>();
    for (const object of list.objects) {
        const data = await r2.get(object.key);
        if (data) {
            const horseData: HorseData = await data.json();
            dataList.push(horseData);
        }
    }
    console.log("cron start. Current time is" + new Date().toString());
    const kv = env.RACE_ASSIST;
    const json = JSON.stringify(dataList)
    console.log("rewrite data count is " + dataList.length)
    await kv.put("horse-list", json)
    console.log("cron processed. Current time is" + new Date().toString());
}

