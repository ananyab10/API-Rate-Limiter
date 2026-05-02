const express = require('express')
const Redis = require("ioredis")
const dotenv = require('dotenv').config();
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX)
const RATE_LIMIT_WINDOW = Number(process.env.RATE_LIMIT_WINDOW)
const redis = new Redis();
const app = express()

const port = 3000

const rateLimiter = async function(req, res, next) {
  const ip = req.ip;

  const c = await redis.incr(req.ip)
  if(c == 1){ const e = await redis.expire(req.ip , RATE_LIMIT_WINDOW)};
 

  if(c >RATE_LIMIT_MAX){ 
    return res.status(429).send('Too Many Requests, please try again later.');
    }
  else {
    res.set('X-RateLimit-Remaining', RATE_LIMIT_MAX - c)
    next();
}
}
app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/dashboard.html')
})

app.get('/admin/stats', async (req, res) => {
  const keys = await redis.keys('*')
  const stats = {}
  for (const key of keys) {
  const count = await redis.get(key)
  stats[key] = count
}
  res.json(stats)
})

app.use(rateLimiter)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/test', async (req, res) => {
  const count = await redis.incr('myCounter')
  res.send(count)
})




app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
