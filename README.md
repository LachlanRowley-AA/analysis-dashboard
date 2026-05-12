This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started


First, create a local redis environment hosted on docker

Run
```docker run -d --name redis -p 6379:6379 redis:<version>```

Developed on redis 7.4.7

Configure the environment variables 
REDIS_URL
REDIS_PORT

Then start up the nextjs server with
```yarn dev```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Updating env variables
The only var that might need to be updates is META_ACCESS_TOKEN

This can be generated here
https://business.facebook.com/latest/settings/system_users?business_id=198369232107271&selected_user_id=61575039296691


## Brief Description
Data is fetched from Meta and GHL and is cached for 24 hours
Data is stored in MetaContextProvider

All metric calculations should be handled in MetricsGrid.tsx

# Misc
Please be aware that netlify has a ~10s API timeout, so ensure pagination if APIs are to be modified
Misc GHL leads should be stored in a 'fake' AdSetMetric, ideally minimal analysis is performed on the direct GHL lead data (their API data bodies aren't stable -- they updated timezone handling during the creation of the project so be aware other data may change)