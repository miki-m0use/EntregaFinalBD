import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:Wq8csb3lfxDI@ep-crimson-pine-a56j6l3g.us-east-2.aws.neon.tech/neondb?sslmode=require');

sql('SELECT * FROM playing_with_neon').then((results) => console.log(results));