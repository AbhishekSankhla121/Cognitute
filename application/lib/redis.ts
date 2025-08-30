import Redis from "ioredis";
console.log(process.env.REDIS_URL)
const url = process.env.REDIS_URL||"redis://redis:6379"
const redis = new Redis(url)
export default redis