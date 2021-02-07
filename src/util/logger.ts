import winston, { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

export const logger = createLogger({
    level: 'debug',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
    ),
    defaultMeta: { service: 'chat-server' },
    transports: [
        //
        // - Write to all logs with level `info` and below to `combined.log`.
        // - Write all logs error (and below) to `error.log`.
        //
        new winston.transports.DailyRotateFile({
            filename: 'log/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true
        }),
        new winston.transports.DailyRotateFile({
            filename: 'log/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            level: "error"
        })
    ],
    exceptionHandlers: [
        new winston.transports.DailyRotateFile({
            filename: 'log/uncaught-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true
        }),
    ]
});

//
// If we're not in production then **ALSO** log to the `console`
// with the colorized simple format.
//
if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.combine(
            format.colorize(),
            format.simple()
        ),
        level: 'http'
    }));
}