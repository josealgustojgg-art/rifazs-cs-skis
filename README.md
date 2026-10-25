# Corrida do Planalto 2026

Jogo fictício de entretenimento em navegador. Não representa votos, pesquisas ou resultados eleitorais. Sem apostas ou prêmios. Rostos são ilustrações geradas por IA sobre corpos 3D, não fotografias ou modelos faciais 3D personalizados.

## Começar no Windows

Instale Node.js 24 LTS em https://nodejs.org, extraia todo o pacote e abra `INICIAR-WINDOWS.bat`. Na primeira execução, ele instala as dependências de produção pelo lockfile; internet é necessária. O jogo compilado já vem no pacote. Deixe a janela aberta.

- Painel: `http://127.0.0.1:8080`
- Tela de transmissão: `http://127.0.0.1:8080/?live=1`

A tela de transmissão ocupa 9:16 e esconde os controles. Use uma fonte de navegador em 1080 × 1920 no OBS, se disponível, ou capture a janela no software de transmissão. O painel e a fonte compartilham a mesma corrida no servidor; não são partidas independentes. Som precisa ser ativado por uma interação no navegador que reproduz a cena; capturar uma janela com som ativo é uma alternativa quando a fonte não permite essa interação.

## Conectar a live

1. Abra o painel e localize **Conexão TikTok**. O @ `soou_jg` vem preenchido; salve caso o altere.
2. Inicie uma live pública no TikTok e clique **Conectar live**. Isso apenas recebe eventos: não inicia a live, não transmite vídeo e não envia mensagens ao público.
3. Se conectar, o catálogo de presentes é carregado; se necessário clique **Buscar catálogo**.
4. Escolha um presente para Lula e outro distinto para Flávio. Os IDs precisam ser reais, obtidos do catálogo. O mesmo ID não pode ser atribuído aos dois.
5. Compare o custo em moedas dos presentes e escolha valores iguais para equilíbrio. O preço é definido pelo TikTok; o jogo só configura pontos/avanço. Salve os presentes.
6. Confira a legenda do jogo. Presentes não mapeados são ignorados. Uma rosa não possui duas variantes automaticamente: use dois presentes distintos.
7. Apenas quando a conexão estiver de fato estabelecida, o topo indica **TikTok ao vivo**. Os botões do painel são simulações locais, para teste.

O catálogo depende do acesso do conector. Caso indisponível, não invente IDs: obtenha os IDs verdadeiros de uma fonte confiável do evento antes de salvar manualmente. Até haver mapeamento, eventos não movimentam os corredores.

Não há senha, cookie de login ou chave no frontend. O servidor usa `tiktok-live-connector` 2.5.0 e o fluxo público de leitura, sem autenticação de conta. A biblioteca é de terceiros, baseada em protocolo não oficial; TikTok pode alterar ou bloquear o acesso. A assinatura WebSocket depende do Euler Stream, com limites comunitários segundo a documentação da biblioteca. Não se garante disponibilidade, gratuidade ilimitada ou funcionamento em qualquer conta/região. Nenhuma integração oficial é alegada.

**Estado da validação real:** houve tentativa de conexão ao @soou_jg, sem conseguir localizar a sala (`Failed to retrieve Room ID from all sources`). Uma verificação posterior da página da live recebeu bloqueio de rede HTTP 403 do proxy deste ambiente. Isso impede verificar a conexão daqui e não confirma que a conta esteja offline. Nenhum presente real foi recebido ou validado nesta entrega. Os testes de eventos usam dados simulados. É necessário testar com a conta ao vivo no computador do transmissor.

## Regras da corrida

- Rodadas de 180 segundos; ninguém avança sem presentes.
- Um ponto vale 0,1% do percurso: são necessários 1.000 pontos para chegar à rampa. Valores em `src/game.js`, `CONFIG`.
- Efeitos por unidade: rosa 1 ponto; coração 5; turbo 10; especial 25. São nomes dos efeitos de teste, não IDs do TikTok. Cada presente real mapeado pode usar um desses efeitos.
- Presentes acumulam impulso sem perder a quantidade de uma sequência. Para presentes em sequência, só se credita o evento final com `repeatCount`, evitando duplicidade do encerramento. Pode haver espera até finalizar a sequência.
- Eventos duplicados com o mesmo ID/grupo são ignorados por até 30 minutos (cache limitado a 20 mil entradas). Eventos sem identidade estável são ignorados por segurança de contagem. Reiniciar a conexão limpa o cache; histórico inicial é desativado para reduzir replay.
- Durante pausa ou a tela final, presentes recebidos entram numa fila em memória (até 1.000 eventos) e são aplicados quando a corrida retoma. O painel mostra a fila. A fila e a corrida não sobrevivem ao fechamento do servidor. Não há recuperação de eventos ocorridos enquanto desconectado.
- Ao terminar o tempo, vence a maior distância mesmo sem chegada; empate permitido. Vitória/empate dura um segundo, e a próxima rodada começa automaticamente, sem botão de replay.
- Configuração pública de @ e IDs é salva em `.planalto-live.json`, ignorada pelo Git. Reconectar à live é manual ao reiniciar. Não são guardadas credenciais nem comentários.

## Desenvolvimento

Node.js 24 LTS recomendado. No diretório do projeto:

```sh
npm ci --cache /tmp/planalto-npm-cache --no-audit --no-fund
npm test
npm run build
npm start
```

Em Windows pode omitir a opção de cache, ou usar um diretório gravável do usuário. Para desenvolvimento com atualização automática, mantenha `npm start` em um terminal e execute `npm run dev` em outro. Vite encaminha `/api` e `/live` ao servidor da porta 8080. `npm run preview` só serve o build estático; para a ponte TikTok use `npm start`.

A porta padrão é 8080, alterável por `PLANALTO_PORT`; o servidor escuta apenas em `127.0.0.1`. Não exponha esse painel na internet. O modo independente HTML antigo continua sendo somente simulação; receber eventos reais requer o servidor Node em execução.

## Testes e limites

`npm test` executa testes de lógica, presentes cumulativos/deduplicação, adaptador simulado e API/WebSocket local. `node tests/browser-smoke.mjs` verifica WebGL, painel e fonte sincronizados, pausa/reset, formato 1080 × 1920, fallback GLB e layout móvel. Requer Chromium em `/usr/bin/chromium` ou `CHROMIUM_PATH`, e servidor ativo indicado por `PLANALTO_TEST_URL` (padrão http://127.0.0.1:8086). Não valida conexão TikTok real. O teste da API usa uma configuração temporária em `/tmp`, sem alterar dados do usuário.

Build emite aviso de bundle grande: a textura dos rostos é embutida para suportar distribuição em HTML; não impede a compilação. Renderização WebGL requer aceleração gráfica. Partículas limitadas a 180, resolução limitada e qualidade reduzida em quadros lentos. Meta de 60 FPS depende do hardware. Fonte Google opcional, com fallback local.

## Personagens GLB opcionais

Coloque modelos licenciados em `public/models/` antes do build, ou no diretório correspondente do pacote. Carregue pelo console:

```js
await window.planalto.loadModel('r', '/models/lula.glb');
await window.planalto.loadModel('g', '/models/flavio.glb');
```

Eixo Y vertical, frente +Z, altura normalizada automaticamente. Clipes `run`, `idle`, `celebrate`, sem distinção de maiúsculas. Se o GLB falhar, o personagem anterior permanece. Sem clipes, não há animação esquelética. Sem suporte implementado a expressões/morph targets. O carregamento é local à janela; para modelos permanentes configure-os no código de inicialização das duas telas.

## Organização

- `server/index.js`: servidor HTTP, WebSocket, corrida compartilhada, fila e configuração local.
- `server/tiktok.js`: conexão pública de leitura e catálogo.
- `server/gifts.js`: validação, roteamento por ID e deduplicação.
- `src/game.js`: regras determinísticas e eventos.
- `src/live.js`: cliente do servidor local.
- `src/scene.js`, `characters.js`, `faces.js`: Three.js, cena e personagens.
- `src/main.js`, `audio.js`, `style.css`: interface e áudio.

O HTML original enviado foi analisado e preservado nos anexos: corrida CSS, pontuação, rosa/turbo, contador, pausa, reinício e confetes. A versão atual conserva essas capacidades e acrescenta cena 3D e ponte local.

## Correção Windows 11: HTTP 403

A checagem de arquivos estáticos usa caminhos nativos do sistema, incluindo barras invertidas do Windows. Se uma versão antiga responder 403, encerre o servidor com Ctrl+C e use a versão atualizada. Não é necessário desativar o Controle de Aplicativo Inteligente; se o .bat for bloqueado, abra cmd na pasta do projeto, execute npm ci --omit=dev e depois npm run start:open.

## Cartões visuais de presentes

O placar mostra o retrato ilustrado de cada candidato acima da imagem do presente atribuído a ele. Ao selecionar um item no catálogo e salvar, são preservados ID, nome, imagem HTTPS e custo informado. O público vê o presente correspondente abaixo do retrato, sem precisar selecionar candidato. Imagem ausente ou inacessível mantém um ícone neutro e o nome; sem mapeamento aparece Presente não configurado. As cabeças continuam sendo ilustrações, não fotografias. `node tests/support-cards-smoke.mjs` verifica posição dos retratos, miniaturas com fixtures, persistência e fallback no Chromium.
