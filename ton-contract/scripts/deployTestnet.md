# Deploy contract to TON testnet

Ниже минимальные шаги деплоя через `@ton/blueprint`:

1. Установить локальные зависимости (рекомендуется, чтобы избежать `Invalid address` из-за разных версий `@ton/core`):

```bash
npm install
```

2. В папке `ton-contract` инициализировать blueprint-проект (если еще не инициализирован).  
Имя должно быть в PascalCase:

```bash
npx blueprint create Attendance
```

3. Собрать контракт:

```bash
npx blueprint build
```

4. Подключить кошелек с testnet TON и задеплоить:

```bash
npx blueprint run
```

5. После деплоя сохранить адрес:

- `TON_TESTNET_CONTRACT=EQ...`

6. Обновить frontend `.env`:

- `VITE_CONTRACT_ADDRESS=EQ...`

7. Проверить контракт через TON viewer testnet:

- `https://testnet.tonviewer.com/<contract_address>`
