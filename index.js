import { neon } from '@neondatabase/serverless';
import { engine } from 'express-handlebars';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const sql = neon('postgresql://neondb_owner:uhkKjfFP62Ms@ep-shy-mode-a57v4e26.us-east-2.aws.neon.tech/neondb?sslmode=require');

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

app.get('/consulta1', (req, res) =>{
    res.render ('consulta1')
})

////////    CONSULTAS ////////////////////


app.get('/consulta1/resultados', async (req, res) =>{
    const { nombreMedico } = req.query;

    if (!nombreMedico) {
        return res.status(400).json({ error: 'Debe proporcionar el nombre del médico' });
    }

    try {
        const query = `
            SELECT 
                Cita_Medica.ID_Cita,
                Paciente.Nombre AS Nombre_Paciente,
                Cita_Medica.Motivo,
                Cita_Medica.Fecha,
                Cita_Medica.Hora
            FROM 
                Cita_Medica
            JOIN 
                Paciente_Cita ON Cita_Medica.ID_Cita = Paciente_Cita.ID_Cita
            JOIN 
                Paciente ON Paciente_Cita.ID_Paciente = Paciente.ID_Paciente
            JOIN 
                Personal_Departamento ON Personal_Departamento.ID_Departamento = Cita_Medica.ID_Departamento
            JOIN 
                Personal_Medico ON Personal_Departamento.ID_Personal = Personal_Medico.ID_Personal
            WHERE 
                Personal_Medico.Nombre = $1
                AND Cita_Medica.Fecha BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
                AND Cita_Medica.Estado = 'Programada'
            ORDER BY 
                Cita_Medica.Fecha, Cita_Medica.Hora;
        `;

        const citas = await sql(query, [nombreMedico]);

        res.json({ citas });
    } catch (error) {
        console.error('Error al obtener las citas:', error);
        res.status(500).json({ error: 'Error al obtener las citas' });
    }
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
