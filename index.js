require('dotenv').config();
const app = require('./app');

const PORT = process.env.APP_PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
