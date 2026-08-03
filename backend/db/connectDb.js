import mongoose from 'mongoose';
import dns from 'node:dns';

// The local resolver (127.0.0.1) refuses SRV queries on some machines, which makes
// mongodb+srv:// URIs fail with "querySrv ECONNREFUSED". If that happens, append
// public resolvers to the system list and retry once.
const DNS_FALLBACK_SERVERS = ['8.8.8.8', '1.1.1.1'];

const isSrvLookupFailure = (error) =>
    /querySrv|ECONNREFUSED|EREFUSED|ESERVFAIL|ETIMEOUT/i.test(error.message);

export const connectDb = async () => {
    if (!process.env.MONGO_URI) {
        console.error('Error connecting to MongoDB: MONGO_URI is not defined in the .env file');
        process.exit(1);
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        if (!isSrvLookupFailure(error)) {
            console.error('Error connecting to MongoDB:', error.message);
            process.exit(1);
        }

        console.warn(`DNS SRV lookup failed (${error.message}); retrying with fallback DNS servers.`);

        try {
            dns.setServers([...new Set([...dns.getServers(), ...DNS_FALLBACK_SERVERS])]);
            const conn = await mongoose.connect(process.env.MONGO_URI);
            console.log(`MongoDB connected: ${conn.connection.host}`);
            return conn;
        } catch (retryError) {
            console.error('Error connecting to MongoDB:', retryError.message);
            process.exit(1);
        }
    }
};

export default connectDb;
