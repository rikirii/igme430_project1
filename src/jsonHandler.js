const users={};

const respondJSON = (request, response, status, object)=>{
    const content = JSON.stringify(object);

    const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(content, 'utf8'),
    };

    response.writeHead(status, headers);

    if(request.method !== 'HEAD' && status !== 204){
        response.write(content);
    }

    response.end();

};


const getUsers = (request, response) =>{
    const responseJSON = {
        users,
    };


    respondJSON(request, response, 200, responseJSON);
};

const addUser = (request, response) =>{
    const responseJSON = {
        message: 'Name and age are both required',
    };

    const {name, age} = request.body;

    if (!name || !age){
        responseJSON.id = 'addUserMissingParams';
        // 400 bad request
        return respondJSON(request, response, 400, responseJSON);
    }

    // success, no content
    let responseCode = 204;

    if (!users[name]){
        responseCode = 201;
        users[name] = {
            name: name,
        };
    }

    users[name].age = age;

    // 201 successfully created
    if (responseCode === 201){
        responseJSON.message = 'Created successfully';
        return respondJSON(request, response, responseCode, responseJSON);
    }


    return respondJSON(request, response, responseCode, {});
}


const notFound = (request, response) => {
  // create error message for response
  const responseJSON = {
    message: 'The page you are looking for was not found.',
    id: 'notFound',
  };

  // return a 404 with an error message
  respondJSON(request, response, 404, responseJSON);
};

module.exports = {
    getUsers,
    addUser, 
    notFound,   
}