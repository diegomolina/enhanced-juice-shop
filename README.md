# Test Shop

An online store for a variety of merchandise. Customers can browse
and search the product catalog, register and sign in, manage a basket, check out
with saved addresses and payment methods, write product reviews, send feedback
and complaints, and chat with the shop assistant.

The backend is a Node.js/Express server with a SQLite database; the frontend is an
Angular single-page application.

## Prerequisites

- Node.js 22, 24 or 26 (see `engines` in `package.json`)
- npm
- Docker (optional, for container usage)

## Install

```bash
npm install
```

This installs the server and frontend dependencies and builds both parts of the
application.

## Run

```bash
npm start
```

The shop is then available at <http://localhost:3000>.

For development with automatic reloading of the server and the frontend:

```bash
npm run serve:dev
```

## Docker

Build the image:

```bash
docker build -t test-shop .
```

Run the container:

```bash
docker run --rm -p 3000:3000 test-shop
```

The shop is then available at <http://localhost:3000>.

## Configuration

Application settings such as the shop name, theme, product catalog and chatbot
options live in `config/default.yml`.

## License

See [LICENSE](LICENSE).
