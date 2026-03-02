const fs = require('fs');

const pokeData = JSON.parse(
    fs.readFileSync(`${__dirname}/../database/pokedex.json`)
);




const respondJSON = (request, response, status, object) => {
    const content = JSON.stringify(object);
    //const organizedContent = OrganizeContent(object);

    const headers = {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(content, 'utf8'),
    };

    response.writeHead(status, headers);

    if (request.method !== 'HEAD' && status !== 204) {
        response.write(content);
    }

    response.end();

};

const getAllPokemon = (request, response) => {
    const responseJSON = {
        pokemon: pokeData,
    };


    respondJSON(request, response, 200, responseJSON);
};

const getByType = (request, response) => {
    if (!request.query || !request.query.type) {
        const responseJSON = {
            message: 'type is required',
            id: 'MissingTypeParam'
        };
        return respondJSON(request, response, 400, responseJSON);
    }

    let type = request.query.type;


    //reference: https://d7k.medium.com/js-includes-vs-some-b3cd546a7bc3 
    const filteredPokemon = pokeData.filter(pokemon =>
        pokemon.type.some(t => t.toLowerCase().includes(type.toLowerCase()))
    );

    if (!filteredPokemon) {
        const responseJSON = {
            message: 'Not Valid Type'
        };
        return respondJSON(request, response, 200, responseJSON);
    }

    const responseJSON = {
        pokemon: filteredPokemon,
    };

    console.log(responseJSON);
    return respondJSON(request, response, 200, responseJSON);

};

const getByName = (request, response) => {
    if (!request.query || !request.query.name) {
        const responseJSON = {
            message: 'name is required',
            id: 'MissingNameParam'
        };
        return respondJSON(request, response, 400, responseJSON);
    }

    const pokeMatch = findPokemonByName(request);

    if (pokeMatch) {
        return respondJSON(request, response, 200, {
            pokemon: pokeMatch,
        });
    }

    // else, say no result were found
    return respondJSON(request, response, 200, { pokemon: {}, message: 'No Pokemon Were Found' });

};

const findPokemonByName = (request) => {
    let lcName = request.query.name.toLowerCase();

    // exact spelling of name, caps isn't required. 
    const exactMatch = pokeData.find(pokemon => pokemon.name.toLowerCase() === lcName);

    if (exactMatch) {
        return exactMatch;
    }

    // reference: https://www.w3schools.com/jsref/jsref_startswith.asp 
    // partial match to name starting from left to right
    const partialMatch = pokeData.filter(pokemon => pokemon.name.toLowerCase().startsWith(lcName));

    if (partialMatch) {
        return partialMatch;
    }

    return null;
}


const getByHeightWeight = (request, response) => {

    // if no params are entered, error out
    if (!request.query || (!request.query.minHeight && !request.query.maxHeight &&
        !request.query.minWeight && !request.query.maxWeight)) {

        const responseJSON = {
            message: 'At least one field (Weight or Height) is required',
            id: 'MissingHeightORWeightParams'
        };
        return respondJSON(request, response, 400, responseJSON);
    }

    // get the min and max of height and weight.
    // if no input, it's null. This will be used in the check below for filtered Pokmeon
    const minH = request.query.minHeight ? Number(request.query.minHeight) : null;
    const maxH = request.query.maxHeight ? Number(request.query.maxHeight) : null;
    const minW = request.query.minWeight ? Number(request.query.minWeight) : null;
    const maxW = request.query.maxWeight ? Number(request.query.maxWeight) : null;


    // at this point, it means there is a number to base on for the filter.
    const filteredPokemon = pokeData.filter(pokemon => {

        //parseFloat stops after any numerical value. so "1.0 kg" will be 1.0  "kg" will be dropped 
        const heightValue = parseFloat(pokemon.height);
        const weightValue = parseFloat(pokemon.weight);

        // checks height
        let heightMatch = (minH === null || heightValue >= minH) && (maxH === null || heightValue <= maxH);
        let weightMatch = (minW === null || weightValue >= minW) && (maxW === null || weightValue<= maxW);
        
        // if both height and weight matches, this pokemon match the filter
        // if any of the params/filter isn't filled, it's not "considered", so default true
        // if an of the height and weight doesn't match, this pokemon doesn't match.
        return heightMatch && weightMatch;
    });


    return respondJSON(request, response, 200, { pokemon: filteredPokemon, });

};

const recordFoundPokemon = (request, response) => {
    const responseJSON = {
        message: 'At least one field (id, name) is required',
    };

    const { id, name, isMarkFound, note } = request.body;

    //first, find both id and name aren't available, error out
    // can't do anything if no pokemon search
    if (!id && !name) {
        responseJSON.id = 'missingName&idParams';
        return respondJSON(request, response, 400, responseJSON);
    }


    const pokeMatchID = pokeData.find(pokemon => pokemon.id === Number(id));
    const pokeMatchName = pokeData.find(pokemon => pokemon.name.toLowerCase() === name.toLowerCase());

    // if no found for both, incorrect id or name
    if (!pokeMatchID && !pokeMatchName) {
        responseJSON.message = 'No Pokemon Found';
        return respondJSON(request, response, 200, responseJSON);
    }
    // at least one is valid

    // if both are valid. checks to see if both matches. if not, error
    // can't decide which to use
    if (pokeMatchID != null && pokeMatchName != null) {
        if (pokeMatchID != pokeMatchName) {
            responseJSON.message = 'Pokemon ID and Name does not match. Try again';
            return respondJSON(request, response, 200, responseJSON);
        }
    }

    let pokemonObj;

    if (pokeMatchID != null) {
        pokemonObj = pokeMatchID;
    }
    else {
        pokemonObj = pokeMatchName;
    }

    pokemonObj.mark_found = isMarkFound;
    pokemonObj.note = note;


    return respondJSON(request, response, 200, {pokemon:pokemonObj});

};

const addPokemon = (request, response) => {
    const responseJSON = {
        message: 'name is required',
    };

    const { newName } = request.body;
    
    if (!newName ) {
        responseJSON.id = 'addUserMissingParams';
        // 400 bad request
        return respondJSON(request, response, 400, responseJSON);
    }

    // success, no content
    let responseCode = 204;

    const pokeMatch = pokeData.find(pokemon => pokemon.name.toLowerCase() === newName.toLowerCase());

    if (!pokeMatch) {
        responseCode = 201;
        const idNum = pokeData.length +1;
        const newPoke = {
            id: idNum,
            name: newName
        }
        pokeData.push(newPoke);
    }
    
    // 201 successfully created
    if (responseCode === 201) {
        responseJSON.message = 'Created successfully';
        return respondJSON(request, response, responseCode, responseJSON);
    }


    return respondJSON(request, response, 200, {message: "Pokemon already exists"});
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
    getAllPokemon,
    getByType,
    getByName,
    getByHeightWeight,
    recordFoundPokemon,
    addPokemon,
    notFound,
}