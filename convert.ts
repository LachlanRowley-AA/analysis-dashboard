const { createClient } = require("redis");

const LIST_KEY = "metaAdsetData";
const ZSET_KEY = "metaAdsetData:zset";

(async () => {
  const client = createClient();
  await client.connect();

  const items = await client.lRange(LIST_KEY, 0, -1);

  console.log(`Found ${items.length} records`);

  for (const item of items) {
    const parsed = JSON.parse(item);

    const timestamp = Math.floor(
      new Date(parsed.date).getTime() / 1000
    );

    await client.zAdd(ZSET_KEY, {
      score: timestamp,
      value: item,
    });
  }

  console.log("Migration complete");
  await client.quit();
})();
