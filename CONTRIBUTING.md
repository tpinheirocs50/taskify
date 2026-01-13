# 🚀 Guia de Workflow Git & GitHub

Este guia define como vamos trabalhar no projeto para garantir que o código na `main` está sempre a funcionar e que não apagamos o trabalho uns dos outros.

**Regra de Ouro:** Ninguém faz commits diretos na `main`. Tudo passa por Branches e Pull Requests.

---

## 1. O Ciclo de Trabalho (Passo a Passo)

Sempre que te sentares para trabalhar (seja para adicionar uma feature nova ou corrigir um bug), segue rigorosamente estes passos:

### Passo 1: Atualizar a base (Antes de tudo!)
Antes de escreveres uma única linha de código, garante que o teu projeto local está atualizado com o que está no GitHub.

```bash
git checkout main
git pull origin main
```
*Isto garante que não começas a trabalhar em cima de código velho.*

### Passo 2: Criar a tua Branch
Cria uma "sala isolada" para trabalhares. Dá um nome descritivo à branch. *Convenção:* `tipo/nome-da-tarefa` (Ex: `feature/login`, `fix/botao-voltar`, `style/header`)

```Bash
git checkout -b feature/minha-tarefa
```

### Passo 3: Programar e "Committar"
Faz o teu trabalho. Vai salvando (committing) frequentemente.

```Bash
git add .
git commit -m "Adiciona formulário de login"
```

### Passo 4: Preparar o envio (O segredo anti-conflitos)
Antes de enviares para o GitHub, verifica se entretanto a `main` foi atualizada.

1. Vai à main e atualiza:

```Bash
git checkout main
git pull origin main
```

2. Volta à tua branch e traz as novidades para lá:

```Bash
git checkout feature/minha-tarefa
git merge main
```

*Se houver conflitos, resolve-os aqui no teu PC (VS Code), é seguro. Se não houver, estás pronto.*

### Passo 5: Enviar para o GitHub (Push)

```Bash
git push -u origin feature/minha-tarefa
```

*(O GitHub vai devolver um link no terminal para criares o PR automaticamente, podes clicar lá).*

---

## 2. O Processo de Pull Request (PR)

Depois de fazeres o push, vais ao GitHub:

1. Clica em **"Compare & pull request".**
2. **Título**: Sê claro (Ex: "Implementa Autenticação JWT").
3. **Descrição**: Explica o que fizeste. Se for visual, coloca um print.
4. **Reviewers**: O GitHub vai notificar o code owner automaticamente.
5. **Create Pull Request.**

**O que acontece a seguir?**

- O botão de "Merge" vai estar bloqueado ou amarelo.
- O dono do repo recebe a notificação, revê o código e aprova.
- **Se pedir alterações:** Fazes as alterações no teu PC, fazes novo commit e novo push na mesma branch. O PR atualiza sozinho.
- **Se aprovar:** O Merge é feito e o código entra na `main.` 🎉

---

## 3. Boas Práticas

- **Commits Pequenos:** Não faças um commit chamado "Fiz o projeto todo". Faz commits granulares: "Cria navbar", "Ajusta cores", "Corrige bug no footer". É mais fácil de reverter se der erro.

- **Mensagens no Imperativo:** Escreve como se estivesses a dar uma ordem ao computador.
	- ✅ "Adiciona filtro" 
	- ❌ "Adicionei o filtro"

- **Nunca trabalhes na branch do colega:** A não ser que seja combinado. Cada um na sua branch.

- **Apagar branches velhas:** Depois do PR ser aceite e fundido na `main`, podes apagar a tua branch local para manter a organização (`git branch -d nome-da-branch`).

