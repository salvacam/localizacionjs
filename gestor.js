/**************************************************************/
/***********************  Modulos          ********************/
/**************************************************************/

var exec = require("child_process").exec;
var url = require("url");
var fs = require("fs");
var replaceStream = require('replacestream');
var querystring = require("querystring");
var path = require("path");
var sha1 = require('sha1');
var md5 = require('MD5');
var Db = require('tingodb')().Db;
var nodemailer = require('nodemailer');

var configuracion = require("./configuracion.js");
var validaciones = require("./validaciones.js");
var objetos = require("./objetos.js");
var servidor = require("./servidor.js");

var io = require('socket.io').listen(configuracion.servidor);

/***********************    Base Datos       ********************/

var db = new Db(configuracion.datos.baseDatos, {});
var supervisorTabla = db.collection(configuracion.datos.tablaSupervisor);
var dispositivoTabla = db.collection(configuracion.datos.tablaDispositivo);
var posicionTabla = db.collection(configuracion.datos.tablaPosicion);

/***********************    Correo       ********************/

var gmail = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: configuracion.datos.gmailCorreo,
        pass: configuracion.datos.gmailPass
    }
});



/**************************************************************/
/***********************  Funciones        ********************/
/**************************************************************/


function escribir(pagina, response) {
    response.writeHead(200, {
        'Content-Type': 'text/html'
    });
    var flujo = fs.createReadStream(configuracion.datos.carpetaPublic + pagina);
    flujo.pipe(response);
};

function aviso(aviso, script, response) {
    response.writeHead(200, {
        'Content-Type': 'text/html'
    });
    fs.createReadStream(configuracion.datos.carpetaPublic + "/html/aviso1.html")
        .pipe(replaceStream('{Aviso}', aviso))
        .pipe(replaceStream('{Scripts}', script))
        .pipe(response);
};

function avisoAdmin(aviso, pag, viewSupervisor, correo, id, script, response) {
    response.writeHead(200, {
        'Content-Type': 'text/html'
    });
    fs.createReadStream(configuracion.datos.carpetaPublic + "/html/accesoAdmin.html")
        .pipe(replaceStream('{Aviso}', aviso))
        .pipe(replaceStream('{Paginacion}', pag))
        .pipe(replaceStream('{ValorSupervisor}', viewSupervisor))        
        .pipe(replaceStream('{Correo}', correo))
        .pipe(replaceStream('{Id}', id))
        .pipe(replaceStream('{Scripts}', script))
        .pipe(response);
};

function adminVer(nombre, contenido, id, response) {
    response.writeHead(200, {
        'Content-Type': 'text/html'
    });
    fs.createReadStream(configuracion.datos.carpetaPublic + "/html/ver.html")
        .pipe(replaceStream('{Nombre}', nombre))
        .pipe(replaceStream('{Contenido}', contenido))
        .pipe(replaceStream('{ValorId}', id))
        .pipe(response);
};

function viewDispositivo(disp, sup, idDisp, idSup, tiempo, response) {
    response.writeHead(200, {
        'Content-Type': 'text/html'
    });
    fs.createReadStream(configuracion.datos.carpetaPublic + "/html/dispositivo.html")
        .pipe(replaceStream('{ValorDisp}', disp))
        .pipe(replaceStream('{ValorSup}', sup))
        .pipe(replaceStream('{ValorIdDisp}', idDisp))
        .pipe(replaceStream('{ValorIdSup}', idSup))
        .pipe(replaceStream('{ValorTiempo}', tiempo))
        .pipe(response);
};

function recuperar(email, valor, response) {
    response.writeHead(200, {
        'Content-Type': 'text/html'
    });
    fs.createReadStream(configuracion.datos.carpetaPublic + "/html/recuperar.html")
        .pipe(replaceStream('valorEmail', email))
        .pipe(replaceStream('valorId', valor))
        .pipe(response);
}

function enviarCorreo(destino, opcion, enlace) {
    var asunto = "";
    var contenido = "";
    if (opcion == "activar") {
        asunto = 'Activa la cuenta';
        contenido = 'Activa tu cuenta en este ';
    } else if (opcion == "reestablecer") {
        asunto = 'Activa la cuenta';
        contenido = 'Activa tu cuenta en este ';
    }

    var mailOptions = {
        from: 'Web LocaliacionJS <programacion211@gmail.com>', // sender address
        to: destino, // list of receivers
        subject: asunto, // Subject line
        text: contenido + enlace,
        html: contenido + enlace
    };

    gmail.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log('Error occurred');
            console.log(error.message);
            return;
        }
        console.log('Message sent successfully!');
        console.log('Server responded with "%s"', info.response);
    });
}

function paginacion(pag, pagTotal, paso, direccion) {
    var numeroEnlaces = Math.ceil(parseInt(pagTotal) / parseInt(paso));

    if (pag < 0) {
        pag = 0;
    }
    if (pag > numeroEnlaces - 1) {
        pag = numeroEnlaces - 1;
    }

    var inicio = 0;
    var fin = numeroEnlaces;

    var salida = "";

    if (pag == 0) {
        salida += "<a class='pure-button button-secondary pure-button-disabled' id='reload' data-reload='" + direccion + "&pagina=0' href='#'>&#8810;</a>";
        salida += "<a class='pure-button button-secondary pure-button-disabled' href='#'>&#60;</a>";
    } else {
        salida += "<a class='pure-button button-secondary' href='" + direccion + "&pagina=0'>&#8810;</a>";
        salida += "<a class='pure-button button-secondary' href='" + direccion + "&pagina=" +
            (pag - 1) + "'>&#60;</a>";
    }

    salida += "<a class='pure-button button-secondary button-active pure-button-disabled' href='#'>" +
        (pag + 1) + " de " + numeroEnlaces + "</a>";

    if (pag < numeroEnlaces - 1) {
        salida += "<a class='pure-button button-secondary' href='" + direccion + "&pagina=" +
            (pag + 1) + "'>&#62;</a>";
        salida += "<a class='pure-button button-secondary' href='" + direccion + "&pagina=" +
            (numeroEnlaces - 1) + "'>&#8811;</a>";
    } else {
        salida += "<a class='pure-button button-secondary pure-button-disabled' href='#'>&#62;</a>";
        salida += "<a class='pure-button button-secondary pure-button-disabled' href='#'>&#8811;</a>";
    }
    return salida;
}

function crearTabla(docs) {
    var tabla = "";

    var odd = true;
    for (var x in docs) {
        if (odd) {
            tabla += '<tr class="pure-table-odd">';
            odd = false;
        } else {
            tabla += '<tr>';
            odd = true;
        }
        //tabla += ' <td>' + docs[x]._id + '</td> <td>' + docs[x].nombre + '</td>';
        tabla += ' <td>' + docs[x].nombre + '</td>';
        if (docs[x].vinculado) {
            tabla += '<td><a href="#" class="desvincular button-small button-warning pure-button" data-id="' + docs[x]._id + '"> <img src="../img/vincular.png" alt="vinculado" /> <span class="ordenador">Desvincular</span></a> </td>';
        } else {
            tabla += '<td> <img src="../img/desvincular.png" alt="vinculado" /> </td>';
        }
        tabla += '<td> <a href="#" class="borrar button-small button-error pure-button" data-id="' + docs[x]._id + '" data-delete="' + docs[x].nombre + '"><img src="../img/borrar.png" alt="borrar Dispositivo"/> <span class="ordenador">Borrar</span> </a> </td>';
        tabla += '<td> <a href="#" class="ver button-small button-success pure-button" data-id="' + docs[x]._id + '" ><img src="../img/visible.png" alt="ver Dispositivo" /> <span class="ordenador">Ver</span></a> </td>';
        tabla += '</tr>'
    }
    if (tabla == "") {
        tabla = "No hay dispositivos";
    }
    return tabla;
}

function ajaxRefrescar(request, response){

    var idSup = parseInt(getParametros(request).sup);
    var correo = getParametros(request).correo;
    var pag = parseInt(getParametros(request).pag)
    //validar datos
    if (!isNaN(idSup) && !isNaN(pag) && validaciones.validarCorreo(correo) == "") {                
        getHora(correo);                    
        var enlaces = "/supervisor?id=" + md5(configuracion.datos.pezarana + getHora(correo)) + "&email=" + correo;
        dispositivoTabla.find({
            supervisor: idSup
        }).count(function (err, count) {
            var paginasTotal = count;
            var numeroEnlaces = Math.ceil(parseInt(paginasTotal) / parseInt(configuracion.datos.pasoPaginas));
            if (pag > numeroEnlaces - 1) {
                pag = numeroEnlaces - 1;
            }

            dispositivoTabla.find({
                supervisor: idSup
            }).skip(pag * configuracion.datos.pasoPaginas).limit(configuracion.datos.pasoPaginas)
            .toArray(function(err, docs) { 
                var tabla = crearTabla(docs);
                var enlacesPag = paginacion(pag, paginasTotal, configuracion.datos.pasoPaginas, enlaces);           

                response.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                var json = JSON.stringify({
                    contenido: tabla,
                    enlacesPag: enlacesPag
                });
                response.end(json);
            });
        });
    } else {
        response.writeHead(404, {
            'Content-Type': 'application/json'
        });
        var json = JSON.stringify({
            r: 3
        });
        response.end(json);
    }

}

function getParametros(request) {
    var partes = url.parse(request.url, true);
    return partes.query;
}


var horaConexion = [];

function addHora(correo) {
    for (var i = 0; i < horaConexion.length; i++) {
        if (horaConexion[i].correo == correo) {
            horaConexion[i].hora = new Date().getTime();
            return true;
        }
    }
    horaConexion.push({
        correo: correo,
        hora: new Date().getTime()
    });
}

function getHora(correo) {
    for (var i = 0; i < horaConexion.length; i++) {
        if (horaConexion[i].correo == correo) {
            return horaConexion[i].hora;
        }
    }
    return false;
}


/**************************************************************************/
/*****************************      paginas      **************************/
/**************************************************************************/
function inicio(request, response) {
    /*
    supervisorTabla.find().toArray(function(err, docs) {
        console.log("longitud: " + docs.length);
        for (var x in docs) {
            console.log(docs[x]);
        }
    });

    dispositivoTabla.find().toArray(function(err, docs) {
        console.log("longitud: " + docs.length);
        for (var x in docs) {
            console.log(docs[x]);
        }
    });

    posicionTabla.find().toArray(function(err, docs) {
        console.log("longitud: " + docs.length);
        for (var x in docs) {
            console.log(docs[x]);
        }
    });
    */
    escribir("/index.html", response);
}
function error(request, response) {
    escribir("/html/error.html", response);
}
function dispositivo(request, response) {
    escribir("/html/dispositivoAcceder.html", response);
}

function admin(request, response) {    
    escribir("/html/admin.html", response);
}

function registro(request, response) {
    escribir("/html/registro.html", response);
}

function doRegistro(request, response, post) {
    //validar datos
    var msg = validaciones.validarRegistro(querystring.parse(post).correo, querystring.parse(post).correo1,
        querystring.parse(post).clave, querystring.parse(post).clave1);
    if (msg !== "") {
        aviso(msg, "", response);
        return;
    }

    var correoUsado = false;
    var supervisorNuevo = new objetos.Supervisor(querystring.parse(post).correo, sha1(querystring.parse(post).clave));
    supervisorTabla.findOne({
        correo: querystring.parse(post).correo
    }, function(err, item) {
        if (item !== null) {
            escribir("/html/correoUsado.html", response);
        } else {
            supervisorTabla.insert({
                correo: supervisorNuevo.correo,
                clave: supervisorNuevo.clave,
                activo: supervisorNuevo.activo
            });
            //var enlace = "<a href='http://localhost:8888/confirmar?id=" +
            var enlace = "<a href='http://localizacionjs.herokuapp.com/confirmar?id=" +
                md5(querystring.parse(post).correo + configuracion.datos.pezarana + sha1(querystring.parse(post).clave)) +
                "&email=" + querystring.parse(post).correo + "'>enlace</a>";
            enviarCorreo(querystring.parse(post).correo, "activar", enlace);
            escribir("/html/envioEnlace.html", response);
        }
    });
}

function confirmar(request, response) {
    var correoExiste = false;

    var clave = "";
    var clave = "";
    var activo = "";

    //var supervisorActual;
    exec(supervisorTabla.findOne({
            correo: getParametros(request).email
        }, function(err, item) {
            if (item !== null) {
                //            var supervisorActual = new objetos.Supervisor(item.correo, item.clave, item.activo);
                correoExiste = true;

                correo = item.correo;
                clave = item.clave;
                activo = item.activo;

            }
        }),
        function(error, stdout, stderr) {
            //if (supervisorActual !== null && supervisorActual !== undefined) {
            if (correoExiste) {
                if (activo == 0) {
                    //if (supervisorActual.activo == 0) {
                    escribir("/html/usuarioActivo.html", response);
                    return;
                }
                if (getParametros(request).id == (md5(getParametros(request).email + configuracion.datos.pezarana + clave)) && activo == 1) {
                    supervisorTabla.update({
                        correo: correo
                    }, {
                        correo: correo,
                        clave: clave,
                        activo: '0'
                    });
                    //supervisorActual.activar();
                    escribir("/html/usuarioActivo.html", response);
                } else {
                    console.log("error11111111111111111");
                    escribir("/html/error.html", response);
                }
            } else {
                escribir("/html/error.html", response);
            }
        });
}

function olvido(request, response) {
    escribir("/html/olvido.html", response);
}

function doOlvido(request, response, post) {
    //validar datos solo correo
    var validacion = validaciones.validarCorreo(querystring.parse(post).correo);
    if (validacion != "") {
        aviso(msg, "", response);
        return;
    }

    var correoUsado = false;
    var clave = "";
    exec(supervisorTabla.findOne({
        correo: querystring.parse(post).correo
    }, function(err, item) {
        if (item !== null) {
            correoUsado = true;
            clave = item.clave;
        }
    }), function(error, stdout, stderr) {
        if (correoUsado) {
            //var enlace = "<a href='http://localhost:8888/recuperar?id=" +
            var enlace = "<a href='http://localizacionjs.herokuapp.com/recuperar?id=" +
                md5(clave + configuracion.datos.pezarana + querystring.parse(post).correo) +
                "&email=" + querystring.parse(post).correo + "'>enlace</a>";
            enviarCorreo(querystring.parse(post).correo, "reestablecer", enlace);
            escribir("/html/envioEnlace.html", response);
        } else {
            escribir("/html/emailNoReg.html", response);
        }
    });
}


function recuperar(request, response) {
    var correoExiste = false;
    var clave = "";
    exec(supervisorTabla.findOne({
        correo: getParametros(request).email
    }, function(err, item) {
        if (item !== null) {
            correoExiste = true;
            clave = item.clave;
        }
    }), function(error, stdout, stderr) {
        if (correoExiste) {
            if (getParametros(request).id == (md5(clave + configuracion.datos.pezarana + getParametros(request).email))) {
                recuperar(getParametros(request).email, getParametros(request).id);
            } else {
                escribir("/html/error.html", response);
            }
        } else {
            escribir("/html/error.html", response);
        }
    });
}


function doRecuperar(request, response, post) {
    //validar datos
    var correo = querystring.parse(post).email;
    var claveNueva = querystring.parse(post).clave;
    var claveNueva1 = querystring.parse(post).clave1;

    var msg = validaciones.validarReestablecer(correo, clave, clave1);
    if (msg != "") {
        aviso(msg, "", response);
        return;
    }

    console.log(querystring.parse(post).id);
    console.log(querystring.parse(post).email);
    console.log(querystring.parse(post).clave);
    console.log(querystring.parse(post).clave1);

    var correoExiste = false;
    var clave = "";
    var activo = "";
    exec(supervisorTabla.findOne({
        correo: querystring.parse(post).email
    }, function(err, item) {
        if (item !== null) {
            correoExiste = true;
            clave = item.clave;
            activo = item.activo;
        }
    }), function(error, stdout, stderr) {
        if (correoExiste) {
            if (querystring.parse(post).id == (md5(clave + configuracion.datos.pezarana + querystring.parse(post).email)) && activo == "0") {
                console.log("modificar clave");
                supervisorTabla.update({
                    correo: correo
                }, {
                    correo: correo,
                    clave: sha1(claveNueva),
                    activo: '1'
                });
                aviso("Contraseña cambiada", "", response);
            } else {
                escribir("/html/error.html", response);
                console.log("error comprobacion");
            }
        } else {
            escribir("/html/error.html", response);
        }
    });
}

function doAcceder(request, response, post) {
    //validar datos
    var correo = querystring.parse(post).correo;
    var clavePasada = querystring.parse(post).clave;
    var msg = validaciones.validarAcceder(correo, clavePasada);
    if (msg != "") {
        aviso(msg, "", response);
        return;
    }
    var enlacesPag;
    var paginasTotal = 1;

    //var correoExiste = false;
    var clave = "";
    var activo = "";
    supervisorTabla.findOne({
        correo: correo
    }, function(err, item) {
        if (item !== null) {
            //correoExiste = true;
            clave = item.clave;
            activo = item.activo;
            idSupervisor = item._id.id;

            if (activo == "1") {
                //reenviar correo
                //var enlace = "<a href='http://localhost:8888/confirmar?id=" +
                var enlace = "<a href='http://localizacionjs.herokuapp.com/confirmar?id=" +
                    md5(querystring.parse(post).correo + configuracion.datos.pezarana + clave) +
                    "&email=" + querystring.parse(post).correo + "'>enlace</a>";
                enviarCorreo(querystring.parse(post).correo, "activar", enlace);
                aviso("El usuario no esta activo. Se ha enviado un enlace a su correo para activarlo",
                    '<script>  sessionStorage.removeItem("correo") </script>', response);
                return;
            } else {
                if (sha1(clavePasada) == clave) {
                    var paginaActual;
                    if (querystring.parse(post).pagina == "" || querystring.parse(post).pagina === undefined) {
                        paginaActual = 0;
                    } else {
                        paginaActual = parseInt(querystring.parse(post).pagina) - 1;
                    }
                    addHora(querystring.parse(post).correo);
                    console.log(getHora(querystring.parse(post).correo));

                    var enlaces = "/supervisor?id=" + md5(configuracion.datos.pezarana + getHora(querystring.parse(post).correo)) + "&email=" + correo;
                    console.log("Supervisor-" + idSupervisor);

                    dispositivoTabla.find({
                        supervisor: idSupervisor
                    }).count(function (err, count) {
                        var paginasTotal = count;
                        var numeroEnlaces = Math.ceil(parseInt(paginasTotal) / parseInt(configuracion.datos.pasoPaginas));
                        if (paginaActual > numeroEnlaces - 1) {
                            paginaActual = numeroEnlaces - 1;
                        }
            
                        dispositivoTabla.find({
                            supervisor: idSupervisor
                        }).skip(paginaActual * configuracion.datos.pasoPaginas).limit(configuracion.datos.pasoPaginas)
                        .toArray(function(err, docs) {
                            var tabla = crearTabla(docs);
                            enlacesPag = paginacion(paginaActual, paginasTotal, configuracion.datos.pasoPaginas, enlaces);
                            avisoAdmin(tabla, enlacesPag, "Supervisor_" + idSupervisor, correo, idSupervisor,
                             'sessionStorage.setItem("id", "' + md5(configuracion.datos.pezarana + getHora(querystring.parse(post).correo)) + '")', response);    
                        });
                    });
                } else {
                    aviso("Contraseña no valida", '<script>  sessionStorage.removeItem("correo") </script>', response);
                }
            }
        } else {
            aviso("Email no usado", '<script>  sessionStorage.removeItem("correo") </script>', response);
        }
    });
}


function supervisor(request, response) {
    //var correoExiste = false;
    var clave = "";
    var activo = "";
    var idSupervisor = "";
    var enlacesPag;
    var paginasTotal = 1;
    supervisorTabla.findOne({
        correo: getParametros(request).email
    }, function(err, item) {
        if (item !== null) {
            //correoExiste = true;
            clave = item.clave;
            activo = item.activo;
            idSupervisor = item._id.id;

            if (getParametros(request).id == (md5(configuracion.datos.pezarana + getHora(getParametros(request).email))) && activo == "0") {
                var paginaActual;
                if (getParametros(request).pagina == "" || getParametros(request).pagina === undefined) {
                    paginaActual = 0;
                } else {
                    paginaActual = parseInt(getParametros(request).pagina); //- 1;
                }
                /* Paginacion */
                var enlaces;
                if (request.url.lastIndexOf("&pagina") == -1) {
                    enlaces = request.url;
                } else {
                    enlaces = request.url.substring(0, request.url.lastIndexOf("&pagina"));
                }
                dispositivoTabla.find({
                    supervisor: idSupervisor
                }).count(function (err, count) {
                    var paginasTotal = count;
                    var numeroEnlaces = Math.ceil(parseInt(paginasTotal) / parseInt(configuracion.datos.pasoPaginas));
                    if (paginaActual > numeroEnlaces - 1) {
                        paginaActual = numeroEnlaces - 1;
                    }
            
                    dispositivoTabla.find({
                        supervisor: idSupervisor
                    }).skip(paginaActual * configuracion.datos.pasoPaginas).limit(configuracion.datos.pasoPaginas)
                    .toArray(function(err, docs) { 

                        var tabla = crearTabla(docs);
                        enlacesPag = paginacion(paginaActual, paginasTotal, configuracion.datos.pasoPaginas, enlaces);    
                        avisoAdmin(tabla, enlacesPag, "Supervisor_" + idSupervisor, getParametros(request).email, idSupervisor, '', response);    
                    });
                });
            } else {

                aviso("Error al introducir contraseña", '<script>  sessionStorage.removeItem("correo") </script>', response);
            }
        } else {
            escribir("/html/error.html", response);
        }
    });
}

function doIniciar(request, response, post, io) {
    //validar datos   
    var correo = querystring.parse(post).correo;
    var dispositivo = querystring.parse(post).dispositivo;
    var tiempo = querystring.parse(post).tiempo;
    var msg = validaciones.validarIniciar(correo, dispositivo, tiempo);
    if (msg != "") {
        aviso(msg, "", response);
        return;
    }
    var clave = "";
    var activo = "";
    var idSupervisor = "";

    var dispositivoExiste = false;
    var nombre = "";
    var vinculado = "";
    var idDisp = "";

    supervisorTabla.findOne({
        correo: correo
    }, function(err, item) {
        if (item !== null) {
            clave = item.clave;
            activo = item.activo;
            idSupervisor = item._id.id;

            if (activo == "1") {
                //reenviar correo
                //var enlace = "<a href='http://localhost:8888/confirmar?id=" +
                var enlace = "<a href='http://localizacionjs.herokuapp.com:8888/confirmar?id=" +
                    md5(querystring.parse(post).correo + configuracion.datos.pezarana + clave) +
                    "&email=" + querystring.parse(post).correo + "'>enlace</a>";
                enviarCorreo(querystring.parse(post).correo, "activar", enlace);
                aviso("El usuario no esta activo. Se ha enviado un enlace a su correo para activarlo",
                    '<script>  sessionStorage.removeItem("correo") </script>', response);
                return;
            } else {
                console.log("ver si existe el dispositivo");
                console.log("paso2");
                dispositivoTabla.findOne({
                    nombre: dispositivo,
                    supervisor: idSupervisor
                }, function(err, item) {
                    console.log(item);
                    if (item !== null) {
                        dispositivoExiste = true;
                        nombre = item.nombre;
                        idDisp = item._id.id;
                        console.log(idDisp);
                        //var idSupervisor = item.supervisor;
                        vinculado = item.vinculado;

                        if (vinculado) {
                            console.log(" ----------------> dispositivo en uso");
                            //si aviso no se puede usar desconectar dispositivo o desde panel de admin
                            aviso("Dispositivo en uso", "", response);
                            return;
                        } else {
                            console.log(" ----------------> dispositivo enviando");
                            dispositivoTabla.update({
                                nombre: nombre,
                                supervisor: idSupervisor
                            }, {
                                nombre: nombre,
                                supervisor: idSupervisor,
                                vinculado: true
                            });
                            var datos = {
                                id: idSupervisor,
                                correo: correo
                            };
                            //io.sockets.emit("Supervisor_" + idSupervisor, datos);//"refrescar-enviando");
                            io.sockets.emit("Supervisor_" + idSupervisor, "refrescar-enviando");
                            supervisorTabla.findOne({                                
                                _id: idSupervisor
                            }, function(err, item) {
                                viewDispositivo(nombre, item.correo, idDisp, idSupervisor, tiempo, response);
                            });
                        }
                    } else {
                        console.log(" ----------------> dispositivo no existe");
                        dispositivoTabla.insert({
                            nombre: querystring.parse(post).dispositivo,
                            supervisor: idSupervisor,
                            vinculado: true
                        });                        
                        var datos = {
                            id: idSupervisor,
                            correo: correo
                        };
                        //io.sockets.emit("Supervisor_" + idSupervisor, datos);//"refrescar-creado");
                        io.sockets.emit("Supervisor_" + idSupervisor, "refrescar-creado");

                        dispositivoTabla.findOne({
                            nombre: dispositivo,
                            supervisor: idSupervisor
                        }, function(err, item) {
                            nombre = item.nombre;
                            console.log(item);
                            if (item !== null) {
                                idDisp = item._id.id;
                                console.log(idDisp);
                                supervisorTabla.findOne({                                
                                    _id: idSupervisor
                                }, function(err, item) {
                                    viewDispositivo(nombre, item.correo, idDisp, idSupervisor, tiempo, response);
                                });
                               // viewDispositivo(dispositivo, idDisp, idSupervisor, tiempo, response);
                            }
                        });
                    }
                });
            }
        } else {
            aviso("Email no esta en uso", /*, intento de inicio en dispositivo", */
                '<script>  sessionStorage.removeItem("correo") </script>', response);
        }
    });
}


function fin(request, response, post, io) {
    var disp = querystring.parse(post).dispositivo;
    var idSup = querystring.parse(post).idSupervisor;
    dispositivoTabla.update({
        nombre: disp,
        supervisor: parseInt(idSup)
    }, {
        nombre: disp,
        supervisor: parseInt(idSup),
        vinculado: false
    }, function(err, result) {
        supervisorTabla.findOne({                                
            _id: idSup
        }, function(err, item) {                            
            var datos = {
                id: idSup,
                correo: item.correo
            };
            //io.sockets.emit("Supervisor_" + idSup, datos);//"refrescar-desvinculado");
            io.sockets.emit("Supervisor_" + idSup, "refrescar-desvinculado");
            escribir("/index.html", response);
        });
    });
}

function ver(request, response) {
    var nombre = "";
    var contenido = "[";
    var correoExiste = false;
    var clave = "";
    var activo = "";
    var idSupervisor = "";
    exec(supervisorTabla.findOne({
        correo: getParametros(request).email
    }, function(err, item) {
        if (item !== null) {
            correoExiste = true;
            clave = item.clave;
            activo = item.activo;
            idSupervisor = item._id.id;
        }
    }), function(error, stdout, stderr) {
        if (correoExiste) {
            if (getParametros(request).id == (md5(configuracion.datos.pezarana + getHora(getParametros(request).email))) && activo == "0") {
                dispositivoTabla.findOne({
                    _id: getParametros(request).disp
                }, function(err, item) {
                    if (item !== null) {
                        nombre += item.nombre;
                    }
                    //buscar posiciones
                    posicionTabla.find({
                        dispositivo: getParametros(request).disp
                    }).toArray(function(err, docs) {
                        //console.log("longitud: " + docs.length);
                        for (var x in docs) {
                            console.log(docs[x]);
                            contenido += "{fechaHora: '" + docs[x].fechaHora + "'";
                            contenido += ", latitud: " + docs[x].latitud + "";
                            contenido += ", longitud: " + docs[x].longitud + "";
                            contenido += "},"
                        }
                        if (contenido != "[") {
                            contenido = contenido.substring(0, contenido.length - 1);
                        }
                        contenido += "]";
                        console.log(contenido);
                        adminVer(nombre, contenido, getParametros(request).disp, response);
                    });
                });
            } else {
                escribir("/html/error.html", response);
            }
        } else {
            escribir("/html/error.html", response);
        }
    });
}

function ajaxSend(request, response, post, io) {
    //validar datos
    var msg = validaciones.validarPosicion(getParametros(request).disp,
        getParametros(request).date, getParametros(request).lat, getParametros(request).long);
    if (msg) {
        dispositivoTabla.findOne({
            _id: getParametros(request).disp
        }, function(err, item) {
            console.log(item);
            if (item !== null) {
                if (item.vinculado) {
                    posicionTabla.insert({
                        dispositivo: getParametros(request).disp,
                        fechaHora: getParametros(request).date,
                        latitud: getParametros(request).lat,
                        longitud: getParametros(request).long
                    });

                    var datos = {
                        fechaHora: getParametros(request).date,
                        latitud: getParametros(request).lat,
                        longitud: getParametros(request).long
                    };
                    io.sockets.emit(getParametros(request).disp, datos);

                    response.writeHead(200, {
                        'Content-Type': 'application/json'
                    });
                    var json = JSON.stringify({
                        r: 0
                    });
                    response.end(json);
                } else {
                    response.writeHead(200, {
                        'Content-Type': 'application/json'
                    });
                    var json = JSON.stringify({
                        r: 1
                    });
                    response.end(json);
                }
            } else {
                response.writeHead(200, {
                    'Content-Type': 'application/json'
                });

                var json = JSON.stringify({
                    r: 2
                });
                response.end(json);
            }
        });
    } else {
        response.writeHead(404, {
            'Content-Type': 'application/json'
        });
        var json = JSON.stringify({
            r: 3
        });
        response.end(json);
    }
}

function ajaxDesvincular(request, response) {
    //validar datos
    if (!isNaN(getParametros(request).disp)) {
        dispositivoTabla.findOne({
            _id: getParametros(request).disp
        }, function(err, item) {
            console.log(item);
            if (item !== null) {
                if (item.vinculado) {
                    console.log(item);
                    dispositivoTabla.update({
                        nombre: item.nombre,
                        supervisor: item.supervisor
                    }, {
                        nombre: item.nombre,
                        supervisor: item.supervisor,
                        vinculado: false
                    });
                    response.writeHead(200, {
                        'Content-Type': 'application/json'
                    });
                    var json = JSON.stringify({
                        r: 0
                    });
                    response.end(json);
                } else {
                    response.writeHead(200, {
                        'Content-Type': 'application/json'
                    });
                    var json = JSON.stringify({
                        r: 1
                    });
                    response.end(json);
                }
            } else {
                response.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                var json = JSON.stringify({
                    r: 2
                });
                response.end(json);
            }
        });
    } else {
        response.writeHead(404, {
            'Content-Type': 'application/json'
        });
        var json = JSON.stringify({
            r: 3
        });
        response.end(json);
    }
}

function ajaxBorrar(request, response) {
    //validar datos
    if (!isNaN(getParametros(request).disp)) {
        dispositivoTabla.findOne({
            _id: getParametros(request).disp
        }, function(err, item) {
            console.log(item);
            if (item !== null) {
                console.log(item);
                //borrar todas sus posiciones
                posicionTabla.insert({
                    dispositivo: getParametros(request).disp
                });
                // borrar el dispositivo
                dispositivoTabla.remove({
                    _id: getParametros(request).disp
                });
                response.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                var json = JSON.stringify({
                    r: 0
                });
                response.end(json);
            } else {
                response.writeHead(200, {
                    'Content-Type': 'application/json'
                });
                var json = JSON.stringify({
                    r: 2
                });
                response.end(json);
            }
        });
    } else {
        response.writeHead(404, {
            'Content-Type': 'application/json'
        });
        var json = JSON.stringify({
            r: 3
        });
        response.end(json);
    }
}


/********************************************************************/
/**********************       Recursos        ***********************/
/********************************************************************/


function recurso(tipo, request, response) {
    var ruta = configuracion.datos.carpetaPublic + url.parse(request.url).pathname;

    path.exists(ruta, function(exists) {
        if (exists) {
            fs.readFile(ruta, function(error, contenido) {
                if (error) {
                    response.writeHead(500);
                    response.end();
                } else {
                    response.writeHead(200, {
                        "Content-Type": tipo
                    });
                    response.end(contenido, 'utf-8');
                }
            });
        } else {
            response.writeHead(404);
            response.end();
        }
    });
}

function css(request, response) {
    recurso("text/css", request, response);
}


function js(request, response) {
    recurso("text/javascript", request, response);
}


function png(request, response) {
    recurso("image/png", request, response);
}


function eot(request, response) {
    recurso("application/vnd.ms-fontobject", request, response);
}


function svg(request, response) {
    recurso("image/svg+xml", request, response);
}


function ttf(request, response) {
    recurso("application/font-sfnt", request, response);
}


function woff(request, response) {
    recurso("application/font-woff", request, response);
}


function woff2(request, response) {
    recurso("application/font-woff2", request, response);
}

exports.inicio = inicio;
exports.error = error;
exports.dispositivo = dispositivo;
exports.admin = admin;
exports.registro = registro;
exports.doRegistro = doRegistro;
exports.confirmar = confirmar;
exports.olvido = olvido;
exports.doOlvido = doOlvido;
exports.recuperar = recuperar;
exports.doRecuperar = doRecuperar;
exports.doAcceder = doAcceder;
exports.supervisor = supervisor;
exports.doIniciar = doIniciar;
exports.fin = fin;
exports.ajaxSend = ajaxSend;
exports.ajaxDesvincular = ajaxDesvincular;
exports.ajaxBorrar = ajaxBorrar;
exports.ajaxRefrescar = ajaxRefrescar;
exports.ver = ver;

exports.css = css;
exports.js = js;
exports.png = png;
exports.eot = eot;
exports.svg = svg;
exports.ttf = ttf;
exports.woff = woff;
exports.woff2 = woff2;