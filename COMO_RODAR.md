# Impulse+ — como rodar (versão simplificada)

Essa é a versão nova, mais simples: **uma pasta só, um terminal só, um comando só pra ligar tudo.**

## Passo a passo

**1. Extraia o zip** numa pasta nova (recomendo apagar a pasta `impulse-plus` antiga, se você ainda tiver ela, pra não misturar as duas versões).

**2. Abra o cmd** (tecla Windows → digite `cmd` → Enter)

**3. Entre na pasta** (troque pelo caminho onde você extraiu):
```
cd C:\Users\Danilo\Desktop\impulse-plus-unico
```

**4. Instale as dependências:**
```
npm install
```
Espera terminar (só instala coisas do backend agora — bem mais rápido que antes, porque não tem mais Vite/React pra baixar).

**5. Copie o arquivo de configuração:**
```
copy .env.example .env
```

**6. Popule o banco de dados:**
```
npm run seed
```

**7. Ligue tudo:**
```
npm start
```

Deve aparecer: `Impulse+ rodando em http://localhost:4000`

**8. Abra o navegador** e digite:
```
localhost:4000
```

Pronto — só isso! Não precisa de uma segunda janela de cmd, não precisa rodar `npm run dev` separado. Um terminal, um comando (`npm start`), um endereço (`localhost:4000`).

## Da próxima vez que for abrir

Só repete os passos 2, 3 e 7:
```
cd C:\Users\Danilo\Desktop\impulse-plus-unico
npm start
```

E abre `localhost:4000` no navegador.

## Se der erro

- **"npm não é reconhecido"** → o Node.js não está instalado ou o terminal foi aberto antes de instalar. Reinstale o Node.js (nodejs.org) e abra um cmd novo.
- **Tela branca no navegador** → aperta F12, vai na aba Console, e me manda o erro que aparecer.
- **"porta já em uso"** → feche qualquer outra janela de cmd que ainda esteja rodando uma versão antiga do projeto.
