# Como Limpar os Dados da Aplicação

## Método 1: Console do Navegador (Recomendado)

1. Abra a aplicação em http://localhost:7200
2. Pressione `F12` para abrir o DevTools
3. Vá para a aba **Console**
4. Cole e execute estes comandos:

```javascript
// Remover todos os feeds
localStorage.removeItem('feeds');

// Remover todas as chaves de API
localStorage.removeItem('aiApiKeys');

// Remover todos os artigos salvos
localStorage.removeItem('feedArticles');

// Remover preferências do usuário
localStorage.removeItem('userPreferences');

// Confirmar que foi limpo
console.log('Dados removidos!');
console.log('Feeds:', localStorage.getItem('feeds'));
console.log('API Keys:', localStorage.getItem('aiApiKeys'));
```

5. Recarregue a página (`F5`)

## Método 2: Limpar Todo o localStorage

Console do navegador:
```javascript
localStorage.clear();
location.reload();
```

## Método 3: DevTools Application Tab

1. `F12` → Aba **Application**
2. No menu lateral: **Storage** → **Local Storage** → `http://localhost:7200`
3. Clique com botão direito → **Clear**
4. Recarregue a página

---

**Depois de limpar, a aplicação estará limpa sem seus feeds de teste!**
