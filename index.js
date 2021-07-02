const express = require('express');
const helmet = require('helmet');
require('dotenv').config()
const validator = require('cpf-cnpj-validator');
const cpfValidator = validator.cnpj;


// Variável global que simula dum repositório de pessoas e receitas
const repositorioPessoas = [];
const repositorioReceitas = [];

// Variáveis globais para gerar os id das pessoas e receitas
let contadorIdPessoa = 0;
let contadorIdReceitas = 0;


function proximoIdPessoa () {
    return ++contadorIdPessoa;
}

function proximoIdReceita () {
    return ++contadorIdReceitas;
}


function Pessoa ( id, nome, dataNascimento, cpf, ativo, meta) {
    return {
        id : id,
        nome : nome,
        dataNascimento : dataNascimento,
        cpf : cpf,
        ativo : ativo,
        meta : meta,
    }
}



function PageablePessoas ( paginaAtual, tamanho, pessoas ) {
    const totalPessoas = pessoas.length;
    const numeroDePaginas = totalPessoas / tamanho;

    if ( paginaAtual > numeroDePaginas) 
        paginaAtual = numeroDePaginas;

    const indiceInicial = paginaAtual * tamanho;
    let indiceFinal = indiceInicial + tamanho;

    if ( indiceFinal >= totalPessoas ) 
    indiceFinal = totalPessoas - 1;

    let pessoasRetorno = [];
    for ( let indice = indiceInicial; indice <= indiceFinal; indice++ ) {
        pessoasRetorno.push(pessoas[indice]);
    }

    return {
        pagina : paginaAtual,
        tamanho : tamanho,
        numeroRegistros : totalPessoas,
        registros: pessoasRetorno
    }
}



function Receita ( id, pessoaId, data, deposito) {
    return {
        id : id,
        pessoaId : pessoaId,
        data : data,
        deposito : deposito
    }
}




function PageableReceitas ( paginaAtual, tamanho, receitas ) {
    const totalReceitas = receitas.length;
    const numeroDePaginas = totalReceitas / tamanho;

    if ( paginaAtual > numeroDePaginas) 
        paginaAtual = numeroDePaginas;

    const indiceInicial = paginaAtual * tamanho;
    let indiceFinal = indiceInicial + tamanho;

    if ( indiceFinal >= totalReceitas ) 
    indiceFinal = totalReceitas - 1;

    let receitasRetorno = [];
    for ( let indice = indiceInicial; indice <= indiceFinal; indice++ ) {
        receitasRetorno.push(receitas[indice]);
    }

    return {
        pagina : paginaAtual,
        tamanho : tamanho,
        numeroRegistros : totalReceitas,
        registros: receitasRetorno
    }
}




function TotalizadorPessoa ( id, nome, meta, depositos) {
    return {
        id : id,
        nome : nome,
        meta : meta,
        depositos : depositos
    }
}



function parametroValido (parametro) {
    if ( parametro === null ) return false;
    if ( parametro === '' ) return false;
    return true;
}


const app = express();
app.use(helmet())
app.use(express.json());


// Rotas para Pessoas

app.get('/api/pessoas', (request, response) => {
    const {pagina = 0, tamanho = 10} = request.query;
    if (repositorioPessoas === null || repositorioPessoas.length === 0 )
      return response.status(204).json({erro: 'Nenhum registro encontrado'});

    return response.status(200).json(new PageablePessoas(parseInt(pagina), parseInt(tamanho), repositorioPessoas));
});


app.get('/api/pessoas/:id', (request, response) => {
    const {id} = request.params;

    if ( isNaN(id) ) 
        return response.status(400).json({erro: 'Id não é válido'});

    let pessoa = repositorioPessoas.find((pessoaAtual) => (pessoaAtual.id === parseInt(id)));
    if ( pessoa === null )
        return response.status(404).json({erro: 'Id não cadastrado'});

    return response.status(200).json(pessoa);
});


app.post('/api/pessoas', (request, response) => {

    if (! request.body )
        return response.status(400).json({erro: 'Parâmetros inválidos'});

    const {nome, dataNascimento, cpf, ativo, meta} = request.body;

    if (! (  parametroValido(nome) &&  parametroValido(dataNascimento) && 
             parametroValido(meta) && parametroValido(meta) ) )
        return response.status(400).json({erro: 'Parâmetros inválidos'});

    if ( ! cpfValidator(cpf))
        return response.status(400).json({erro: 'CPF inválido'});

    const pessoa = new Pessoa( proximoIdPessoa(), nome, dataNascimento, cpf, ativo, meta);
    repositorioPessoas.push(pessoa)
    return response.status(201).json(pessoa);
});


app.put('/api/pessoas/:id', (request, response) => {

    const {id} = request.params;
    if ( isNaN(id) ) 
        return response.status(400).json({erro: 'Id não é válido'});

    const {nome, dataNascimento, cpf, ativo, meta} = request.body;

    if (! (  parametroValido(nome) &&  parametroValido(dataNascimento) && 
             parametroValido(meta) && parametroValido(meta) ) )
        return response.status(400).json({erro: 'Parâmetros inválidos'});

    if ( ! cpfValidator(cpf) ) 
        return response.status(400).json({erro: 'CPF inválido'});

    let indicePessoa=-1;
    for ( indicePessoa = 0; indicePessoa < repositorioPessoas.length; indicePessoa++ ) {
        if ( repositorioPessoas[indicePessoa].id === id ) break;
    }

    if ( indicePessoa < 0 )
        return response.status(404).json({ erro: 'Id não cadastrado'});

    const pessoaAtualizada = new Pessoa( id, nome, dataNascimento, cpf, ativo, meta);
    repositorioPessoas.splice(indicePessoa, 1, pessoaAtualizada)
    return response.status(200).json(pessoaAtualizada);

});


// Rotas para Receitas

app.get('/api/receitas', (request, response) => {
    const {pagina = 0, tamanho = 10} = request.query;
    if (repositorioReceitas === null || repositorioReceitas.length === 0 )
      return response.status(204).json({erro: 'Nenhum registro encontrado'});

    return response.status(200).json(new PageableReceitas(parseInt(pagina), parseInt(tamanho), repositorioReceitas));
});


app.get('/api/receitas/:id', (request, response) => {
    const {id} = request.params;

    if ( isNaN(id) ) 
        return response.status(400).json({erro: 'Id não é válido'});

    let receita = repositorioReceitas.find((receitaAtual) => (receitaAtual.id === parseInt(id)));
    if ( receita === null )
        return response.status(404).json({erro: 'Id não cadastrado'});

    return response.status(200).json(receita);
});


app.post('/api/receitas', (request, response) => {

    if (! request.body )
        return response.status(400).json({erro: 'Parâmetros inválidos'});

    const {pessoaid, data, deposito} = request.body;

    if (! (  parametroValido(pessoaid) &&  parametroValido(data) && 
             parametroValido(deposito) ) )
        return response.status(400).json({erro: 'Parâmetros inválidos'});

    const receita = new Receita( proximoIdReceita(), pessoaid, data, deposito);
    repositorioReceitas.push(receita)
    return response.status(201).json(receita);
});



// Rota para totalização por Pessoa

app.get('/api/totalizadores', (request, response) => {

    if (repositorioPessoas === null ) 
        return response.status(204).json({erro: 'Nenhuma pessoa cadastrada'});

    if (repositorioPessoas.length < 1 ) 
        return response.status(204).json({erro: 'Nenhuma pessoa cadastrada'});

    const totalizadorPorPessoa = [];
    let totalizadorDaPessoa;
    let depositos;

    repositorioPessoas.forEach( (pessoa) => {

        depositos = 0;
        repositorioReceitas.forEach( (receita) => {
            if ( receita.pessoaId == pessoa.id )
                depositos += receita.deposito;
        });

        totalizadorDaPessoa = new TotalizadorPessoa( pessoa.id, pessoa.nome, pessoa.meta, depositos);
        totalizadorPorPessoa.push(totalizadorDaPessoa);
    });

    return response.status(200).json(totalizadorPorPessoa);
    
})



// Iniciar serviço na porta especifica no arquivo .env
const porta = process.env.PORTA || 3300;
app.listen(porta, () => {
    console.log(`Servidor ouvindo na porta ${porta} ....`);
});
