// @ts-ignore
import {createPool, Pool, PoolOptions} from 'mysql2';
import {logger} from "../util/logger";

export let pool:any;
export function startPool() {
    const poolOptions:PoolOptions = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        charset : 'utf8mb4'
    };
    pool = createPool(poolOptions);
    logger.info('pool created')
}
export async function endPool(){
    await new Promise((resolve, reject) => {
        pool.end((err:Error) => {
            if (err)
                reject(err)
            logger.info('pool ended')
            resolve()
        })
    })
}