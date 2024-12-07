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

app.use(express.urlencoded({ extended: true }));
app.use(express.json());


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
                AND cita_medica.Fecha BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
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
                Factura.Fecha_Emision >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '2 months'
                AND Factura.Fecha_Emision < DATE_TRUNC('month', CURRENT_DATE)
            GROUP BY
                Paciente.ID_Paciente, Personal_Medico.ID_Personal
            ORDER BY
                Paciente.Nombre, Personal_Medico.Nombre;

        `;
        
        const facturacion = await sql(query);
        console.log(facturacion);

        
        res.render('consulta5', { facturacion });
        console.log('facturacion', facturacion)
    } catch (error) {
        console.error('Error al obtener el informe de facturación:', error);
        res.render('consulta5', { error: 'Ocurrió un error al obtener el informe de facturación.' });
    }
});



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.get('/consulta6', async (req, res) => {
    const { idMedico, fechaInicio, fechaFin } = req.query;

    if (!idMedico || !fechaInicio || !fechaFin) {
        return res.render('consulta6', { error: 'Debe proporcionar el ID del médico y el rango de fechas.' });
    }

    try {
        const query = `
            SELECT 
                Paciente.Nombre AS Nombre_Paciente,
                Cita_Medica.Fecha,
                Cita_Medica.Hora
            FROM 
                Cita_Medica
            JOIN 
                Paciente ON Cita_Medica.ID_Paciente = Paciente.ID_Paciente
            WHERE 
                Cita_Medica.ID_Personal = $1
                AND Cita_Medica.Fecha BETWEEN $2 AND $3
            ORDER BY 
                Cita_Medica.Fecha, Cita_Medica.Hora;
        `;

        // Ejecutar la consulta SQL
        const pacientes = await sql(query, [idMedico, fechaInicio, fechaFin]);

        // Renderizar los resultados en la vista
        res.render('consulta6', { pacientes, idMedico, fechaInicio, fechaFin });
        console.log('pacientes', pacientes)
    } catch (error) {
        console.error('Error al obtener los pacientes:', error);
        res.render('consulta6', { error: 'Ocurrió un error al obtener los pacientes atendidos.' });
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



app.get('/consulta12', async (req, res) => {
    const { idEquipo } = req.query;

    if (!idEquipo) {
        return res.render('consulta12', { error: 'Debe proporcionar el ID del equipo.' });
    }

    try {
        const query = `
            SELECT 
                equipo_cita.id_equipo AS ID_Equipo,
                cita_medica.fecha AS Fecha_Cita,
                cita_medica.hora AS Hora_Cita,
                paciente.nombre AS Nombre_Paciente,
                personal_medico.nombre AS Nombre_Medico
            FROM 
                equipo_cita
            JOIN 
                cita_medica ON equipo_cita.id_cita = cita_medica.id_cita
            JOIN 
                paciente ON cita_medica.id_paciente = paciente.id_paciente
            JOIN 
                personal_medico ON cita_medica.id_personal = personal_medico.id_personal
            WHERE 
                equipo_cita.id_equipo = $1
            ORDER BY 
                cita_medica.fecha DESC, cita_medica.hora DESC;
        `;

        const historial = await sql(query, [idEquipo]);
        res.render('consulta12', { historial, idEquipo });
        console.log('historial', historial)
    } catch (error) {
        console.error('Error al obtener el historial del equipo:', error);
        res.render('consulta12', { error: 'Ocurrió un error al obtener el historial del equipo.' });
    }
});



app.get('/consulta13', async (req, res) => {
    const { idPaciente, fechaInicio, fechaFin } = req.query;

    
    if (!idPaciente || !fechaInicio || !fechaFin) {
        return res.render('consulta13', { error: 'Debe proporcionar el ID del paciente y el rango de fechas' });
    }

    try {
        
        const query = `
            SELECT 
                cita_medica.Fecha, 
                cita_medica.Hora, 
                Personal_Medico.Nombre AS Nombre_Medico, 
                cita_medica.Diagnostico
            FROM 
                cita_medica
            JOIN 
                Paciente ON cita_medica.ID_Paciente = Paciente.ID_Paciente
            JOIN 
                Personal_Medico ON cita_medica.ID_Personal = Personal_Medico.ID_Personal
            WHERE 
                cita_medica.ID_Paciente = $1
                AND cita_medica.Fecha BETWEEN $2 AND $3
            ORDER BY 
                cita_medica.Fecha, cita_medica.Hora;
        `;

        
        const citas = await sql(query, [idPaciente, fechaInicio, fechaFin]);

        
        res.render('consulta13', { citas, idPaciente, fechaInicio, fechaFin });
        console.log('citas', citas)

    } catch (error) {
        console.error('Error al obtener las citas:', error);
        res.render('consulta13', { error: 'Ocurrió un error al obtener las citas del paciente.' });
    }
});




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


app.get('/consulta15', async (req, res) => {
    try {
        const query = `
            SELECT 
                Nombre, 
                Fecha_Nacimiento
            FROM 
                Paciente;
        `;

        const pacientes = await sql(query);

        res.render('consulta15', { pacientes });
        console.log('pacientes', pacientes)

    } catch (error) {
        console.error('Error al obtener la lista de pacientes:', error);
        res.render('consulta15', { error: 'Ocurrió un error al obtener la lista de pacientes.' });
    }
});



///////////////////////// Funcicones para ingresar pacientes, medicos, citas y 

app.post('/agregarPaciente', async (req, res) => {
    const { nombre, rut, genero, contacto, direccion, numeroSeguro, fechaNacimiento } = req.body;

    
    if (!nombre || !rut || !genero || !numeroSeguro) {
        return res.render('administracion', { error: 'Los campos Nombre, RUT, Género y Número de Seguro son obligatorios.' });
    }

    try {
        
        const query = `
            INSERT INTO Paciente (Nombre, RUT, Genero, Contacto, Direccion, Numero_Seguro, Fecha_Nacimiento)
            VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;

        
        await sql(query, [nombre, rut, genero, contacto, direccion, numeroSeguro, fechaNacimiento]);

        
        res.redirect('/administracion');  

    } catch (error) {
        console.error('Error al agregar el paciente:', error);
        res.render('administracion', { error: 'Ocurrió un error al agregar el paciente.' });
    }
});


app.post('/agregarMedico', async (req, res) => {
    const { nombre, rut, contacto, direccion, numeroLicencia, especialidad, idDepartamento } = req.body;

    
    if (!nombre || !rut || !numeroLicencia || !especialidad || !idDepartamento) {
        return res.render('administracion', { error: 'Los campos Nombre, RUT, Número de Licencia, Especialidad y ID de Departamento son obligatorios.' });
    }

    try {
        
        const query = `
            INSERT INTO Personal_Medico (Nombre, RUT, Contacto, Direccion, Numero_Licencia, Especialidad, ID_Departamento)
            VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;

        
        await sql(query, [nombre, rut, contacto, direccion, numeroLicencia, especialidad, idDepartamento]);

        
        res.redirect('/administracion');  

    } catch (error) {
        console.error('Error al agregar el médico:', error);
        res.render('administracion', { error: 'Ocurrió un error al agregar el médico.' });
    }
});



app.post('/agregar-consulta', async (req, res) => {
    const { fecha, hora, motivo, estado, diagnostico, tratamiento, idMedico, idPaciente } = req.body;

    
    if (!fecha || !hora || !motivo || !idMedico || !idPaciente) {
        return res.render('administracion', { error: 'Todos los campos son obligatorios.' });
    }

    try {
        const query = `
            INSERT INTO Cita_Medica (Fecha, Hora, Motivo, Estado, Diagnostico, Tratamiento, ID_Personal, ID_Paciente)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;

        
        const nuevaConsulta = await sql(query, [fecha, hora, motivo, estado || 'Programada', diagnostico || null, tratamiento || null, idMedico, idPaciente]);

        
        res.render('administracion', { mensaje: 'Consulta agregada con éxito', consulta: nuevaConsulta[0] });
    } catch (error) {
        console.error('Error al agregar la consulta:', error);
        res.render('administracion', { error: 'Ocurrió un error al agregar la consulta.' });
    }
});









app.listen(3000 , () => console.log('tuki'));
