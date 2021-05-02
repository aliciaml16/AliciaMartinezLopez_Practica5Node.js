// Importamos los módulos necesarios
const http = require("http");
const querystring = require("querystring");

//Puerto localhost:2000
const port = 2000;

// Definimos la Base de Datos MongoDB
const MongoClient = require("mongodb").MongoClient;
const url = "mongodb://localhost:27017";
const dbName = "ListaContactos";

//Se incluye "useUnifiedTopology: true" para que no hayan errores en la consola
const client = new MongoClient(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Creamos el servidor
const server = http.createServer((req, res) => {
  const { headers, method, url } = req;

  //Creamos la variable que guardará los datos
  let datos_recibidos = [];

  //Generamos los mensajes de error así como la concatenación y el final
  req
    .on("error", (err) => {
      console.error(err);
    })
    .on("data", (chunk) => {
      datos_recibidos.push(chunk);
    })
    .on("end", () => {
      datos_recibidos = Buffer.concat(datos_recibidos).toString();
    });

  //Dividimos la url con tal de sacar el nombre y el teléfono a partir de esta
  var path = url.split("?")[0]; //Separador inicial
  var url2 = url.substring(path.length, url.length);
  let opciones_query = querystring.decode(url2, "&"); //Separador entre valores

  //Solo si el método es POST, incluímos en la Base de Datos
  if (method == "POST") {
    client
      .connect()
      .then(async () => {
        console.log("Conectado con éxito al servidor");
        const db = client.db(dbName);
        
        var numeros = /^[0-9]+$/;

        //Si el número solo contiene números:
        if (opciones_query["phone"].match(numeros)) {
          //Insertamos el nuevo valor a la Base de Datos
          const collection = db.collection("usuarios");
          const insertResult = await collection.insertOne(opciones_query);

          // Generamos la respuesta que se visualizará
          const findResult = await collection.find({}).toArray();
          console.log("Documentos inicio: ", findResult);
          res.statusCode = 200; //Resultado 200
          res.setHeader("Content-Type", "text/html"); //Tipo de texto html
          // Contenido HTML de la respuesta
          res.write("<h2>¡Has introducido un nuevo contacto!</h2>");
          //Incluímos el nuevo dato introducido
          res.write(
            "<p>El nuevo contacto tiene como nombre <strong>" +
              opciones_query["?name"] +
              "</strong> y su teléfono es <strong>" +
              opciones_query["phone"] +
              "</strong></p>"
          );
          res.write(
            "<p>Este se ha añadido a tus contactos. Listamos todos los contactos a continuación</p><ul>"
          );
          //Listamos todos los contactos de la lista
          for (let i = 0; i < findResult.length; i++) {
            res.write(
              "<li>Nombre: <i>" +
                findResult[i]["?name"] +
                "</i><br> Teléfono:  <i>" +
                findResult[i]["phone"] +
                "</i></li>"
            );
          }
          res.write("</ul>");
          res.end();
        } else {
            res.write("<p>Los datos introducidos no son correctos. Recuerda que el número de teléfno solo puede contener números.</p>");
            res.end();
        }
      })
      //En caso de error:
      .catch((error) => {
        console.log(
          "Se ha producido un error con la conexión a la base de datos, el error es: " +
            error
        );
        client.close();
      });
  } else {
    //En caso de que no funcione, cambiamos el código a 404
    res.statusCode = 404;
    res.end();
  }
});

//Mensaje inciial que se reproduce al ejecutar el programa
server.listen(port, () => {
  console.log("Utiliza http://localhost:2000 en Postman para añadir contactos");
});
