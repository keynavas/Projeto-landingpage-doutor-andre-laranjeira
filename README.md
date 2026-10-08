# Site do Dr. André · Pediatra no Tatuapé

Site institucional do Dr. André, pediatra (pediatria geral e neonatal) com consultório no Tatuapé, São Paulo.

## Páginas

| Arquivo      | Conteúdo                                                        |
|--------------|-----------------------------------------------------------------|
| `index.html` | Página inicial: início, sobre, jornada, atuação, atendimento e localização |
| `blog.html`  | Blog com acontecimentos, eventos e novidades                    |

## Estrutura

```
.
├── index.html          # Página inicial
├── blog.html           # Blog
├── support.js          # Runtime que renderiza as páginas (não editar)
├── assets/
│   ├── hero-dr-andre.jpg     # Foto do topo da página inicial
│   └── retrato-dr-andre.jpg  # Foto da seção "Sobre"
├── .nojekyll           # Faz o GitHub Pages servir os arquivos sem processamento
└── README.md
```

## Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie estes arquivos (veja os comandos abaixo).
2. No repositório, abra **Settings → Pages**.
3. Em **Build and deployment**, escolha **Deploy from a branch**, branch `main`, pasta `/ (root)` e clique em **Save**.
4. Em alguns minutos o site fica disponível em `https://<seu-usuario>.github.io/<nome-do-repositorio>/`.

```bash
git remote add origin https://github.com/<seu-usuario>/<nome-do-repositorio>.git
git push -u origin main
```

## Rodar localmente

As páginas precisam ser abertas por um servidor (não funcionam com duplo clique no arquivo). Por exemplo:

```bash
npx serve .
```

Depois acesse `http://localhost:3000`.

## Observações

- As páginas carregam React, Google Fonts, Google Maps e miniaturas do YouTube pela internet.
- Os posts criados no blog ficam salvos apenas no navegador de quem criou (`localStorage`); visitantes não os veem. Para um blog público, os posts precisam ser gravados no próprio `blog.html` ou em um banco de dados.
