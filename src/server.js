const http = require('http');

const htmlHandler = require('./htmlHandler.js');
const jsonHandler = require('./jsonHandler.js');


const port = process.env.PORT || process.env.NODE_PORT || 3000;


const parseBody = (request, response, handler) => {
  const body = [];

  request.on('error', (err) => {
    console.dir(err);
    response.statusCode = 400;
    response.end();
  });


  request.on('data', (chunk) => {
    body.push(chunk);
  });

  request.on('end', () => {
    const bodyString = Buffer.concat(body).toString();
    const type = request.headers['content-type'];
    if (type === 'application/json') {
      request.body = JSON.parse(bodyString);
    } else {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.write(JSON.stringify({ error: 'invalid data format' }));
      return response.end();
    }


    handler(request, response);
  });
};

const handlePost = (request, response, parsedUrl) =>{
    if (parsedUrl.pathname ==='/addUser'){
        parseBody(request, response, jsonHandler.addUser);
    }
};


const handleGet = (request, response, parsedUrl) =>{
    const pathName = parsedUrl.pathname;

    switch(pathName){
        case '/':
            htmlHandler.getIndex(request,response);
            break;
        case '/style.css':
            htmlHandler.getCSS(request,response);
            break;

        case '/getUsers':
            jsonHandler.getUsers(request, response);
            break;
        default:
            jsonHandler.notFound(request, response);
            break;

    }
}



const onRequest = (request, response) =>{
    const protocol = request.connection.encrypted ? 'https' : 'http';
    const parsedUrl = new URL(request.url, `${protocol}://${request.headers.host}`);

    // check if method was POST, otherwise assume GET
    // for the sake of this example
    if (request.method === 'POST') {
        handlePost(request, response, parsedUrl);
    } else {
        handleGet(request, response, parsedUrl);
    }

    
};


http.createServer(onRequest).listen(port, () => {
  console.log(`Listening on 127.0.0.1:${port}`);
});
