import { neon } from '@neondatabase/serverless';
import { engine } from 'express-handlebars';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del archivo actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const sql = neon('postgresql://neondb_owner:TWQn1tsowjC4@ep-patient-art-a4tlr8sa.us-east-1.aws.neon.tech/neondb?sslmode=require');

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

app.get('/consulta1', async (req, res) => {
    const { idMedico } = req.query;

    // verificamos si el idMedico fue proporcionado
    if (!idMedico) {
        return res.render('consulta1', { error: 'Debe proporcionar el id del médico' });
    }

    try {
        
        const query = `
            SELECT 
    cita_medica.Fecha,
    cita_medica.Hora,
    Paciente.Nombre AS Nombre_Paciente,
    cita_medica.Motivo
FROM 
    cita_medica
JOIN 
    Paciente ON cita_medica.ID_Paciente = Paciente.ID_Paciente
WHERE 
    cita_medica.ID_Personal = $1
    AND cita_medica.Fecha BETWEEN CURRENT_DATE - INTERVAL '2 MONTH' AND CURRENT_DATE + INTERVAL '2 MONTH'
    AND cita_medica.Estado = 'Programada'
ORDER BY 
    cita_medica.Fecha, cita_medica.Hora;

        `;

        
        const citas = await sql(query, [idMedico]);

        
        res.render('consulta1', { citas, idMedico });
        console.log('citas', citas)

    } catch (error) {
        console.error('Error al obtener las citas:', error);
        res.render('consulta1', { error: 'Ocurrió un error al obtener las citas programadas', idMedico });
    }
});

///////
app.get('/consulta2', async (req, res) => {
    const { idPaciente } = req.query;

    if (!idPaciente) {
        return res.render('consulta2', { error: 'Debe proporcionar un ID de paciente.' });
    }

    try {
        const query = `
            SELECT 
                Historial_Medico.Fecha,
                Historial_Medico.Diagnostico,
                Historial_Medico.Tratamiento
            FROM 
                Historial_Medico
            WHERE 
                Historial_Medico.ID_Paciente = $1;
        `;

        const historial = await sql(query, [idPaciente]);

        res.render('consulta2', {historial});
    } catch (error) {
        console.error('Error al obtener el historial médico:', error);
        res.render('consulta2', { error: 'Ocurrió un error al obtener el historial médico.' });
    }
});

//////////////////////
app.get('/consulta3', async (req, res) => {
    try {
        const query = `
            SELECT 
                Nombre_Producto,
                Cantidad,
                Fecha_Caducidad
            FROM 
                Inventario_Medico
            WHERE 
                Cantidad <= 10000  -- este valor según lo podemos cambiar a lo que consideremos bajo stock
                AND Fecha_Caducidad <= CURRENT_DATE + INTERVAL '30 days'  --  los próximos 30 días de caducidad
            ORDER BY 
                Cantidad ASC, Fecha_Caducidad;
        `;

        const productos = await sql(query);

        
        res.render('consulta3', { productos });
    } catch (error) {
        console.error('Error al obtener los productos del inventario:', error);
        res.render('consulta3', { error: 'Ocurrió un error al obtener los productos del inventario.' });
    }
});



//////////////////////////////////
app.get('/consulta4', async (req, res) => {
    try {
        const query = `
            SELECT 
                tipo,
                estado
            FROM 
                equipo_medico
            WHERE 
                Estado IN ('En mantenimiento', 'En uso')  -- Equipos en mantenimiento o fuera de servicio porque estan en uso
            ORDER BY 
                tipo;
        `;

        const equipos = await sql(query);

        
        res.render('consulta4', { equipos });
    } catch (error) {
        console.error('Error al obtener los equipos médicos:', error);
        res.render('consulta4', { error: 'Ocurrió un error al obtener los equipos médicos.' });
    }
});



app.get('/consulta5', async (req, res) => {
    try {
        const query = `
            SELECT
                Paciente.Nombre AS Nombre_Paciente,
                Personal_Medico.Nombre AS Nombre_Medico,
                SUM(Factura.Monto) AS Total_Facturado
            FROM
                Factura
            JOIN
                Paciente ON Factura.ID_Paciente = Paciente.ID_Paciente
            JOIN
                Cita_Medica ON Factura.ID_Cita = Cita_Medica.ID_Cita
            JOIN
                Personal_Medico ON Cita_Medica.ID_Personal = Personal_Medico.ID_Personal
            WHERE
                EXTRACT(MONTH FROM Factura.Fecha_Emision) = EXTRACT(MONTH FROM CURRENT_DATE)
                AND EXTRACT(YEAR FROM Factura.Fecha_Emision) = EXTRACT(YEAR FROM CURRENT_DATE)
            GROUP BY
                Paciente.ID_Paciente, Personal_Medico.ID_Personal
            ORDER BY
                Paciente.Nombre, Personal_Medico.Nombre;
        `;
        
        const facturacion = await sql(query);
        console.log(facturacion);

        
        res.render('consulta5', { facturacion });
    } catch (error) {
        console.error('Error al obtener el informe de facturación:', error);
        res.render('consulta5', { error: 'Ocurrió un error al obtener el informe de facturación.' });
    }
});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/consulta6', async (req, res) => {
    try {

        const medicoRUT = req.query.medicoRUT || '12345678-9';  
        const fechaInicio = req.query.fechaInicio  || '2024-01-01'; 
        const fechaFin = req.query.fechaFin || '2024-12-31'; 

        
        const query = `
            SELECT p.Nombre AS Paciente, 
            pm.Nombre AS Personal_Medico, 
            cm.Fecha, 
            cm.Motivo, 
            cm.Diagnostico, 
            cm.Tratamiento
            FROM Cita_Medica cm
            JOIN Personal_Medico pm ON cm.ID_Personal = pm.ID_Personal
            JOIN Paciente p ON cm.ID_Paciente = p.ID_Paciente
            WHERE pm.RUT = $1  -- El RUT del médico o enfermero específico
            AND cm.Fecha BETWEEN $2 AND $3  -- Rango de fechas
            AND cm.Estado = 'Completada';  -- Solo citas completadas`
        ;

        // Ejecuta la consulta con los parámetros dinámicos
        const pacientes = await sql.query(query, [medicoRUT, fechaInicio, fechaFin]);

        
        res.render('consulta6', { pacientes: pacientes.rows, medicoRUT, fechaInicio, fechaFin });
    } catch (error) {
        console.error('Error al obtener los pacientes:', error);
        res.render('consulta6', { error: 'Ocurrió un error al obtener los pacientes.' });
    }
});



////////////////////////////////////////////////////////////
app.get('/consulta7', async (req, res) => {
    try {
        const query = `
            SELECT
                paciente.nombre AS Nombre_Paciente,
                Cita_Medica.Fecha,
                Cita_Medica.Estado
            FROM
                Cita_Medica
            JOIN
                Paciente ON Cita_Medica.ID_Paciente = Paciente.ID_Paciente
            WHERE
                Cita_Medica.Estado IN ('Cancelada', 'Reprogramada')  -- el estado de la cita
                AND Cita_Medica.Fecha BETWEEN CURRENT_DATE - INTERVAL '1 MONTH' AND CURRENT_DATE -- puede que no salga nada debido a las fechas que hay en la base de datos
            ORDER BY
                Cita_Medica.Fecha;
        `;

        const pacientes = await sql(query);
        console.log('Pacientes:', pacientes);

        res.render('consulta7', { pacientes });
    } catch (error) {
        console.error('Error al obtener los pacientes con citas canceladas o reprogramadas:', error);
        res.render('consulta7', { error: 'Ocurrió un error al obtener los pacientes.' });
    }
});




//////////////////////////////////////////////////////////////////////////

app.get('/consulta8', async (req, res) => {
    try {
        const { fecha, hora } = req.query;

        if (!fecha || !hora) {
            return res.render('consulta8', { error: 'Por favor, seleccione una fecha y hora.' });
        }

        const query = `
            SELECT 
                Personal_Medico.ID_Personal,
                Personal_Medico.Nombre,
                Personal_Medico.Especialidad
            FROM 
                Personal_Medico
            LEFT JOIN 
                Cita_Medica ON Personal_Medico.ID_Personal = Cita_Medica.ID_Personal
                AND Cita_Medica.Fecha = $1
                AND Cita_Medica.Hora = $2
            WHERE 
                Cita_Medica.ID_Cita IS NULL
            ORDER BY 
                Personal_Medico.Nombre;
        `;

        const medicosDisponibles = await sql(query, [fecha, hora]);

        res.render('consulta8', { medicosDisponibles, fecha, hora });
    } catch (error) {
        console.error('Error al obtener la disponibilidad de los médicos:', error);
        res.render('consulta8', { error: 'Ocurrió un error al obtener la disponibilidad de los médicos.' });
    }
});


////////////////////////////////////////////////////////////////////

app.get('/consulta9', async (req, res) => {
    try {
        const query = `
            SELECT 
                Nombre_Producto, 
                Fecha_Caducidad
            FROM 
                inventario_medico
            WHERE 
            Fecha_Caducidad < CURRENT_DATE -- esto muestra los medicamentes caducados y los proximos a caducar
            OR Fecha_Caducidad BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
            ORDER BY 
                Fecha_Caducidad;
        `;

        const medicamentos = await sql(query);
        res.render('consulta9', { medicamentos });
    } catch (error) {
        console.error('Error al obtener los medicamentos próximos a caducar:', error);
        res.render('consulta9', { error: 'Ocurrió un error al obtener los medicamentos.' });
    }
});




////////////////////////////////////////////////////////////////////////////////

app.get('/consulta10', async (req, res) => {
    try {
        const query = `
            SELECT 
                Estado,
                Nombre_Producto
            FROM 
                Inventario_Medico
            ORDER BY 
                Estado ,Nombre_Producto ;
        `;

        const inventario = await sql(query);
        console.log('inventario', inventario)
        res.render('consulta10', { inventario });
    } catch (error) {
        console.error('Error al obtener el inventario:', error);
        res.render('consulta10', { error: 'Ocurrió un error al obtener el inventario.' });
    }
});



///////////////////////////////////////////////////////////////////////////
app.get('/consulta11', async (req, res) => {
    try {
        const query = `
            SELECT
                Factura.ID_Factura,
                Paciente.Nombre AS Nombre_Paciente,
                Factura.Monto AS Monto_Pendiente,
                Factura.Estado_Pago
            FROM
                Factura
            JOIN
                Paciente ON Factura.ID_Paciente = Paciente.ID_Paciente
            WHERE
                Factura.Estado_Pago = 'Pendiente'
            ORDER BY
                Factura.ID_Factura;
        `;
        
        const facturasPendientes = await sql(query);
        res.render('consulta11', { facturasPendientes });
        console.log('facturasPendientes', facturasPendientes)
    } catch (error) {
        console.error('Error al obtener las facturas pendientes:', error);
        res.render('consulta11', { error: 'Ocurrió un error al obtener las facturas pendientes.' });
    }
});



app.get('/consulta12', (req, res) =>{
    res.render('consulta12')
})


app.get('/consulta13', (req, res) =>{
    res.render('consulta13')
})


app.get('/consulta14', async (req, res) => {
    try {
        const query = `
            SELECT
                Nombre,
                Especialidad
            FROM
                Personal_Medico
            ORDER BY
                Especialidad, Nombre;
        `;
        
        const especialidades = await sql(query);
        res.render('consulta14', { especialidades });
    } catch (error) {
        console.error('Error al obtener las especialidades:', error);
        res.render('consulta14', { error: 'Ocurrió un error al obtener las especialidades.' });
    }
});


app.get('/consulta15', (req, res) =>{
    res.render('consulta15')
})

app.listen(3000 , () => console.log('tuki'));
