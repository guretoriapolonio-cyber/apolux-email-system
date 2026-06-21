# Apolux — Sistema de Disparo de E-mails

Sistema de automação de e-mails em massa com painel web, desenvolvido em Python (Flask) com front-end em HTML/CSS/JS.

## Funcionalidades

- **Gestão de contatos** — cadastro manual ou importação via Excel/CSV
- **Templates ilimitados** — criação, edição e duplicação de modelos de e-mail personalizáveis
- **Disparo em massa** — envio com delay configurável entre mensagens (boas práticas anti-spam)
- **Rastreamento de abertura** — pixel de tracking para monitorar quem abriu o e-mail
- **Agendamento** — programação de disparos para data e hora futuras
- **Follow-up automático** — reengajamento de contatos sem resposta após X dias
- **Blacklist** — bloqueio de e-mails que não devem receber mensagens
- **Integração com WhatsApp** — envio complementar via WhatsApp Web
- **Dashboard de campanhas** — histórico completo com taxa de entrega e abertura
- **Exportação de relatórios** — geração de relatórios em Excel

## Stack técnica

- **Back-end:** Python, Flask
- **Front-end:** HTML5, CSS3, JavaScript (vanilla)
- **E-mail:** SMTP (Gmail) com autenticação via variáveis de ambiente
- **Dados:** armazenamento em JSON
- **Desktop:** empacotamento opcional via PyWebView (executável nativo)

## Como executar

```bash
# Clonar o repositório
git clone https://github.com/guretoriapolonio-cyber/apolux-email-system.git
cd apolux-email-system

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
# Crie um arquivo .env com:
# GMAIL_USER=seuemail@gmail.com
# GMAIL_PASS=sua-senha-de-app

# Rodar como site local
python app.py

# OU rodar como aplicativo desktop
python desktop_app.py
```

Acesse `http://localhost:5050` no navegador (se rodando como site).

## Estrutura do projeto

```
apolux-email-system/
├── app.py              # Backend Flask — toda a lógica de negócio e rotas da API
├── desktop_app.py      # Launcher para rodar como app desktop nativo
├── templates/
│   └── index.html      # Interface principal
├── static/
│   ├── css/style.css   # Estilos da aplicação
│   └── js/app.js       # Lógica de front-end e chamadas à API
└── requirements.txt     # Dependências do projeto
```

## Autor

**Gustavo Retori Apolônio**
[LinkedIn](https://linkedin.com) · [E-mail](mailto:guretoriapolonio@gmail.com)
