# Corrida do Planalto 2026

Jogo fictício de entretenimento, sem apostas ou prêmios. Não representa votos, pesquisa ou resultados eleitorais. Rostos são ilustrações geradas por IA sobre corpos 3D, não fotografias ou modelos faciais personalizados.

## Windows 11: iniciar

Instale Node.js 24 LTS, extraia o ZIP e abra `INICIAR-WINDOWS.bat`. Na primeira execução ele instala as dependências e abre o jogo; mantenha a janela do servidor aberta. Se o Windows bloquear o .bat, não desative a proteção: abra CMD na pasta que contém package.json e execute:

```bat
npm ci --omit=dev
npm run start:open
```

Painel: `http://127.0.0.1:8080`. Tela 9:16: `http://127.0.0.1:8080/?live=1`. O painel e a captura compartilham a mesma corrida. Use uma fonte de navegador em 1080 × 1920 quando suportada, ou captura da janela no software de transmissão. O servidor só aceita conexões de loopback; não exponha o painel na internet. `PLANALTO_PORT` altera a porta.

## Configuração sem catálogo PRO

A conexão básica pelo @soou_jg funcionou no diagnóstico do usuário. A consulta de catálogo falhou com SignatureMissingTokensError; o catálogo de referência retornou HTTP 401. A [especificação oficial](https://github.com/EulerStream/Euler-Api-Sdk/blob/108cb5c19fd229e635b1c426885ad2283b41f078/spec/openapi.json) declara `/webcast/gifts/catalog` com escopo PRO. A conta Community não ganha esse acesso apenas criando uma chave.

**Não é obrigatório consultar esse catálogo para rotear os presentes.** Os quatro IDs podem ser cadastrados uma vez a partir de metadados reais, e a corrida recebe os eventos automaticamente depois. A versão atual permite importar uma lista sem esse serviço pago:

1. Com a transmissão encerrada, obtenha pelo seu navegador TikTok a resposta JSON da lista de presentes. Quando o painel de presentes carregar uma requisição `gift/list`, a resposta normalmente contém `data.gifts`. A disponibilidade dessa resposta depende da interface que o TikTok apresentar.
2. Use apenas a resposta JSON. Não use HAR, cookies, cabeçalhos, tokens ou chaves. Não é necessário enviar a resposta ao chat.
3. No jogo, abra **Importar lista do TikTok · sem catálogo PRO**, cole a resposta e clique **Importar lista de presentes**.
4. Clique **Configurar rosa + pares iguais**. O jogo escolhe Rosa/Rose para Lula, outro presente distinto do mesmo custo para Flávio e dois especiais distintos de igual preço, no menor patamar confirmado acima da rosa.
5. Confira os quatro nomes, preços e imagens. Uma lista obtida de outra conta/live pode ter disponibilidade diferente; confirme que os presentes estão disponíveis na conta transmissora.

O importador salva só ID, nome, custo e URL HTTPS da imagem. Campos extras são descartados. Até 1.000 itens normalizados ficam em `.planalto-live.json.catalog.json`, ignorado pelo Git. A lista importada é restaurada ao reiniciar. Nenhum ID, preço ou imagem é inventado quando falta informação. Pares com preços conhecidos diferentes são rejeitados.

No modo importado, conectar à live não dispara consulta ao catálogo PRO. A configuração inicial é feita uma vez; o público envia o presente correspondente, sem clicar ou comentar o nome. Sem metadados reais, a configuração continua pendente.

## Conectar e transmitir

Configure os presentes antes de anunciar participação. Inicie uma live pública e clique **Conectar live** no painel do jogo. O @soou_jg vem preenchido. O jogo apenas recebe eventos; não inicia a transmissão nem envia mensagens ao público. Verifique a mensagem de conexão e só considere recebimento real validado após um evento confirmado.

A biblioteca `tiktok-live-connector` é de terceiros e depende do protocolo do TikTok e de serviços de assinatura; pode sofrer limites ou mudanças. Não se promete integração oficial ou disponibilidade garantida. Não são exigidos senha ou cookies de conta pelo jogo. O histórico inicial é desativado para reduzir replay de eventos antigos.

**Estado atual:** conexão básica confirmada no computador do usuário, catálogo PRO indisponível no plano Community, recebimento de presentes reais ainda não validado. Testes locais usam dados simulados. A live foi encerrada após um aviso do TikTok sobre transmissão parada; mantenha a transmissão encerrada durante configuração e testes offline.

## Catálogo do provedor, opcional

Quem já possui acesso PRO pode usar **Catálogo do provedor · exige PRO** e consultar sem iniciar a live. Não é necessário contratar plano para usar a importação. Verifique condições e custos diretamente no provedor.

O campo protegido guarda a chave apenas na memória do servidor durante a sessão; não salva em arquivos nem devolve o valor no estado público. O backend também reutiliza `EULER_API_KEY` ou `SIGN_API_KEY` existentes. Não cole chaves no chat, GitHub ou código. Ao usar uma chave, um cliente novo do SDK evita reutilizar instância anônima em cache.

O SDK pode retornar HTTP 401 sem lançar exceção; o servidor verifica explicitamente esse status. Nenhuma assinatura ou validação TLS é desativada. Conexão da live e estado do catálogo são separados. Falha do catálogo não derruba uma conexão já estabelecida.

## Regras

- Rodadas de 180 segundos. Sem presentes não há avanço; 1.000 pontos completam o percurso.
- Normais: 1 ponto por unidade. Especiais: 25 pontos por unidade. É possível ajustar os efeitos no painel.
- Maior distância vence ao fim do tempo; empate permitido. Resultado aparece por um segundo e a próxima rodada começa automaticamente.
- Placar superior simples. Os presentes ficam abaixo da pista, em duas colunas, sem seletor de candidato. No painel os botões simulam o corredor/efeito fixos; na captura são desativados e os avisos de teste ficam ocultos.
- Sequências cumulativas só são creditadas no evento final. Eventos com identidade repetida são ignorados por até 30 minutos (cache máximo de 20 mil entradas). Sem identidade estável, não se credita o evento.
- Durante pausa/tela final, eventos mapeados ficam na fila em memória (até 1.000). Fechar o servidor perde corrida, fila e cache; não há recuperação do que ocorreu desconectado.
- Eventos não mapeados não avançam corredores. Metadados dos presentes recebidos podem alimentar uma lista parcial, sem inventar informações faltantes.
- Configuração de @ e quatro IDs fica em `.planalto-live.json`, ignorado pelo Git. Conexão TikTok é manual ao reiniciar.

## Desenvolvimento e verificação

```sh
npm ci --cache /tmp/planalto-npm-cache --no-audit --no-fund
npm test
npm run build
npm start
```

`npm run dev` inicia Vite com proxy para o servidor da porta 8080; mantenha também `npm start`. `npm run preview` sozinho não fornece a ponte TikTok. Testes de navegador: `node tests/support-cards-smoke.mjs` (Chromium em /usr/bin/chromium). `tests/browser-smoke.mjs` usa um servidor ativo em `PLANALTO_TEST_URL` (padrão http://127.0.0.1:8086).

Os testes cobrem regras, roteamento, v3, sequências, importação, persistência, campos protegidos, API/WebSocket e caminhos Windows. Chromium valida presentes fixos, layout 9:16 e importação sem live. Não são testes reais de presentes do TikTok. Build gera aviso de bundle grande por incluir a textura dos rostos.

WebGL/aceleração gráfica são necessários. Partículas limitadas a 180, resolução limitada e qualidade reduzida em quadros lentos. 60 FPS depende do hardware. Fonte Google é opcional, com fallback local. Áudio precisa ser ativado por clique na janela que reproduz a cena.

## Modelos GLB opcionais

Coloque modelos licenciados em public/models e use `window.planalto.loadModel('r','/models/lula.glb')` ou a equipe `g`. Altura é normalizada; eixo Y vertical, frente +Z. Clipes `run`, `idle`, `celebrate`, sem distinção de maiúsculas. Erros mantêm o personagem anterior. Sem clipes não há animação esquelética; expressões/morph targets não estão implementados. Carregamento é local à janela.

## Exportador local: sem procurar requisições manualmente

A pasta `ferramenta-catalogo` contém uma extensão local Manifest V3 para Edge/Chrome 111+. Em `edge://extensions` (ou `chrome://extensions`), ative Modo do desenvolvedor, use Carregar sem compactação e selecione a pasta que contém manifest.json. Atualize uma aba www.tiktok.com e abra o painel de presentes como espectador, sem iniciar uma transmissão ou enviar presentes.

O quadro Corrida do Planalto mostra quantos presentes foram encontrados. Salvar lista de presentes baixa `catalogo-presentes-tiktok.json`. No jogo, abra Importar lista do TikTok e use Selecionar arquivo da lista. Depois configure os quatro pares e confira os dados.

A ferramenta observa apenas respostas de `gift/list` que o próprio site carregou por fetch/XHR, mantendo as requisições normais do TikTok. Não lê cookies/senhas, não inicia lives, não envia presentes e não transmite dados a servidores. O arquivo contém só metadados de presentes. Nenhuma assinatura ou verificação TLS é desativada. Se a interface/API mudar e a lista não for capturada, a ferramenta fica aguardando e não inventa dados. A extensão pode ser removida após exportar.

`node tests/exporter-browser-smoke.mjs` executa o script real do exportador no Chromium com respostas simuladas e verifica fetch/XHR, deduplicação, arquivo JSON e descarte de campos privados. Não confirma a captura no TikTok real. O teste `support-cards-smoke.mjs` também verifica selecionar esse arquivo no jogo e configurar os quatro pares com a live desligada.
