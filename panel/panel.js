const duckdb = await import("https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm/+esm");

console.log(duckdb.PACKAGE_VERSION);

const bundles = duckdb.getJsDelivrBundles();
const bundle = await duckdb.selectBundle(bundles);

async function makeDB() {
  const logger = new duckdb.ConsoleLogger();
  const worker = await duckdb.createWorker(bundle.mainWorker);
  const db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule);
  return db
}

const db = await makeDB();

console.log(await db.getVersion());

const conn = await db.connect();

await conn.query("SET s3_endpoint='storage.googleapis.com'")
await conn.query("SET s3_access_key_id=''")
await conn.query("SET s3_secret_access_key=''")

async function query(sql) {
  const q = await conn.query(sql); // Returns v = 101
  const rows = q.toArray().map(Object.fromEntries);
  rows.columns = q.schema.fields.map((d) => d.name);

  return rows;
}

browser.runtime.onMessage.addListener(hover);
async function hover(request, sender, sendResponse) {
  const schema = await query(`SELECT path_in_schema AS column_name, type FROM parquet_metadata('s3://bdp-raw-prod/${request.filename}');`);
  //sendResponse({ schema });
  return Promise.resolve({ schema });
}