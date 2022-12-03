
interface Env  {
    BUCKET_BET: R2Bucket;
    BUCKET_RESULT: R2Bucket;
    BUCKET_HORSE : R2Bucket;
    USERNAME: string;
    PASSWORD: string;
}

interface HorseData {
    horse: String,
    breader: String | null,
    owner: String | null,
    mother: String | null,
    father: String | null,
    history: History[],
    color: String,
    style: String,
    speed: Number,
    jump: Number,
    health: Number,
    name: String | null,
    birthDate: Date | null,
    lastRecordDate: Date,
    deathData: Date | null
}

interface History {
    raceId: String,
    rank: number,
}