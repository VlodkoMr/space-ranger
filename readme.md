# Space Ranger

some story...

## Getting Started

These instructions will get you a copy of the project up and running on your local testnet for development and testing purposes.

### Prerequisites

```
nodeJS
npm
```

### Installing

Install dependencies and create environment file:

```
npm install
cp .env.sample .env
```

Fill environment variables in .env file

### Build & Deploy

```
npm run deploy
npm run start
```

## Production

```
npm run deploy:polygon
npm run build:polygon
```

- Update CONTRACT_PROXY in src/backend/scripts/update.polygon.js
- Deploy frontend or use Spheron network for CI/CD
- Fill environment variables: .env.mainnet.polygon

### Verify Smart Contract

```
npm run verify:polygon
```

### Update Smart Contract

```
npm run update:polygon
```
