// Variável global para armazenar o banco de questões
let questoes = [];

/**
 * Realiza o carregamento do arquivo JSON externo utilizando fetch.
 * O caminho é relativo à localização do index.html que consome este script.
 */
async function carregarBancoDeQuestoes() {
    try {
        const response = await fetch("data/questoes.json");

        if (!response.ok) {
            throw new Error(`Falha na requisição: ${response.status}`);
        }

        // Armazena o conteúdo convertido na variável global
        questoes = await response.json();

        // Log de sucesso com a quantidade de itens carregados
        console.log(`Questões carregadas: ${questoes.length}`);

    } catch (error) {
        // Tratamento de erro em caso de falha no fetch ou parsing
        console.error("Erro ao carregar o banco de questões:", error);
    }
}

// Executa o carregamento assim que o script é interpretado
carregarBancoDeQuestoes();
