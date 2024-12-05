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

app.get('/administracion', (req, res) =>{
    res.render('administracion')
})


////////    CONSULTAS ////////////////////


app.get('/consulta1', (req, res) =>{
    res.render('consulta1')
})


app.get('/consulta2', (req, res) =>{
    res.render('consulta2')
})


app.get('/consulta3', (req, res) =>{
    res.render('consulta3')
})



app.get('/consulta4', (req, res) =>{
    res.render('consulta4')
})



app.get('/consulta5', (req, res) =>{
    res.render('consulta5')
})



app.get('/consulta6', (req, res) =>{
    res.render('consulta6')
})



app.get('/consulta7', (req, res) =>{
    res.render('consulta7')
})




app.get('/consulta8', (req, res) =>{
    res.render('consulta8')
})



app.get('/consulta9', (req, res) =>{
    res.render('consulta9')
})




app.get('/consulta10', (req, res) =>{
    res.render('consulta10')
})



app.get('/consulta11', (req, res) =>{
    res.render('consulta11')
})


app.get('/consulta12', (req, res) =>{
    res.render('consulta12')
})


app.get('/consulta13', (req, res) =>{
    res.render('consulta13')
})


app.get('/consulta14', (req, res) =>{
    res.render('consulta14')
})

app.get('/consulta15', (req, res) =>{
    res.render('consulta15')
})

app.listen(3000 , () => console.log('tuki'));
