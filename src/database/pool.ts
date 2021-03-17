import {createPool, Pool, PoolOptions} from 'mysql2';

export let pool:Pool;
export function startPool() {
    const poolOptions:PoolOptions = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        charset : 'utf8mb4'
    };
    pool = createPool(poolOptions);
}
export function endPool(){
    pool.end();
}