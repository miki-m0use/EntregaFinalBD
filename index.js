import { neon } from '@neondatabase/serverless';
import { engine } from 'express-handlebars';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const sql = neon('postgresql://neondb_owner:Wq8csb3lfxDI@ep-crimson-pine-a56j6l3g.us-east-2.aws.neon.tech/neondb?sslmode=require');

const app = express();

//////      middlewares      /////
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');

/////////// ARCHIVOS ESTATICOS //////////////
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.render('index')
})

app.listen(3000 , () => console.log('tuki'));
