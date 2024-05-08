```

  ______  _____  _                __   __                                          
 |  ____|/ ____|| |               \ \ / /                                          
 | |__  | (___  | |       ______   \ V /  ___   ___  _ __  __ _  _ __    ___  _ __ 
 |  __|  \___ \ | |      |______|   > <  / __| / __|| '__|/ _` || '_ \  / _ \| '__|
 | |     ____) || |____            / . \ \__ \| (__ | |  | (_| || |_) ||  __/| |   
 |_|    |_____/ |______|          /_/ \_\|___/ \___||_|   \__,_|| .__/  \___||_|   
                                                                | |                
                                                                |_|                
```
- Scraper desenvolvido para coletar dados do X.
- Desenvolvido para a matéria de Práticas de Pesquisa em Sociologia (USP/2024).

## **Como usar**
1. Baixe e instale o [Node.js](https://nodejs.org/en/blog/release/v20.11.0) (versão 20.11.0).

2. Faça o download deste repositório. 
![](https://github.com/hermengardo/FSL0302-XScraper/blob/main/imgs/Captura%20de%20tela%202024-05-07%20162034.png?raw=true)

3. Extraia a pasta.

4. No arquivo app.js, edite os campos abaixo e salve:

```js
const Scraper = require("./scraper");

// Edite os valores dentro das aspas
new Scraper(
  "username", // seu nome de usuário
  "password", // senha
  "query" // termo de busca
);
```

5. Abra a pasta no terminal.

```sh
cd C:\edite_aqui_o_caminho_do_arquivo\FSL0302-XScraper
```

6. No terminal, instale as dependências (apenas na primeira vez que executar o código)

```sh
npm install
```

7. Ainda no terminal, execute o arquivo app.js.

```sh
node app.js
```

8. No fim da coleta, o resultado será salvo como "nome-da-busca.csv" na pasta do repositório.

## **Campos disponíveis**

| Variável      | Descrição                                                   | Tipo |
|---------------|-------------------------------------------------------------|--------------|
| user      | Nome de usuário do autor da publicação                       | str          |
| tweet_text       | Texto da publicação                                          | str          |
| replies      | Número de respostas                        | int          |
| retweets      | Número de retweets                              | int          |
| likes        | Número de curtidas                     | int          |
| datetime   | Data e hora em que a publicação foi feita                     | str          |
| source          | Link para o tweet                                | str   |
